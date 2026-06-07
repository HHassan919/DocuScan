import { ExtractionStatus } from "../types";

interface StatusBarProps {
  status: ExtractionStatus;
  error: string | null;
  filename: string | null;
}

const STATUS_STEPS: ExtractionStatus[] = [
  "reading",
  "extracting-text",
  "running-ai",
  "done",
];

const STATUS_LABELS: Record<ExtractionStatus, string> = {
  idle: "Ready",
  reading: "Reading file...",
  "extracting-text": "Extracting text...",
  "running-ai": "Running AI extraction...",
  done: "Complete",
  error: "Error",
};

export function StatusBar({ status, error, filename }: StatusBarProps) {
  if (status === "idle") return null;

  const stepIndex = STATUS_STEPS.indexOf(status);
  const isError = status === "error";
  const isDone = status === "done";

  return (
    <div
      className={[
        "border rounded-lg px-4 py-3 text-xs",
        isError
          ? "bg-red-950/40 border-red-800/50"
          : isDone
            ? "bg-emerald-950/40 border-emerald-800/50"
            : "bg-surface-800 border-surface-600",
      ].join(" ")}
    >
      {isError ? (
        <div className="flex items-start gap-2">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-300">{error}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isDone && (
                <svg
                  className="w-3.5 h-3.5 text-indigo-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isDone && (
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className={isDone ? "text-emerald-300" : "text-gray-300"}>
                {STATUS_LABELS[status]}
                {filename && ` — ${filename}`}
              </span>
            </div>

            {!isDone && (
              <span className="text-gray-500">
                Step {stepIndex + 1} of {STATUS_STEPS.length}
              </span>
            )}
          </div>

          <div className="flex gap-1">
            {STATUS_STEPS.map((step, i) => (
              <div
                key={step}
                className={[
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  isDone
                    ? "bg-emerald-500"
                    : i <= stepIndex
                      ? "bg-indigo-500"
                      : "bg-surface-600",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
