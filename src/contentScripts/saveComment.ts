import { decodeHTMLSpecialWord } from "./utils/decodeHTMLSpecialWord";

// meet.google.com 上で動作するcontent script
// - キーボードショートカット (Ctrl+Shift+S)
// - ポップアップ通知の監視 (チャットパネルが閉じている時に表示される通知)
// ※ チャットメッセージ本体は chat.google.com iframe内で chatObserver.ts が監視

const processedNodes = new WeakSet<Element>();
let initialized = false;

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

    // ポップアップ通知を検出 (チャットパネルが閉じている時の通知バブル)
    // meet.google.com上に表示されるチャット通知を監視
    const popupNodes = document.querySelectorAll(
      'div[jsname="ocqpFe"] div[jsname="bgckF"], div[data-message-text]'
    );

    if (popupNodes.length === 0) return;

    if (!initialized && popupNodes.length > 0) {
      for (const node of popupNodes) {
        processedNodes.add(node);
      }
      initialized = true;
      return;
    }

    const isEnabledStreaming = await chrome.runtime.sendMessage({
      method: "getIsEnabledStreaming",
    });

    if (!isEnabledStreaming) return;

    for (const node of popupNodes) {
      if (processedNodes.has(node)) continue;

      const message = node.textContent || "";
      if (!message) continue;

      processedNodes.add(node);

      chrome.runtime.sendMessage({
        method: "injectComment",
        value: decodeHTMLSpecialWord(message),
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

document.addEventListener("DOMContentLoaded", () => {
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
});
