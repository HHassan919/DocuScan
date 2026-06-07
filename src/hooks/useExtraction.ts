import { invoke } from "@tauri-apps/api/core";
import { useCallback, useState } from "react";
import {
  AppSettings,
  ContentType,
  ExtractionResult,
  ExtractionStatus,
  SidecarResponse,
  Template,
  DEFAULT_TEMPLATE_FIELDS,
} from "../types";

interface UseExtractionReturn {
  status: ExtractionStatus;
  error: string | null;
  result: ExtractionResult | null;
  run: (
    file: File,
    template: Template,
    customFields: string[],
    settings: AppSettings
  ) => Promise<void>;
  reset: () => void;
}

function detectContentType(file: File): ContentType {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "text";
  }
  return "image";
}

export function useExtraction(): UseExtractionReturn {
  const [status, setStatus] = useState<ExtractionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  const run = useCallback(
    async (
      file: File,
      template: Template,
      customFields: string[],
      settings: AppSettings
    ) => {
      setStatus("reading");
      setError(null);
      setResult(null);

      const contentType = detectContentType(file);
      const filePath = (file as File & { path?: string }).path ?? "";

      try {
        let content: string;

        setStatus("extracting-text");

        if (contentType === "text") {
          content = await invoke<string>("read_pdf_text", { filePath });
        } else {
          content = await invoke<string>("read_image_for_ocr", { filePath });
        }

        setStatus("running-ai");

        const fields =
          template === "custom"
            ? customFields
            : customFields.length > 0
              ? customFields
              : DEFAULT_TEMPLATE_FIELDS[template];

        const payload = {
          content,
          contentType,
          fields,
          template,
          provider: settings.provider,
          apiKey: settings.apiKey || undefined,
        };

        const response = await invoke<SidecarResponse>("call_sidecar", { payload });

        if (!response.success) {
          throw new Error(response.error ?? "Extraction failed without a specific error");
        }

        setResult({
          fields: response.fields,
          template,
          filename: file.name,
          extractedAt: new Date().toISOString(),
        });

        setStatus("done");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    []
  );

  return { status, error, result, run, reset };
}
