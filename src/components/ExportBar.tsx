import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import { ExtractionResult } from "../types";

interface ExportBarProps {
  result: ExtractionResult | null;
}

type ExportState = "idle" | "exporting" | "error";

export function ExportBar({ result }: ExportBarProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const buildExportPayload = useCallback((): string => {
    if (!result) return "{}";
    return JSON.stringify({
      template: result.template,
      filename: result.filename,
      extractedAt: result.extractedAt,
      fields: result.fields,
    });
  }, [result]);

  const baseFilename = result?.filename
    ? result.filename.replace(/\.[^.]+$/, "")
    : "docuscan_export";

  const handleExportJson = useCallback(async () => {
    if (!result) return;
    setState("exporting");
    setErrorMsg(null);
    try {
      await invoke("export_json", {
        data: buildExportPayload(),
        filename: `${baseFilename}.json`,
      });
      setState("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setState("error");
    }
  }, [result, buildExportPayload, baseFilename]);

  const handleExportCsv = useCallback(async () => {
    if (!result) return;
    setState("exporting");
    setErrorMsg(null);
    try {
      await invoke("export_csv", {
        data: buildExportPayload(),
        filename: `${baseFilename}.csv`,
      });
      setState("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setState("error");
    }
  }, [result, buildExportPayload, baseFilename]);

  const hasResults = result !== null && result.fields.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportJson}
          disabled={!hasResults || state === "exporting"}
          className="btn-secondary flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export JSON
        </button>

        <button
          onClick={handleExportCsv}
          disabled={!hasResults || state === "exporting"}
          className="btn-secondary flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Export CSV
        </button>

        {state === "exporting" && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
      </div>

      {state === "error" && errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
