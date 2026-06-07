import { useCallback, useRef, useState } from "react";

interface FieldEditorProps {
  fields: string[];
  onChange: (fields: string[]) => void;
  disabled: boolean;
}

export function FieldEditor({ fields, onChange, disabled }: FieldEditorProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addField = useCallback(() => {
    const normalized = inputValue.trim().toLowerCase().replace(/\s+/g, "_");
    if (!normalized || fields.includes(normalized)) {
      setInputValue("");
      return;
    }
    onChange([...fields, normalized]);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, fields, onChange]);

  const removeField = useCallback(
    (field: string) => {
      onChange(fields.filter((f) => f !== field));
    },
    [fields, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addField();
      }
    },
    [addField]
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        Define fields to extract. Press Enter or comma to add each field.
      </p>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. vendor_name, total_amount..."
          disabled={disabled}
          className="field-input flex-1"
        />
        <button
          onClick={addField}
          disabled={disabled || !inputValue.trim()}
          className="btn-secondary px-3"
        >
          Add
        </button>
      </div>

      {fields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {fields.map((field) => (
            <span
              key={field}
              className="inline-flex items-center gap-1 px-2 py-1 bg-surface-700 border border-surface-500 rounded text-xs text-gray-300 font-mono"
            >
              {field}
              {!disabled && (
                <button
                  onClick={() => removeField(field)}
                  className="text-gray-500 hover:text-red-400 transition-colors leading-none"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {fields.length === 0 && (
        <p className="text-xs text-gray-600 italic">No fields defined yet — add at least one</p>
      )}
    </div>
  );
}
