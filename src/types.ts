export interface CatalogModel {
  id: string;
  name?: string;
  architecture?: { modality?: string };
  context_length?: number;
  supported_features?: string[];
  pricing?: Partial<Record<'prompt' | 'completion' | 'input_cache_read', string | number | null>>;
  description?: string;
}

export interface Catalog {
  fetched_at: string;
  models: CatalogModel[];
}

export interface EvidencePage {
  url: string;
  fetched_at: string;
  content: string;
  sha256: string;
}

export interface Evidence {
  fetched_at: string;
  pages: EvidencePage[];
}

export interface Preferences {
  quality?: number;
  maxCostPerMillionTokens?: number | null;
}

export interface Requirements {
  allowedModels?: string[] | null;
  contextTokens?: number;
  images?: boolean;
  maxCostPerMillionTokens?: number | null;
}

export interface RoutingInput {
  task: string;
  kind?: 'conversation' | 'subagent';
  preferences?: Preferences;
  requirements?: Requirements;
  maxEvidenceChars?: number;
  maxEvidencePages?: number;
}

export interface TeacherInput {
  systemPrompt: string;
  prompt: string;
  signal: AbortSignal;
}

export type Teacher = (input: TeacherInput) => Promise<string>;
