"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
  as?: "input" | "textarea";
  color?: string;
  style?: React.CSSProperties;
}

export function EditableText({
  initialValue,
  onSave,
  className,
  as = "input",
  style,
  color,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync internal state with prop if it changes externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = (e: React.FocusEvent) => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && as === "input") {
      e.preventDefault(); // Prevent newline in input
      (e.currentTarget as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          "relative group",
          as === "textarea" ? "w-full" : "inline-block",
        )}
      >
        {as === "textarea" ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(`min-h-15`, className)}
            style={{ ...style, color }}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn("min-w-50", className)}
            style={{ ...style, color }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        `cursor-pointer hover:bg-gray-100/50 rounded p-1 transition-colors border border-transparent hover:border-gray-200`,
        className,
      )}
      style={{ ...style, color }}
      title="Click to edit text"
    >
      {value}
    </div>
  );
}
