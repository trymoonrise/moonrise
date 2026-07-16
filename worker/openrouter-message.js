/**
 * OpenRouter / MiniMax message parsing.
 *
 * MiniMax M2.x keeps reasoning on by default and counts those tokens against
 * max_tokens. When that budget runs out first, message.content is null.
 * On some responses the page is written into reasoning instead of content.
 * Callers that expect HTML must recover a real document from either field.
 */

function stripModelThinking(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .trim();
}

function stripCodeFence(text) {
  return String(text || "")
    .replace(/^```(?:html|json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function flattenMessageContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const bits = [];
  for (const part of content) {
    if (typeof part === "string") {
      if (part.trim()) bits.push(part);
      continue;
    }
    if (!part || typeof part !== "object") continue;
    const text = part.text || part.content || part.output_text;
    if (typeof text === "string" && text.trim()) bits.push(text);
  }
  return bits.join("\n");
}

function collectReasoningText(message) {
  if (!message || typeof message !== "object") return "";
  const bits = [];
  const push = (value) => {
    if (typeof value === "string" && value.trim()) bits.push(value);
  };
  push(message.reasoning);
  push(message.reasoning_content);
  const details = message.reasoning_details;
  if (Array.isArray(details)) {
    for (const part of details) {
      if (!part || typeof part !== "object") continue;
      push(part.text);
      push(part.content);
      push(part.summary);
      const response = part.response;
      if (response && typeof response === "object") {
        push(response.output_text);
        push(response.text);
      }
    }
  }
  return bits.join("\n");
}

/** True when text contains the start of an HTML document, any casing. */
function hasHtmlDocumentStart(html) {
  return /<!doctype\s+html\b|<html[\s>]/i.test(String(html || ""));
}

function extractHtmlDocument(text) {
  let raw = stripCodeFence(stripModelThinking(text));
  const start = raw.search(/<!doctype\s+html\b|<html[\s>]/i);
  if (start > 0) raw = raw.slice(start).trim();
  return stripCodeFence(raw);
}

/**
 * Pull a full page out of reasoning text.
 * Ignores short echoes of the prompt (a quoted doctype with no document).
 */
function salvageHtmlFromReasoning(reasoning) {
  const text = String(reasoning || "");
  const re = /<!doctype\s+html\b|<html[\s>]/gi;
  let match;
  let best = "";
  while ((match = re.exec(text))) {
    const slice = text.slice(match.index).trim();
    const near = slice.slice(0, 1200);
    const structured =
      (/<!doctype\s+html\b/i.test(near.slice(0, 32)) && /<html[\s>]/i.test(near)) ||
      /^<html[\s>]/i.test(slice);
    const end = slice.search(/<\/html>/i);
    const closed = structured && end >= 0 && /<(head|body)\b/i.test(slice.slice(0, end));
    const doc = closed ? slice.slice(0, end + "</html>".length) : "";
    if (doc.length >= 400 && doc.length > best.length) best = doc;
    if (match.index === re.lastIndex) re.lastIndex += 1;
  }
  return best ? extractHtmlDocument(best) : "";
}

/**
 * Visible assistant text, with HTML recovered from reasoning when needed.
 * JSON / prose callers keep non-empty content even if reasoning mentions tags.
 */
function resolveAssistantContent(message, { expectHtml = false } = {}) {
  const visible = stripCodeFence(stripModelThinking(flattenMessageContent(message?.content)));
  const visibleHtml = extractHtmlDocument(visible);
  if (hasHtmlDocumentStart(visibleHtml)) return visibleHtml;

  const salvaged = salvageHtmlFromReasoning(collectReasoningText(message));
  if (hasHtmlDocumentStart(salvaged) && (expectHtml || !visible)) return salvaged;
  if (visible) return visible;
  // Don't hand back a reasoning essay just because it quotes a doctype.
  if (expectHtml) return "";

  return stripCodeFence(stripModelThinking(collectReasoningText(message)));
}

module.exports = {
  resolveAssistantContent,
  hasHtmlDocumentStart,
  extractHtmlDocument,
  salvageHtmlFromReasoning,
  flattenMessageContent,
};
