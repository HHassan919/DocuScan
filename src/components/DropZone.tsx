import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "image/bmp",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp"];

const MAX_BYTES = 20 * 1024 * 1024;

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const typeOk =
      ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);

    if (!typeOk) {
      return "Invalid file type — drop a PDF or image (PNG, JPG, TIFF, BMP)";
    }
    if (file.size > MAX_BYTES) {
      return `File too large — max 20 MB, got ${(file.size / 1_048_576).toFixed(1)} MB`;
    }
    return null;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }

      setError(null);
      onFile(file);
    },
    [disabled, onFile, validate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }

      setError(null);
      onFile(file);
      e.target.value = "";
    },
    [onFile, validate]
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center gap-3",
          "border-2 border-dashed rounded-lg cursor-pointer select-none transition-all duration-200",
          "min-h-[220px] px-8 py-10",
          isDragOver
            ? "border-indigo-400 bg-indigo-950/40"
            : "border-surface-600 bg-surface-800 hover:border-surface-500 hover:bg-surface-700",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />

        <svg
          className={`w-12 h-12 ${isDragOver ? "text-indigo-400" : "text-gray-500"} transition-colors`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-300">
            {isDragOver ? "Drop to extract" : "Drop a document here"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, PNG, JPG, TIFF, BMP — max 20 MB
          </p>
          <p className="text-xs text-gray-600 mt-2">or click to browse</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-950/60 border border-red-800/50 rounded text-xs text-red-300">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
