"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  /** "textarea" allows Enter newlines; "input" commits on Enter */
  as?: "input" | "textarea";
  color?: string;
  style?: React.CSSProperties;
}

/**
 * WYSIWYG edit on the same node — no input swap, so titles don't jump.
 * Outline only (no border/padding/ring box model change).
 */
export function EditableText({
  initialValue,
  onSave,
  className,
  as = "input",
  style,
  color,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const elRef = useRef<HTMLSpanElement>(null);
  const propRef = useRef(initialValue);
  const editingRef = useRef(false);

  // Keep DOM text in sync with props only when not mid-edit
  useLayoutEffect(() => {
    propRef.current = initialValue;
    const el = elRef.current;
    if (!el || editingRef.current) return;
    if (el.textContent !== initialValue) {
      el.textContent = initialValue || "";
    }
  }, [initialValue]);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el || !isEditing) return;
    // React re-render can wipe contentEditable text — restore if needed
    if (!el.textContent && propRef.current) {
      el.textContent = propRef.current;
    }
    el.focus({ preventScroll: true });
    // Caret at end (no select-all — avoids big title flash)
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isEditing]);

  const startEdit = () => {
    if (editingRef.current) return;
    editingRef.current = true;
    setIsEditing(true);
  };

  const finish = (save: boolean) => {
    const el = elRef.current;
    const raw = (el?.textContent ?? "").replace(/\u00a0/g, " ");
    const next = raw.trim() || propRef.current;

    if (el) el.textContent = next;

    editingRef.current = false;
    setIsEditing(false);

    if (save && next !== propRef.current) {
      propRef.current = next;
      onSave(next);
    } else if (!save && el) {
      el.textContent = propRef.current || "";
    }
  };

  return (
    <span
      ref={elRef}
      role="textbox"
      tabIndex={0}
      contentEditable={isEditing}
      suppressContentEditableWarning
      aria-multiline={as === "textarea"}
      aria-label="Editable text"
      onClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEdit();
      }}
      onBlur={() => {
        if (editingRef.current) finish(true);
      }}
      onKeyDown={(e) => {
        if (!editingRef.current) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startEdit();
          }
          return;
        }

        // Block slide nav while typing
        e.stopPropagation();

        if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
          elRef.current?.blur();
          return;
        }

        if (e.key === "Enter" && as === "input") {
          e.preventDefault();
          finish(true);
          elRef.current?.blur();
        }
      }}
      className={cn(
        // Same box model in view + edit — no padding/border swap
        "text-inherit font-inherit leading-inherit tracking-inherit",
        "cursor-text rounded-[1px] outline-none",
        // outline lives outside box → no reflow; light wash only
        // box-shadow / background only — zero layout delta vs view mode
        isEditing
          ? "bg-current/[0.06] shadow-[0_0_0_2px_color-mix(in_oklab,currentColor_35%,transparent)] caret-current"
          : "hover:bg-current/[0.05]",
        as === "textarea"
          ? "inline-block w-full max-w-full whitespace-pre-wrap break-words"
          : "inline-block max-w-full break-words",
        className,
      )}
      style={{
        ...style,
        color,
        fontSize: "inherit",
        fontWeight: "inherit",
        fontFamily: "inherit",
        lineHeight: "inherit",
        letterSpacing: "inherit",
        textAlign: "inherit",
        // Same metrics view ↔ edit
        margin: 0,
        padding: 0,
        border: "none",
        minHeight: "1em",
        verticalAlign: "baseline",
      }}
    />
  );
}
