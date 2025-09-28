import type React from 'react';

export enum Severity {
  CRITICAL = 'Critique',
  GRAVE = 'Grave',
  SIGNIFICATIVE = 'Significative',
  MINEURE = 'Mineure',
}

export type Likelihood = 'Quasi-certain' | 'Très vraisemblable' | 'Vraisemblable' | 'Peu vraisemblable';
export type RiskSourceType = 'Humaine' | 'Technique' | 'Environnementale';
export type RiskSourceProfile =
  | 'Activiste idéologique'
  | 'Amateur'
  | 'Concurrent'
  | 'Crime organisé'
  | 'Malveillant pathologique'
  | 'Officine spécialisée'
  | 'Terroriste'
  | 'Vengeur'
  | 'Étatique';
export type SecurityMeasureType = 'Préventive' | 'Détective' | 'Corrective';
export type ChatMessageSender = 'user' | 'ai' | 'system';

// LLM Configuration Types
export type LLMProvider = 'gemini' | 'ollama' | 'lmstudio' | 'mistral' | 'anthropic' | 'deepseek' | 'qwen' | 'xai' | 'groq' | 'openai';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface LMStudioConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface MistralConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface QwenConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface XAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  gemini: GeminiConfig;
  ollama: OllamaConfig;
  lmstudio: LMStudioConfig;
  mistral: MistralConfig;
  anthropic: AnthropicConfig;
  deepseek: DeepSeekConfig;
  qwen: QwenConfig;
  xai: XAIConfig;
  groq: GroqConfig;
  openai: OpenAIConfig;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface BusinessValue {
  id: string;
  name: string;
  description: string;
}

export interface DreadedEvent {
  id:string;
  businessValueId: string;
  name: string;
  severity: Severity;
}

export interface RiskSource {
  id: string;
  name: string;
  description: string;
  type: RiskSourceType;
  profile?: RiskSourceProfile;
}

export interface StrategicScenario {
  id: string;
  riskSourceId: string;
  dreadedEventId: string;
  description: string;
  likelihood: Likelihood;
  residualLikelihood?: Likelihood;
  residualLikelihoodJustification?: string;
}

export interface OperationalScenario {
  id: string;
  strategicScenarioId: string;
  description: string;
}

export interface SecurityMeasure {
  id: string;
  operationalScenarioId: string;
  description: string;
  type: SecurityMeasureType;
}

export interface EbiosProject {
  context: string;
  securityBaseline: string;
  businessValues: BusinessValue[];
  dreadedEvents: DreadedEvent[];
  riskSources: RiskSource[];
  strategicScenarios: StrategicScenario[];
  operationalScenarios: OperationalScenario[];
  securityMeasures: SecurityMeasure[];
}

export interface ProjectContextType {
  project: EbiosProject;
  setProject: React.Dispatch<React.SetStateAction<EbiosProject>>;
  updateContext: (context: string) => void;
  updateSecurityBaseline: (baseline: string) => void;
  updateBusinessValues: (values: BusinessValue[]) => void;
  updateDreadedEvents: (events: DreadedEvent[]) => void;
  updateRiskSources: (sources: RiskSource[]) => void;
  updateStrategicScenarios: (scenarios: StrategicScenario[]) => void;
  updateOperationalScenarios: (scenarios: OperationalScenario[]) => void;
  updateSecurityMeasures: (measures: SecurityMeasure[]) => void;
  runAgent: (stepId: number, payload?: string) => Promise<void>;
}

export interface ChatMessage {
    id: string;
    sender: ChatMessageSender;
    text: string;
}