import { Template, TEMPLATE_LABELS } from "../types";

interface TemplateSelectorProps {
  selected: Template;
  onChange: (template: Template) => void;
  disabled: boolean;
}

const TEMPLATES: Template[] = ["invoice", "resume", "contract", "receipt", "custom"];

const TEMPLATE_ICONS: Record<Template, string> = {
  invoice: "🧾",
  resume: "👤",
  contract: "📋",
  receipt: "🧾",
  custom: "⚙️",
};

export function TemplateSelector({ selected, onChange, disabled }: TemplateSelectorProps) {
  return (
    <div className="flex gap-1 bg-surface-800 rounded-lg p-1 border border-surface-600">
      {TEMPLATES.map((template) => (
        <button
          key={template}
          onClick={() => !disabled && onChange(template)}
          disabled={disabled}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded transition-all duration-150",
            selected === template
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-surface-700",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          ].join(" ")}
        >
          <span className="text-base leading-none">{TEMPLATE_ICONS[template]}</span>
          <span className="hidden sm:inline">{TEMPLATE_LABELS[template]}</span>
        </button>
      ))}
    </div>
  );
}
