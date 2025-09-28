import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { EbiosProject, ProjectContextType, BusinessValue, DreadedEvent, RiskSource, StrategicScenario, OperationalScenario, SecurityMeasure } from '../types';
import { runWorkshopAgent } from '../services/agentOrchestrator';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialState: EbiosProject = {
  context: '',
  securityBaseline: '',
  businessValues: [],
  dreadedEvents: [],
  riskSources: [],
  strategicScenarios: [],
  operationalScenarios: [],
  securityMeasures: [],
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<EbiosProject>(initialState);

  const updateContext = useCallback((context: string) => setProject(p => ({ ...p, context })), []);
  const updateSecurityBaseline = useCallback((baseline: string) => setProject(p => ({ ...p, securityBaseline: baseline })), []);
  const updateBusinessValues = useCallback((values: BusinessValue[]) => setProject(p => ({ ...p, businessValues: values })), []);
  const updateDreadedEvents = useCallback((events: DreadedEvent[]) => setProject(p => ({ ...p, dreadedEvents: events })), []);
  const updateRiskSources = useCallback((sources: RiskSource[]) => setProject(p => ({ ...p, riskSources: sources })), []);
  const updateStrategicScenarios = useCallback((scenarios: StrategicScenario[]) => setProject(p => ({ ...p, strategicScenarios: scenarios })), []);
  const updateOperationalScenarios = useCallback((scenarios: OperationalScenario[]) => setProject(p => ({ ...p, operationalScenarios: scenarios })), []);
  const updateSecurityMeasures = useCallback((measures: SecurityMeasure[]) => setProject(p => ({...p, securityMeasures: measures })), []);

  const runAgent = useCallback(async (stepId: number, payload?: string): Promise<void> => {
      // The orchestrator will call the specific setter functions internally.
      // This approach centralizes the agent logic.
      await runWorkshopAgent(stepId, project, setProject, payload);
  }, [project.context, project.securityBaseline, project.businessValues.length, project.dreadedEvents.length, project.riskSources.length, project.strategicScenarios.length, project.operationalScenarios.length, project.securityMeasures.length]);


  const contextValue = useMemo<ProjectContextType>(() => ({
    project,
    setProject,
    updateContext,
    updateSecurityBaseline,
    updateBusinessValues,
    updateDreadedEvents,
    updateRiskSources,
    updateStrategicScenarios,
    updateOperationalScenarios,
    updateSecurityMeasures,
    runAgent,
  }), [project, runAgent]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};