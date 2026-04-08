"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = [".xls", ".xlsx"];

function isValidFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function FileDropZone({ onFileSelected, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelected(file);
      }
    },
    [disabled, onFileSelected]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        onFileSelected(file);
      }
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [onFileSelected]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12
        transition-colors
        ${disabled ? "cursor-not-allowed border-muted bg-muted/30 opacity-60" : "cursor-pointer"}
        ${isDragOver && !disabled ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-muted-foreground/25 hover:border-muted-foreground/50"}
      `}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="rounded-full bg-muted p-4">
        {isDragOver ? (
          <FileSpreadsheet className="h-8 w-8 text-blue-500" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium">
          {isDragOver
            ? "Drop your file here"
            : "Drag and drop your Point of Rental export"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Accepts .xls and .xlsx files
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        Browse Files
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
    </div>
  );
}
