export type Template = "invoice" | "resume" | "contract" | "receipt" | "custom";
export type Provider = "huggingface" | "openai" | "gemini";
export type ContentType = "text" | "image";

export type ExtractionStatus =
  | "idle"
  | "reading"
  | "extracting-text"
  | "running-ai"
  | "done"
  | "error";

export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
}

export interface SidecarResponse {
  success: boolean;
  fields: ExtractedField[];
  error: string | null;
}

export interface ExtractionResult {
  fields: ExtractedField[];
  template: Template;
  filename: string;
  extractedAt: string;
}

export interface AppSettings {
  provider: Provider;
  apiKey: string;
}

export const TEMPLATE_LABELS: Record<Template, string> = {
  invoice: "Invoice",
  resume: "Resume",
  contract: "Contract",
  receipt: "Receipt",
  custom: "Custom",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  huggingface: "HuggingFace (Free)",
  openai: "OpenAI",
  gemini: "Google Gemini",
};

export const DEFAULT_TEMPLATE_FIELDS: Record<Template, string[]> = {
  invoice: [
    "vendor_name",
    "invoice_number",
    "date",
    "due_date",
    "line_items",
    "subtotal",
    "tax",
    "total",
    "currency",
  ],
  resume: [
    "full_name",
    "email",
    "phone",
    "location",
    "skills",
    "experience",
    "education",
    "certifications",
  ],
  contract: [
    "parties",
    "effective_date",
    "expiry_date",
    "key_terms",
    "payment_terms",
    "jurisdiction",
  ],
  receipt: ["merchant", "date", "items", "total", "payment_method"],
  custom: [],
};
