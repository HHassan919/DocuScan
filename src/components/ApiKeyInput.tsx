import { useCallback, useState } from "react";
import { AppSettings, Provider, PROVIDER_LABELS } from "../types";

interface ApiKeyInputProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  disabled: boolean;
}

const PROVIDERS: Provider[] = ["huggingface", "openai", "gemini"];

const PROVIDER_HINTS: Record<Provider, string> = {
  huggingface: "Free tier — no key required. Add a token to increase rate limits.",
  openai: "Uses gpt-4o-mini. Get a key at platform.openai.com/api-keys",
  gemini: "Uses gemini-1.5-flash. Get a key at aistudio.google.com/app/apikey",
};

export function ApiKeyInput({ settings, onChange, disabled }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleProviderChange = useCallback(
    (provider: Provider) => {
      onChange({ ...settings, provider, apiKey: "" });
    },
    [settings, onChange]
  );

  const handleKeyChange = useCallback(
    (apiKey: string) => {
      onChange({ ...settings, apiKey });
    },
    [settings, onChange]
  );

  const needsKey = settings.provider !== "huggingface";

  return (
    <div className="border border-surface-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-800 hover:bg-surface-700 text-xs transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-gray-300 font-medium">AI Provider Settings</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-600 text-gray-400">
            {PROVIDER_LABELS[settings.provider]}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 py-3 bg-surface-900 border-t border-surface-700 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Provider</label>
            <div className="grid grid-cols-3 gap-1">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  onClick={() => !disabled && handleProviderChange(provider)}
                  disabled={disabled}
                  className={[
                    "px-3 py-2 text-xs rounded border transition-all",
                    settings.provider === provider
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-surface-800 border-surface-600 text-gray-400 hover:border-surface-400",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  ].join(" ")}
                >
                  {PROVIDER_LABELS[provider]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{PROVIDER_HINTS[settings.provider]}</p>
          </div>

          {needsKey && (
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">
                API Key{" "}
                <span className="text-gray-600 font-normal">(stored in memory only)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="sk-..."
                  disabled={disabled}
                  className="field-input flex-1"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="btn-secondary px-3"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
