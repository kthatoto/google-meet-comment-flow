import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

let prevThread: Node;
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

const extractMessageFromThread = (
  thread: Element | null
): string | undefined => {
  if (!thread || thread.isEqualNode(prevThread)) {
    return;
  }

  prevThread = thread.cloneNode(true);

  const messageNodes = thread.querySelectorAll(CHAT_SELECTOR_OBJ.message);

  if (messageNodes.length === 0) return;

  const messageNode = messageNodes[messageNodes.length - 1];

  const messageText = messageNode.textContent || "";

  // 同じメッセージを重複して送信しないようにチェック
  if (messageText === lastMessageId) {
    return;
  }

  lastMessageId = messageText;
  return messageText;
};

// FIX: 一つコメントが投稿されたら二回triggerが走ってしまう
// そのため、同じメッセージを二回連続で送信したら流れないようになっている。
const observer = new MutationObserver(async (mutations: MutationRecord[]) => {
  console.log("[saveComment] MutationObserver triggered", Date.now());
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

    const container = document.querySelector(CHAT_SELECTOR_OBJ.container);
    const thread = document.querySelector(CHAT_SELECTOR_OBJ.thread);

    const message = extractMessageFromThread(thread)

    if (!message) return;

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

document.addEventListener("DOMContentLoaded", () => {
  // 不要な発火を防ぐため、監視対象DOMをThreadに限定する
  const checkThread = setInterval(() => {
    const thread = document.querySelector(CHAT_SELECTOR_OBJ.thread);
    if (thread) {
      clearInterval(checkThread);
        observer.observe(thread, {
        subtree: true,
        childList: true,
      });
      console.log("[saveComment] Started observing thread");
    }
  }, 100);
});
