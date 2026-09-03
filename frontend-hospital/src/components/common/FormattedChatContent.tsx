"use client";

import React from "react";

interface FormattedChatContentProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

/**
 * Renders structured markdown-like AI chat responses cleanly:
 * - Bold headers (###, ##, #)
 * - Bold text (**key: value** or **phrase**)
 * - Bulleted lists (- or *)
 * - Numbered lists (1. 2.)
 * - Code blocks and inline code
 * - Tables
 */
export function FormattedChatContent({
  content,
  className = "",
  isUser = false,
}: FormattedChatContentProps) {
  if (isUser) {
    return <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>{content}</div>;
  }

  // Parse markdown blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={`space-y-3 leading-relaxed text-[#15232b] text-[0.88rem] ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

interface Block {
  type: "heading" | "list" | "numbered-list" | "table" | "paragraph" | "code";
  level?: number;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  text?: string;
}

function parseMarkdownBlocks(raw: string): Block[] {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let currentList: string[] = [];
  let currentNumberedList: string[] = [];
  let currentTableRows: string[][] = [];
  let inTable = false;

  function flushList() {
    if (currentList.length > 0) {
      blocks.push({ type: "list", items: [...currentList] });
      currentList = [];
    }
  }

  function flushNumberedList() {
    if (currentNumberedList.length > 0) {
      blocks.push({ type: "numbered-list", items: [...currentNumberedList] });
      currentNumberedList = [];
    }
  }

  function flushTable() {
    if (currentTableRows.length > 0) {
      const headers = currentTableRows[0];
      const rows = currentTableRows.slice(1);
      blocks.push({ type: "table", headers, rows });
      currentTableRows = [];
      inTable = false;
    }
  }

  function flushAll() {
    flushList();
    flushNumberedList();
    flushTable();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    // Markdown Headings (###, ##, #)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    // Table Row Detection (| col 1 | col 2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      
      // Check if separator line (|---|---|)
      const isSeparator = cells.every((c) => /^[-:\s]+$/.test(c));
      if (isSeparator) {
        inTable = true;
        continue;
      }

      currentTableRows.push(cells);
      continue;
    } else if (inTable || currentTableRows.length > 0) {
      flushTable();
    }

    // Bullet list (- item or * item)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushNumberedList();
      flushTable();
      currentList.push(bulletMatch[1]);
      continue;
    } else {
      flushList();
    }

    // Numbered list (1. item)
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      flushList();
      flushTable();
      currentNumberedList.push(numMatch[2]);
      continue;
    } else {
      flushNumberedList();
    }

    // Normal paragraph
    flushAll();
    blocks.push({ type: "paragraph", text: trimmed });
  }

  flushAll();
  return blocks;
}

function renderFormattedInline(text: string): React.ReactNode {
  // Regex to split by bold **text**, inline `code`, or links
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Match **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Match `inline code`
    const codeMatch = remaining.match(/`(.+?)`/);

    let earliestMatchIndex = Infinity;
    let matchType: "bold" | "code" | null = null;
    let matchObj: RegExpMatchArray | null = null;

    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestMatchIndex) {
      earliestMatchIndex = boldMatch.index;
      matchType = "bold";
      matchObj = boldMatch;
    }
    if (codeMatch && codeMatch.index !== undefined && codeMatch.index < earliestMatchIndex) {
      earliestMatchIndex = codeMatch.index;
      matchType = "code";
      matchObj = codeMatch;
    }

    if (matchType && matchObj && matchObj.index !== undefined) {
      // Push string before match
      if (matchObj.index > 0) {
        parts.push(remaining.substring(0, matchObj.index));
      }

      const matchFull = matchObj[0];
      const matchInner = matchObj[1];

      if (matchType === "bold") {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-[#0c1920]">
            {matchInner}
          </strong>
        );
      } else if (matchType === "code") {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded-md bg-[#f3efe6] border border-[#d9d1c3] font-mono text-[0.8rem] text-[#0f6e6e] font-semibold"
          >
            {matchInner}
          </code>
        );
      }

      remaining = remaining.substring(matchObj.index + matchFull.length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return <>{parts}</>;
}

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const level = block.level || 2;
      if (level === 1) {
        return (
          <h2 key={index} className="text-base font-extrabold text-[#0c1920] pt-2 pb-1 border-b border-[#d9d1c3]/70">
            {renderFormattedInline(block.text || "")}
          </h2>
        );
      }
      if (level === 2) {
        return (
          <h3 key={index} className="text-sm font-bold text-[#0f6e6e] pt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f6e6e]" />
            <span>{renderFormattedInline(block.text || "")}</span>
          </h3>
        );
      }
      return (
        <h4 key={index} className="text-xs font-bold uppercase tracking-wider text-[#3d505a] pt-1">
          {renderFormattedInline(block.text || "")}
        </h4>
      );
    }

    case "list":
      return (
        <ul key={index} className="space-y-1.5 my-1.5 pl-1">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[0.85rem] text-[#15232b]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0f6e6e] mt-2 shrink-0" />
              <div className="flex-1">{renderFormattedInline(item)}</div>
            </li>
          ))}
        </ul>
      );

    case "numbered-list":
      return (
        <ol key={index} className="space-y-1.5 my-1.5 pl-1">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[0.85rem] text-[#15232b]">
              <span className="w-5 h-5 rounded-full bg-[#e4f2f1] text-[#0f6e6e] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">{renderFormattedInline(item)}</div>
            </li>
          ))}
        </ol>
      );

    case "table":
      return (
        <div key={index} className="my-3 border border-[#d9d1c3] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left">
            {block.headers && block.headers.length > 0 && (
              <thead className="bg-[#f3efe6] text-[#3d505a] font-bold">
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="p-2.5 border-b border-[#d9d1c3]">
                      {renderFormattedInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#d9d1c3]">
              {block.rows?.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#fbf9f4]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-[#15232b] font-medium">
                      {renderFormattedInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "paragraph":
    default:
      return (
        <p key={index} className="leading-relaxed text-[#15232b]">
          {renderFormattedInline(block.text || "")}
        </p>
      );
  }
}
