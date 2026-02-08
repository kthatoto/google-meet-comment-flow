import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

// 処理済みメッセージを記録（メッセージ内容 + インデックスで識別）
const seenMessages = new Set<string>();

const CHAT_SELECTOR_OBJ = {
  // 個別のコメントリスト
  messageNodes: 'div[jsname="dTKtvb"]',
} as const;

const POPUP_SELECTOR_OBJ = {
  messageNodes: `div.huGk4e`,
} as const;

// メッセージの一意キーを生成（同じ内容でも位置が違えば別メッセージ）
const getMessageKey = (text: string, index: number): string => {
  return `${index}:${text}`;
};

// Get the icon color from a user's avatar element
const extractIconColor = (messageNode: Element): string | undefined => {
  // Try to find the avatar/icon element near the message
  // Google Meet uses various structures, try common patterns
  const parent = messageNode.closest('[data-sender-id]') || messageNode.parentElement?.parentElement?.parentElement;
  if (!parent) return undefined;

  // Look for avatar with background color (for users without profile picture)
  const avatarSelectors = [
    'div[style*="background-color"]',
    'div[data-iph] div[style*="background"]',
    '.kssMUb', // Google Meet avatar class
  ];

  for (const selector of avatarSelectors) {
    const avatarEl = parent.querySelector(selector);
    if (avatarEl) {
      const style = window.getComputedStyle(avatarEl);
      const bgColor = style.backgroundColor;
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor;
      }
    }
  }

  // Try to get color from any element with explicit background-color in style attribute
  const styledElements = parent.querySelectorAll('[style*="background"]');
  for (const el of styledElements) {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' && bgColor !== 'rgb(255, 255, 255)') {
      return bgColor;
    }
  }

  return undefined;
};

// 全メッセージを取得して、未処理のものを返す
const extractNewMessages = (): Array<{ message: string; color?: string }> => {
  const newMessages: Array<{ message: string; color?: string }> = [];

  // チャットパネルのメッセージを確認
  const chatMessageNodes = document.querySelectorAll(CHAT_SELECTOR_OBJ.messageNodes);
  const popupMessageNodes = document.querySelectorAll(POPUP_SELECTOR_OBJ.messageNodes);

  const messageNodes = popupMessageNodes.length > 0 ? popupMessageNodes : chatMessageNodes;

  messageNodes.forEach((node, index) => {
    const messageText = node.textContent || "";
    if (!messageText) return;

    const key = getMessageKey(messageText, index);

    // 未処理のメッセージのみ追加
    if (!seenMessages.has(key)) {
      seenMessages.add(key);
      const iconColor = extractIconColor(node);
      newMessages.push({ message: messageText, color: iconColor });
    }
  });

  return newMessages;
};

// 現在表示されているメッセージを既読としてマーク（初期化用）
const markExistingMessagesAsSeen = (): void => {
  const chatMessageNodes = document.querySelectorAll(CHAT_SELECTOR_OBJ.messageNodes);
  const popupMessageNodes = document.querySelectorAll(POPUP_SELECTOR_OBJ.messageNodes);

  const messageNodes = popupMessageNodes.length > 0 ? popupMessageNodes : chatMessageNodes;

  messageNodes.forEach((node, index) => {
    const messageText = node.textContent || "";
    if (messageText) {
      seenMessages.add(getMessageKey(messageText, index));
    }
  });
};

// Keyboard shortcut handler (Ctrl+Shift+S to toggle streaming)
document.addEventListener("keydown", async (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    try {
      if (!chrome.runtime?.id) return;
      const newValue = await chrome.runtime.sendMessage({
        method: "toggleIsEnabledStreaming",
      });
      console.log(`[Google Meet Comment Flow] Streaming ${newValue ? "enabled" : "disabled"}`);
    } catch (err) {
      console.error("[Google Meet Comment Flow] Failed to toggle streaming:", err);
    }
  }
});

const observer = new MutationObserver(async (mutations: MutationRecord[]) => {
  try {
    // 何かDOMに変更があったかチェック
    const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
    if (!hasAddedNodes) return;

    // 拡張機能のコンテキストが有効かチェック
    if (!chrome.runtime?.id) {
      observer.disconnect();
      return;
    }

    const isEnabledStreaming = await chrome.runtime.sendMessage({
      method: "getIsEnabledStreaming",
    });

    if (!isEnabledStreaming) return;

    // 未処理の新しいメッセージを全て取得
    const newMessages = extractNewMessages();

    // 各メッセージを順番に送信
    for (const { message, color } of newMessages) {
      chrome.runtime.sendMessage({
        method: "setComment",
        value: decodeHTMLSpecialWord(message),
        color: color,
      });
      // 連続送信の場合は少し間隔を空ける
      if (newMessages.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (e) {
    // Extension context invalidated エラーの場合はオブザーバーを停止
    if (e instanceof Error && e.message.includes("Extension context invalidated")) {
      observer.disconnect();
      return;
    }
    console.error("[saveComment] Error:", e);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // 既存のメッセージを既読としてマーク（拡張機能読み込み時点のメッセージは流さない）
  markExistingMessagesAsSeen();

  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
});
