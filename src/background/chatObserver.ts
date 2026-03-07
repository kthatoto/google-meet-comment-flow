// chat.google.com iframe内に注入される関数
// chrome.scripting.executeScript の func として使うため、自己完結型
export const chatObserverFunc = () => {
  const processedMessageIds = new Set<string>();
  let initialized = false;

  const decodeHTMLSpecialWord = (str: string): string => {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x60/g, "`");
  };

  const getMessageText = (container: Element): string | undefined => {
    const textEl = container.querySelector('div[jsname="bgckF"]');
    if (textEl) {
      return textEl.textContent?.trim() || undefined;
    }
    return undefined;
  };

  const processMessages = async () => {
    try {
      if (!chrome.runtime?.id) {
        observer.disconnect();
        return;
      }

      const messageContainers = document.querySelectorAll(
        "div[data-id][data-user-id]"
      );

      if (!initialized && messageContainers.length > 0) {
        for (const container of messageContainers) {
          const id = container.getAttribute("data-id");
          if (id) processedMessageIds.add(id);
        }
        initialized = true;
        return;
      }

      const isEnabledStreaming = await chrome.runtime.sendMessage({
        method: "getIsEnabledStreaming",
      });

      if (!isEnabledStreaming) return;

      for (const container of messageContainers) {
        const id = container.getAttribute("data-id");
        if (!id || processedMessageIds.has(id)) continue;

        processedMessageIds.add(id);

        const message = getMessageText(container);
        if (!message) continue;

        chrome.runtime.sendMessage({
          method: "injectComment",
          value: decodeHTMLSpecialWord(message),
        });
      }
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes("Extension context invalidated")
      ) {
        observer.disconnect();
        return;
      }
      console.error("[chatObserver] Error:", e);
    }
  };

  const observer = new MutationObserver((mutations) => {
    const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (!hasAddedNodes) return;
    processMessages();
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
};
