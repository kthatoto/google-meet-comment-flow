import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

// 処理済みメッセージを記録
const processedMessages = new Set<string>();

const CHAT_SELECTOR_OBJ = {
  messageNodes: 'div[jsname="dTKtvb"]',
} as const;

const POPUP_SELECTOR_OBJ = {
  messageNodes: `div.huGk4e`,
} as const;

// Get the icon color from a user's avatar element
const extractIconColor = (messageNode: Element): string | undefined => {
  const parent = messageNode.closest('[data-sender-id]') || messageNode.parentElement?.parentElement?.parentElement;
  if (!parent) return undefined;

  const avatarSelectors = [
    'div[style*="background-color"]',
    'div[data-iph] div[style*="background"]',
    '.kssMUb',
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
    const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
    if (!hasAddedNodes) return;

    if (!chrome.runtime?.id) {
      observer.disconnect();
      return;
    }

    const isEnabledStreaming = await chrome.runtime.sendMessage({
      method: "getIsEnabledStreaming",
    });

    if (!isEnabledStreaming) return;

    // メッセージノードを取得
    const popupMessageNodes = document.querySelectorAll(POPUP_SELECTOR_OBJ.messageNodes);
    const chatMessageNodes = document.querySelectorAll(CHAT_SELECTOR_OBJ.messageNodes);
    const messageNodes = popupMessageNodes.length > 0 ? popupMessageNodes : chatMessageNodes;

    // 各メッセージをチェック
    for (const node of messageNodes) {
      const message = node.textContent || "";
      if (!message) continue;

      // 既に処理済みならスキップ
      if (processedMessages.has(message)) continue;

      // 処理済みとしてマーク
      processedMessages.add(message);

      // アイコン色を取得
      const iconColor = extractIconColor(node);

      // 送信
      chrome.runtime.sendMessage({
        method: "setComment",
        value: decodeHTMLSpecialWord(message),
        color: iconColor,
      });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Extension context invalidated")) {
      observer.disconnect();
      return;
    }
    console.error("[saveComment] Error:", e);
  }
});

// 初期化時に既存メッセージを処理済みとしてマーク
const initializeProcessedMessages = () => {
  const popupMessageNodes = document.querySelectorAll(POPUP_SELECTOR_OBJ.messageNodes);
  const chatMessageNodes = document.querySelectorAll(CHAT_SELECTOR_OBJ.messageNodes);
  const messageNodes = popupMessageNodes.length > 0 ? popupMessageNodes : chatMessageNodes;

  for (const node of messageNodes) {
    const message = node.textContent || "";
    if (message) {
      processedMessages.add(message);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initializeProcessedMessages();
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
});
