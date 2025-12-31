import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

let prevMessage = "";

const CHAT_SELECTOR_OBJ = {
  // 個別のコメントリスト
  messageNodes: 'div[jsname="dTKtvb"]',
} as const;

const POPUP_SELECTOR_OBJ = {
  messageNodes: `div.huGk4e`,
} as const;

const extractMessageFromThread = (): string | undefined => {
  const messageNodes = document.querySelectorAll(CHAT_SELECTOR_OBJ.messageNodes);
  if (messageNodes.length === 0) return;

  const latestMessageNode = messageNodes[messageNodes.length - 1];

  const messageText = latestMessageNode.textContent || "";

  return messageText;
};

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

    if (popupMessageNodes.length > 0) {
      message = popupMessageNodes[popupMessageNodes.length - 1].textContent || "";
    } else {
      message = extractMessageFromThread();
    }

    if (!message) return;

    if (message === prevMessage) return;

    prevMessage = message;

    chrome.runtime.sendMessage({
      method: "setComment",
      value: decodeHTMLSpecialWord(message),
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
