import { injectComment } from "./injectComment";

const StorageKeys = {
  Comment: "comment",
  CommentColor: "commentColor",
  Color: "color",
  FontSize: "fontSize",
  FontFamily: "fontFamily",
  IsEnabledStreaming: "isEnabledStreaming",
} as const;

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.method) {
    case "setComment":
      chrome.storage.local.set({
        comment: request.value,
        commentColor: request.color,
      });
      return true;
    case "deleteComment":
      chrome.storage.local.remove([StorageKeys.Comment]);
      return true;
    case "injectCommentToFocusedTab":
      chrome.storage.local.get([StorageKeys.Comment, StorageKeys.CommentColor]).then((res) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs[0]?.id || !res[StorageKeys.Comment]) return;

          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: injectComment,
            args: [res[StorageKeys.Comment], res[StorageKeys.CommentColor]],
          });
        });
      });
      return true;
    case "setColor":
      chrome.storage.local.set({
        color: request.value,
      });
      return true;
    case "getColor":
      chrome.storage.local.get([StorageKeys.Color]).then((res) => {
        sendResponse(res[StorageKeys.Color]);
      });
      return true;
    case "setFontSize":
      chrome.storage.local.set({
        fontSize: request.value,
      });
      return true;
    case "getFontSize":
      chrome.storage.local.get([StorageKeys.FontSize]).then((res) => {
        sendResponse(res[StorageKeys.FontSize]);
      });
      return true;
    case "setFontFamily":
      chrome.storage.local.set({
        fontFamily: request.value,
      });
      return true;
    case "getFontFamily":
      chrome.storage.local.get([StorageKeys.FontFamily]).then((res) => {
        sendResponse(res[StorageKeys.FontFamily]);
      });
      return true;
    case "setIsEnabledStreaming":
      chrome.storage.local.set({
        isEnabledStreaming: request.value,
      });
      return true;
    case "getIsEnabledStreaming":
      chrome.storage.local.get([StorageKeys.IsEnabledStreaming]).then((res) => {
        if (typeof res[StorageKeys.IsEnabledStreaming] !== "boolean") return;
        sendResponse(res[StorageKeys.IsEnabledStreaming]);
      });
      return true;
    case "toggleIsEnabledStreaming":
      chrome.storage.local.get([StorageKeys.IsEnabledStreaming]).then((res) => {
        const current = res[StorageKeys.IsEnabledStreaming] ?? false;
        const newValue = !current;
        chrome.storage.local.set({ isEnabledStreaming: newValue });
        sendResponse(newValue);
      });
      return true;
    default:
      console.log("no method");
      return true;
  }
});
