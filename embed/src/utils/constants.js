export const CHAT_UI_REOPEN = "___SolnAI-chat-widget-open___";
export function parseStylesSrc(scriptSrc = null) {
  try {
    const _url = new URL(scriptSrc);
    _url.pathname = _url.pathname
      .replace("SolnAI-chat-widget.js", "SolnAI-chat-widget.min.css")
      .replace(
        "SolnAI-chat-widget.min.js",
        "SolnAI-chat-widget.min.css"
      );
    return _url.toString();
  } catch {
    return "";
  }
}
