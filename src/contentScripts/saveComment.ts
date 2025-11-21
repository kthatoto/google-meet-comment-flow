import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

let prevThread: Node;
let prevPopupThread: Node;
let lastMessageId: string = "";

// チャットパネル全体
const CHAT_SELECTOR_BASE = 'div[jsname="b0t70b"].WUFI9b';

const CHAT_SELECTOR_OBJ = {
  container: CHAT_SELECTOR_BASE,
  // スレッド（コメントのリスト）
  thread: 'div[jsname="xySENc"].Ge9Kpc.z38b6',
  // 個別のコメント
  message: 'div[jsname="dTKtvb"]',
} as const;

const CHAT_CLASS_OBJ = {
  isHidden: "qdulke",
} as const;

// ポップアップチャット用（別ウィンドウで開いた場合）
const POPUP_SELECTOR_BASE = 'div.fJsklc.nulMpf.Didmac';

const POPUP_SELECTOR_OBJ = {
  container: POPUP_SELECTOR_BASE,
  thread: `${POPUP_SELECTOR_BASE} div.mIw6Bf`,
  // ポップアップでも同じコメント要素
  message: 'div[jsname="dTKtvb"]',
} as const;

const extractMessageFromPopupThread = (
  popupThread: Element | null
): string | undefined => {
  if (!popupThread || popupThread.isEqualNode(prevPopupThread)) return;

  prevPopupThread = popupThread.cloneNode(true);

  const messageNodes = popupThread.querySelectorAll(POPUP_SELECTOR_OBJ.message);

  if (messageNodes.length === 0) return;

  const messageNode = messageNodes[messageNodes.length - 1];

  // jsname="dTKtvb"の中の最初の<div>を取得
  const innerDiv = messageNode.querySelector("div");
  return innerDiv ? innerDiv.innerHTML : messageNode.innerHTML;
};

const extractMessageFromThread = (
  thread: Element | null
): string | undefined => {
  if (!thread || thread.isEqualNode(prevThread)) {
    console.log("[saveComment] Skipping - same thread");
    return;
  }

  prevThread = thread.cloneNode(true);

  const messageNodes = thread.querySelectorAll(CHAT_SELECTOR_OBJ.message);
  console.log("[saveComment] messageNodes:", messageNodes);
  console.log("[saveComment] messageNodes.length:", messageNodes.length);

  if (messageNodes.length === 0) return;

  const messageNode = messageNodes[messageNodes.length - 1];
  console.log("[saveComment] Latest message node:", messageNode);

  // jsname="dTKtvb"の中の最初の<div>を取得
  const innerDiv = messageNode.querySelector("div");
  const messageText = innerDiv ? innerDiv.innerHTML : messageNode.innerHTML;
  console.log("[saveComment] Message innerHTML:", messageText);

  // 同じメッセージを重複して送信しないようにチェック
  if (messageText === lastMessageId) {
    console.log("[saveComment] Skipping - duplicate message");
    return;
  }

  lastMessageId = messageText;
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

    console.log("[saveComment] isEnabledStreaming:", isEnabledStreaming);

    if (!isEnabledStreaming) return;

    const popupThread = document.querySelector(POPUP_SELECTOR_OBJ.thread);
    const container = document.querySelector(CHAT_SELECTOR_OBJ.container);
    const thread = document.querySelector(CHAT_SELECTOR_OBJ.thread);

    console.log("[saveComment] container:", container);
    console.log("[saveComment] thread:", thread);
    console.log("[saveComment] popupThread:", popupThread);

    const message =
      container && !container.classList.contains(CHAT_CLASS_OBJ.isHidden)
        ? extractMessageFromThread(thread)
        : extractMessageFromPopupThread(popupThread);

    console.log("[saveComment] Extracted message:", message);

    if (!message) return;

    chrome.runtime.sendMessage({
      method: "setComment",
      value: decodeHTMLSpecialWord(message),
    });
  } catch (e) {
    // Extension context invalidated エラーの場合はオブザーバーを停止
    if (e instanceof Error && e.message.includes("Extension context invalidated")) {
      console.log("[saveComment] Extension context invalidated, disconnecting observer");
      observer.disconnect();
      return;
    }
    console.error("[saveComment] Error:", e);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("[saveComment] DOMContentLoaded - Starting observer");
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
});
