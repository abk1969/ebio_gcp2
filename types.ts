import type React from 'react';

export enum Severity {
  CRITICAL = 'Critique',
  HIGH = 'Élevée',
  MEDIUM = 'Moyenne',
  LOW = 'Faible',
}

export type Likelihood = 'Élevée' | 'Moyenne' | 'Faible';
export type RiskSourceType = 'Humaine' | 'Technique' | 'Environnementale';
export type SecurityMeasureType = 'Préventive' | 'Détective' | 'Corrective';
export type ChatMessageSender = 'user' | 'ai' | 'system';

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
}

export interface StrategicScenario {
  id: string;
  riskSourceId: string;
  dreadedEventId: string;
  description: string;
  likelihood: Likelihood;
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