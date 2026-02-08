import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

let prevMessage = "";

const CHAT_SELECTOR_OBJ = {
  // 個別のコメントリスト
  messageNodes: 'div[jsname="dTKtvb"]',
} as const;

const POPUP_SELECTOR_OBJ = {
  messageNodes: `div.huGk4e`,
} as const;

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

const extractMessageFromThread = (): { message: string; color?: string } | undefined => {
  const messageNodes = document.querySelectorAll(CHAT_SELECTOR_OBJ.messageNodes);
  if (messageNodes.length === 0) return;

  const latestMessageNode = messageNodes[messageNodes.length - 1];

  const messageText = latestMessageNode.textContent || "";
  const iconColor = extractIconColor(latestMessageNode);

  return { message: messageText, color: iconColor };
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
    const addedNode = mutations[0].addedNodes?.[0];

    if (addedNode?.nodeType !== Node.ELEMENT_NODE) return;

    // 拡張機能のコンテキストが有効かチェック
    if (!chrome.runtime?.id) {
      observer.disconnect();
      return;
    }

    const isEnabledStreaming = await chrome.runtime.sendMessage({
      method: "getIsEnabledStreaming",
    });

    if (!isEnabledStreaming) return;

    const popupMessageNodes = document.querySelectorAll(POPUP_SELECTOR_OBJ.messageNodes);

    let message: string | undefined;
    let iconColor: string | undefined;

    if (popupMessageNodes.length > 0) {
      const latestPopupNode = popupMessageNodes[popupMessageNodes.length - 1];
      message = latestPopupNode.textContent || "";
      iconColor = extractIconColor(latestPopupNode);
    } else {
      const result = extractMessageFromThread();
      if (result) {
        message = result.message;
        iconColor = result.color;
      }
    }

    if (!message) return;

    if (message === prevMessage) return;

    prevMessage = message;

    chrome.runtime.sendMessage({
      method: "setComment",
      value: decodeHTMLSpecialWord(message),
      color: iconColor,
    });
  } catch (e) {
    // Extension context invalidated エラーの場合はオブザーバーを停止
    if (e instanceof Error && e.message.includes("Extension context invalidated")) {
      observer.disconnect();
      return;
    }
    console.error("[saveComment] Error:", e);
  }
});

document.addEventListener("DOMContentLoaded", () =>
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  })
);
