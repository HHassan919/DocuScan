import { ExtractedField } from "../types";

interface ResultsTableProps {
  fields: ExtractedField[];
}

function confidenceClass(score: number): string {
  if (score >= 0.8) return "confidence-high";
  if (score >= 0.5) return "confidence-medium";
  return "confidence-low";
}

function confidenceLabel(score: number): string {
  if (score >= 0.8) return "High";
  if (score >= 0.5) return "Medium";
  return "Low";
}

export function ResultsTable({ fields }: ResultsTableProps) {
  if (fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Extracted Fields
        </h2>
        <span className="text-xs text-gray-500">{fields.length} field{fields.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-600">
              <th className="text-left py-2 px-3 text-gray-500 font-medium w-1/4">Field</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Value</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium w-28">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {fields.map((field, i) => (
              <tr key={`${field.name}-${i}`} className="hover:bg-surface-700/40 transition-colors">
                <td className="py-2.5 px-3 font-mono text-indigo-300 whitespace-nowrap align-top">
                  {field.name}
                </td>
                <td className="py-2.5 px-3 text-gray-200 align-top">
                  {field.value ? (
                    <span className="break-words">{field.value}</span>
                  ) : (
                    <span className="text-gray-600 italic">not found</span>
                  )}
                </td>
                <td className="py-2.5 px-3 align-top">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${confidenceClass(field.confidence)}`}
                          style={{ width: `${field.confidence * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs ${
                          field.confidence >= 0.8
                            ? "text-emerald-400"
                            : field.confidence >= 0.5
                              ? "text-amber-400"
                              : "text-red-400"
                        }`}
                      >
                        {confidenceLabel(field.confidence)}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      {Math.round(field.confidence * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
