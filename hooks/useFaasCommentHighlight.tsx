"use client";

import { type ReactNode, useEffect, useMemo, useRef } from "react";

interface HighlightableComment {
  field_name?: string | null;
  comment_text?: string;
  suggested_value?: string | null;
  author_name?: string | null;
}

interface UseFaasCommentHighlightOptions {
  activeComment: HighlightableComment | null;
  fieldLabels?: Record<string, string>;
  showInlineComment?: boolean;
  scrollToField?: boolean;
}

const HIGHLIGHT_SCOPE_CLASS = "faas-comment-highlight-scope";
const INLINE_COMMENT_ID = "faas-inline-comment";

function clearCommentHighlights() {
  document.getElementById(INLINE_COMMENT_ID)?.remove();
}

function escapeFieldToken(field: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(field);
  }
  return field.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function appendText(parent: HTMLElement, text: string, tagName?: "strong" | "em" | "span") {
  const node = tagName ? document.createElement(tagName) : document.createTextNode(text);
  if (tagName) node.textContent = text;
  parent.appendChild(node);
  return node;
}

function addInlineCommentRow(
  anchorEl: Element,
  comment: HighlightableComment,
  fieldLabel: string
) {
  const anchorRow = anchorEl.closest("tr") ?? anchorEl;
  const noteRow = document.createElement("tr");
  noteRow.id = INLINE_COMMENT_ID;
  noteRow.className = "faas-inline-comment-row";

  const td = document.createElement("td");
  td.colSpan = 10;
  appendText(td, "Comment: ");
  appendText(td, `${fieldLabel}: `, "strong");
  appendText(td, comment.comment_text ?? "");

  if (comment.suggested_value) {
    appendText(td, " Suggested: ");
    appendText(td, comment.suggested_value, "em");
  }

  if (comment.author_name) {
    appendText(td, ` - ${comment.author_name}`, "span");
  }

  noteRow.appendChild(td);
  anchorRow.insertAdjacentElement("afterend", noteRow);
}

function getCommentFields(activeComment: HighlightableComment | null) {
  return (
    activeComment?.field_name
      ?.split(",")
      .map((field) => field.trim())
      .filter(Boolean) ?? []
  );
}

function getFieldSelector(field: string) {
  return `.${HIGHLIGHT_SCOPE_CLASS} [data-field~="${escapeFieldToken(field)}"]`;
}

function buildHighlightCss(fields: string[]) {
  if (fields.length === 0) return "";

  const selectors = fields.map(getFieldSelector).join(",\n");
  return `${selectors} {
  background-color: #fef9c3 !important;
  outline: 2px solid #f59e0b;
  outline-offset: -2px;
}`;
}

export function FaasCommentHighlightScope({
  activeComment,
  children,
  fieldLabels = {},
  showInlineComment = false,
  scrollToField = true,
}: UseFaasCommentHighlightOptions & { children: ReactNode }) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const fields = useMemo(() => getCommentFields(activeComment), [activeComment]);
  const highlightCss = useMemo(() => buildHighlightCss(fields), [fields]);

  useEffect(() => {
    clearCommentHighlights();

    if (!activeComment?.field_name || fields.length === 0) {
      return clearCommentHighlights;
    }

    const scope = scopeRef.current ?? document;
    const highlightedElements = fields.flatMap((field) =>
      Array.from(scope.querySelectorAll(`[data-field~="${escapeFieldToken(field)}"]`))
    );

    const firstEl = highlightedElements[0] ?? null;

    if (firstEl && scrollToField) {
      firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (showInlineComment && firstEl && activeComment.comment_text) {
      const firstField = fields[0] ?? "";
      addInlineCommentRow(
        firstEl,
        activeComment,
        fieldLabels[firstField] ?? firstField
      );
    }

    return clearCommentHighlights;
  }, [activeComment, fieldLabels, fields, scrollToField, showInlineComment]);

  return (
    <div ref={scopeRef} className={HIGHLIGHT_SCOPE_CLASS}>
      {highlightCss && <style>{highlightCss}</style>}
      {children}
    </div>
  );
}

export function useFaasCommentHighlight({
  activeComment,
  fieldLabels = {},
  showInlineComment = false,
  scrollToField = true,
}: UseFaasCommentHighlightOptions) {
  useEffect(() => {
    clearCommentHighlights();

    if (!activeComment?.field_name) {
      return clearCommentHighlights;
    }

    const fields = getCommentFields(activeComment);
    const highlightedElements = fields.flatMap((field) =>
      Array.from(document.querySelectorAll(`[data-field~="${escapeFieldToken(field)}"]`))
    );

    const firstEl = highlightedElements[0] ?? null;

    if (firstEl && scrollToField) {
      firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (showInlineComment && firstEl && activeComment.comment_text) {
      const firstField = fields[0] ?? "";
      addInlineCommentRow(
        firstEl,
        activeComment,
        fieldLabels[firstField] ?? firstField
      );
    }

    return clearCommentHighlights;
  }, [activeComment, fieldLabels, scrollToField, showInlineComment]);
}
