"use client";

import React, { useRef } from "react";
import type { Widget } from "@/types/canvas";
import { cn } from "@/lib/utils";

interface TextBlockProps {
  widget: Widget;
  onUpdate: (data: Partial<Widget>) => void;
  isEditing?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({ widget, onUpdate }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (contentRef.current) {
      const rawHtml = contentRef.current.innerHTML;
      const processedHtml = processPseudoMarkdown(rawHtml);

      // Only update if changed to avoid unnecessary re-renders or cursor jumps if we were strict
      if (rawHtml !== processedHtml) {
        contentRef.current.innerHTML = processedHtml;
        onUpdate({ content: processedHtml });
      } else {
        onUpdate({ content: rawHtml });
      }
    }
  };

  const handleFocus = () => {
    if (contentRef.current) {
      const currentHtml = contentRef.current.innerHTML;
      const markdown = revertToMarkdown(currentHtml);
      // Only update if the markdown conversion actually changed the content
      // This prevents unnecessary DOM manipulation if the content is already in markdown-like form
      if (currentHtml !== markdown) {
        contentRef.current.innerHTML = markdown;
      }
    }
  };

  const revertToMarkdown = (html: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Helper function to process inline elements
    const processInlineNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();

        const content = Array.from(el.childNodes).map(processInlineNode).join("");

        switch (tagName) {
          case "b":
          case "strong":
            return `**${content}**`;
          case "i":
          case "em":
            return `*${content}*`;
          case "u":
            return `__${content}__`;
          case "s":
          case "strike":
            return `~~${content}~~`;
          case "br":
            return "<br>"; // Preserve <br> for line breaks within a block
          default:
            return content; // For other inline elements, just return their content
        }
      }
      return "";
    };

    // Helper function to process block elements
    const processBlockNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Top level text node, wrap in div
        if (node.textContent?.trim()) {
          return `<div>${node.textContent}</div>`;
        }
        return "";
      }
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === "ul" || tag === "ol") {
        return Array.from(el.children)
          .map((li, i) => {
            const prefix = tag === "ul" ? "- " : `${i + 1}. `;
            const inner = Array.from(li.childNodes)
              .map(processInlineNode)
              .join(""); // Process li content as inline
            return `<div>${prefix}${inner}</div>`;
          })
          .join("");
      }

      if (tag === "h1")
        return `<div># ${Array.from(el.childNodes).map(processInlineNode).join("")}</div>`;
      if (tag === "h2")
        return `<div>## ${Array.from(el.childNodes).map(processInlineNode).join("")}</div>`;
      if (tag === "h3")
        return `<div>### ${Array.from(el.childNodes).map(processInlineNode).join("")}</div>`;

      if (tag === "div" || tag === "p") {
        const inner = Array.from(el.childNodes).map(processBlockNode).join(""); // Recursively process children as blocks
        return `<div>${inner}</div>`;
      }

      // For other block-level elements or unhandled elements, treat their content as a block
      // and process their children as inline, then wrap in a div.
      const inlineContent = Array.from(el.childNodes)
        .map(processInlineNode)
        .join("");
      if (inlineContent.trim()) {
        return `<div>${inlineContent}</div>`;
      }
      return "";
    };

    // Process all top-level nodes in the temporary div
    return Array.from(tempDiv.childNodes).map(processBlockNode).join("");
  };

  const processPseudoMarkdown = (html: string): string => {
    // 1. Temporary container to parse HTML structure
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const nodes = Array.from(tempDiv.childNodes);
    let newHtml = "";
    let listBuffer: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const formatInline = (text: string): string => {
      return (
        text
          // Bold: **text**
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          // Underline: __text__ (Requested by user)
          .replace(/__(.*?)__/g, "<u>$1</u>")
          // Italic: *text* (Negative lookbehind/ahead for * to avoid matching ** parts?
          // Simpler: process ** first, then *. But * matches within ** if greedy?
          // The previous regex consumed **. So usually OK.
          // But `*` might match inside `<b>...</b>`? No, we replaced `*` with `<`.
          .replace(/\*(.*?)\*/g, "<i>$1</i>")
          // Strikethrough: ~~text~~
          .replace(/~~(.*?)~~/g, "<s>$1</s>")
      );
    };

    const flushList = () => {
      if (listBuffer.length > 0 && listType) {
        const listTag = listType;
        newHtml += `<${listTag} class="list-inside ${listTag === "ul" ? "list-disc" : "list-decimal"} pl-4 mb-2">`;
        newHtml += listBuffer
          .map((item) => `<li>${formatInline(item)}</li>`)
          .join("");
        newHtml += `</${listTag}>`;
        listBuffer = [];
        listType = null;
      }
    };

    nodes.forEach((node) => {
      // Check if node is element (div) or text
      const textContent = node.textContent?.trim() || "";

      // If empty, preserve <br> or similar if needed, or skip
      if (!textContent) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).tagName === "BR"
        ) {
          flushList();
          newHtml += "<br>";
        }
        return;
      }

      const bulletMatch = textContent.match(/^[-*]\s+(.*)/);
      const numberMatch = textContent.match(/^1\.\s+(.*)/);
      const h1Match = textContent.match(/^#\s+(.*)/);
      const h2Match = textContent.match(/^##\s+(.*)/);
      const h3Match = textContent.match(/^###\s+(.*)/);

      let isListItem = false;
      let currentType: "ul" | "ol" | null = null;
      let content = "";
      let handled = false; // New flag to prevent double processing

      if (h1Match) {
        flushList();
        newHtml += `<h1 class="text-3xl font-bold mb-4 mt-2 border-b border-white/10 pb-2">${formatInline(h1Match[1])}</h1>`;
        handled = true;
      } else if (h2Match) {
        flushList();
        newHtml += `<h2 class="text-2xl font-semibold mb-3 mt-2">${formatInline(h2Match[1])}</h2>`;
        handled = true;
      } else if (h3Match) {
        flushList();
        newHtml += `<h3 class="text-xl font-medium mb-2 mt-1">${formatInline(h3Match[1])}</h3>`;
        handled = true;
      } else if (bulletMatch) {
        isListItem = true;
        currentType = "ul";
        content = bulletMatch[1];
      } else if (numberMatch) {
        isListItem = true;
        currentType = "ol";
        content = numberMatch[1];
      } else if (listType && textContent.match(/^\d+\.\s+(.*)/)) {
        isListItem = true;
        currentType = "ol";
        content = textContent.match(/^\d+\.\s+(.*)/)![1];
      }

      if (handled) {
        // Already processed (e.g. heading)
      } else if (isListItem && currentType) {
        if (listType && listType !== currentType) {
          flushList();
        }
        listType = currentType;
        listBuffer.push(content);
      } else {
        flushList();
        // Apply inline formatting to the line
        const formatted = formatInline(textContent);
        newHtml += `<div>${formatted}</div>`;
      }
    });

    flushList();
    return newHtml || html;
  };

  return (
    <div className="group relative">
      <div
        ref={contentRef}
        className={cn(
          "min-h-[2em] p-2 outline-none focus:ring-1 focus:ring-[var(--color-primary)] rounded border border-transparent hover:border-white/10 transition-colors text-lg",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-white/30",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5", // Add styles for lists
        )}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onFocus={handleFocus}
        dangerouslySetInnerHTML={{ __html: widget.content || "" }}
        data-placeholder="Escribe aquí tus ideas..."
      />
    </div>
  );
};
