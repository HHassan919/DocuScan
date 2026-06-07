import { useCallback, useState } from "react";
import { ApiKeyInput } from "./components/ApiKeyInput";
import { DropZone } from "./components/DropZone";
import { ExportBar } from "./components/ExportBar";
import { FieldEditor } from "./components/FieldEditor";
import { ResultsTable } from "./components/ResultsTable";
import { StatusBar } from "./components/StatusBar";
import { TemplateSelector } from "./components/TemplateSelector";
import { useExtraction } from "./hooks/useExtraction";
import { AppSettings, Template } from "./types";

export function App() {
  const [template, setTemplate] = useState<Template>("invoice");
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    provider: "huggingface",
    apiKey: "",
  });

  const { status, error, result, run, reset } = useExtraction();

  const isProcessing = status !== "idle" && status !== "done" && status !== "error";

  const handleFile = useCallback(
    async (file: File) => {
      setCurrentFile(file);
      reset();
      await run(file, template, customFields, settings);
    },
    [template, customFields, settings, run, reset]
  );

  const handleTemplateChange = useCallback(
    (newTemplate: Template) => {
      setTemplate(newTemplate);
      if (newTemplate !== "custom") {
        setCustomFields([]);
      }
      reset();
    },
    [reset]
  );

  const handleRerun = useCallback(async () => {
    if (!currentFile) return;
    reset();
    await run(currentFile, template, customFields, settings);
  }, [currentFile, template, customFields, settings, run, reset]);

  return (
    <div className="flex flex-col h-screen bg-surface-900 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-surface-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-100">DocuScan</span>
          <span className="text-xs text-gray-500">Document Data Extraction</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Documents stay on your machine
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 flex flex-col gap-4 p-4 border-r border-surface-700 overflow-y-auto">
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Document
            </h2>
            <DropZone onFile={handleFile} disabled={isProcessing} />
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Template
            </h2>
            <TemplateSelector
              selected={template}
              onChange={handleTemplateChange}
              disabled={isProcessing}
            />
          </section>

          {template === "custom" && (
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Fields to Extract
              </h2>
              <FieldEditor
                fields={customFields}
                onChange={setCustomFields}
                disabled={isProcessing}
              />
            </section>
          )}

          <section>
            <ApiKeyInput
              settings={settings}
              onChange={setSettings}
              disabled={isProcessing}
            />
          </section>

          {currentFile && (status === "done" || status === "error") && (
            <button
              onClick={handleRerun}
              disabled={isProcessing}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Re-run Extraction
            </button>
          )}
        </aside>

        <main className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
          <StatusBar
            status={status}
            error={error}
            filename={currentFile?.name ?? null}
          />

          {status === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-600">
              <svg className="w-16 h-16 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Drop a document to get started
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Extracted fields will appear here
                </p>
              </div>
            </div>
          )}

          {result && (
            <>
              <ResultsTable fields={result.fields} />

              <div className="mt-auto pt-4 border-t border-surface-700">
                <ExportBar result={result} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
