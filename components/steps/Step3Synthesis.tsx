import React, { useState, useCallback, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import Loader from '../Loader';
import { SEVERITY_LEVELS } from '../../constants';
import type { Likelihood, StrategicScenario, SecurityMeasure } from '../../types';
import { Severity } from '../../types';


interface Props {
  activeStepId: number;
}

const SEVERITY_LABELS: Severity[] = [Severity.CRITICAL, Severity.GRAVE, Severity.SIGNIFICATIVE, Severity.MINEURE];
const LIKELIHOOD_LABELS: Likelihood[] = ['Peu vraisemblable', 'Vraisemblable', 'Très vraisemblable', 'Quasi-certain'];


const getRiskColor = (severity: Severity, likelihood: Likelihood): string => {
    const sevIndex = [Severity.MINEURE, Severity.SIGNIFICATIVE, Severity.GRAVE, Severity.CRITICAL].indexOf(severity);
    const likIndex = ['Peu vraisemblable', 'Vraisemblable', 'Très vraisemblable', 'Quasi-certain'].indexOf(likelihood);

    if (sevIndex === -1 || likIndex === -1) return 'bg-gray-100';

     // Based on the matrix from the ANSSI EBIOS RM guide (e.g., page 77)
    const colorGrid = [
        // likIndex=0 (Peu vraisemblable)
        ['bg-green-200', 'bg-yellow-200', 'bg-yellow-200', 'bg-yellow-200'],
        // likIndex=1 (Vraisemblable)
        ['bg-green-200', 'bg-yellow-200', 'bg-orange-200', 'bg-orange-200'],
        // likIndex=2 (Très vraisemblable)
        ['bg-yellow-200', 'bg-orange-200', 'bg-red-200', 'bg-red-200'],
        // likIndex=3 (Quasi-certain)
        ['bg-yellow-200', 'bg-orange-200', 'bg-red-200', 'bg-red-200'],
    ];

    return colorGrid[likIndex][sevIndex];
};


const Step4_5_6_Synthesis: React.FC<Props> = ({ activeStepId }) => {
  const { project, runAgent } = useProject();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scenarioMap = useMemo(() => {
      return project.strategicScenarios.reduce((acc, scenario, index) => {
          acc[scenario.id] = `R${index + 1}`;
          return acc;
      }, {} as Record<string, string>);
  }, [project.strategicScenarios]);

  const riskMatrixDataAfterTreatment = useMemo(() => {
    const matrix: Record<string, Record<string, StrategicScenario[]>> = {};

    SEVERITY_LABELS.forEach(s => {
      matrix[s] = {};
      LIKELIHOOD_LABELS.forEach(l => {
        matrix[s][l] = [];
      });
    });

    project.strategicScenarios.forEach(ss => {
      const dreadedEvent = project.dreadedEvents.find(de => de.id === ss.dreadedEventId);
      if (dreadedEvent) {
        const likelihood = ss.residualLikelihood || ss.likelihood;
        const { severity } = dreadedEvent;
        if (matrix[severity] && matrix[severity][likelihood]) {
          matrix[severity][likelihood].push(ss);
        }
      }
    });
    return matrix;
  }, [project.strategicScenarios, project.dreadedEvents]);

  const totalMatrixEntries = useMemo(() => {
    return SEVERITY_LABELS.reduce((total, severity) => {
      return (
        total +
        LIKELIHOOD_LABELS.reduce((acc, likelihood) => {
          return acc + (riskMatrixDataAfterTreatment[severity]?.[likelihood]?.length ?? 0);
        }, 0)
      );
    }, 0);
  }, [riskMatrixDataAfterTreatment]);

  const missingDataMessages = useMemo<string[]>(() => {
    const messages: string[] = [];
    if (project.strategicScenarios.length === 0) {
      messages.push("Aucun scénario stratégique n'a été généré. Relancez l'agent de l'Atelier 3 après avoir renseigné le contexte, les valeurs métier et les événements redoutés.");
    }
    if (project.strategicScenarios.length > 0 && project.operationalScenarios.length === 0) {
      messages.push("Les scénarios opérationnels ne sont pas encore produits. Exécutez l'agent de l'Atelier 4 depuis la section \"Génération des Scénarios Opérationnels\".");
    }
    if (project.operationalScenarios.length > 0 && project.securityMeasures.length === 0) {
      messages.push("Aucune mesure de sécurité n'a été proposée. Lancez l'agent de l'Atelier 5 pour chaque scénario opérationnel prioritaire.");
    }
    if (
      project.securityMeasures.length > 0 &&
      !project.strategicScenarios.some(s => s.residualLikelihood)
    ) {
      messages.push("Les vraisemblances résiduelles ne sont pas renseignées. Vérifiez que l'agent de l'Atelier 5 retourne bien la vraisemblance résiduelle et sa justification.");
    }
    if (messages.length === 0 && totalMatrixEntries === 0) {
      messages.push("Les scénarios sont disponibles mais aucun n'est positionné dans la matrice. Vérifiez que la gravité des événements redoutés et la vraisemblance de chaque scénario sont bien renseignées.");
    }
    return messages;
  }, [project.strategicScenarios, project.operationalScenarios, project.securityMeasures, totalMatrixEntries]);

  const handleRunAgentForId = useCallback(async (id: string) => {
    setIsLoading(prev => ({ ...prev, [id]: true }));
    setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
    });

    try {
        const agentId = activeStepId === 4 ? 4 : 5;
        await runAgent(agentId, id);
    } catch (error: any) {
        console.error(`Erreur de l'agent pour l'ID ${id}:`, error);
        setErrors(prev => ({...prev, [id]: error.message || 'Une erreur inconnue est survenue.'}));
    } finally {
        setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  }, [activeStepId, runAgent]);

    const handleRunBatchAgent = useCallback(async () => {
    setIsBatchProcessing(true);
    setErrors({});
    const itemsToProcess = activeStepId === 4 ? project.strategicScenarios : project.operationalScenarios;
    
    for (const item of itemsToProcess) {
        let alreadyProcessed = false;
        if (activeStepId === 4) {
            alreadyProcessed = project.operationalScenarios.some(os => os.strategicScenarioId === item.id);
        } else {
            alreadyProcessed = project.securityMeasures.some(sm => sm.operationalScenarioId === item.id);
        }

        if (!alreadyProcessed) {
            await handleRunAgentForId(item.id);
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    }
    
    setIsBatchProcessing(false);
  }, [activeStepId, project.strategicScenarios, project.operationalScenarios, project.securityMeasures, handleRunAgentForId]);


  if (activeStepId === 4) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-xl font-semibold text-text-primary">Génération des Scénarios Opérationnels</h2>
                  <p className="text-sm text-text-secondary mt-1">L'agent IA va détailler un chemin d'attaque plausible pour chaque scénario stratégique non traité.</p>
              </div>
              <button onClick={handleRunBatchAgent} disabled={isBatchProcessing || project.strategicScenarios.length === 0} className="px-5 py-2.5 bg-brand-accent text-white rounded-lg shadow-sm hover:bg-brand-primary disabled:opacity-50 disabled:cursor-wait flex-shrink-0 font-semibold">
                  {isBatchProcessing ? "Génération en cours..." : "Lancer pour tous"}
              </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {project.strategicScenarios.map(ss => {
            const operationalScenariosForThis = project.operationalScenarios.filter(os => os.strategicScenarioId === ss.id);
            const riskSource = project.riskSources.find(rs => rs.id === ss.riskSourceId)?.name || 'N/A';
            const dreadedEvent = project.dreadedEvents.find(de => de.id === ss.dreadedEventId)?.name || 'N/A';
            const isProcessed = operationalScenariosForThis.length > 0;

            return (
              <div key={ss.id} className={`p-4 border rounded-lg transition-colors ${isProcessed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-text-primary">{riskSource} → {dreadedEvent}</p>
                    <p className="text-sm text-text-secondary">{ss.description}</p>
                  </div>
                   {isProcessed && (
                    <span className="flex-shrink-0 ml-4 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                      Traité
                    </span>
                  )}
                </div>
                {isLoading[ss.id] && <div className="mt-2"><Loader text="L'agent élabore le scénario..." /></div>}
                {errors[ss.id] && (
                    <div className="mt-2 p-3 bg-red-100 text-red-800 rounded-lg border border-red-200" role="alert">
                        <p className="font-bold">Erreur de l'agent</p>
                        <p className="text-sm">{errors[ss.id]}</p>
                    </div>
                )}
                {isProcessed && (
                  <div className="mt-4 space-y-2">
                    {operationalScenariosForThis.map(os => (
                       <div key={os.id} className="p-3 border rounded-lg bg-gray-50 whitespace-pre-wrap font-mono text-sm text-text-primary">
                         {os.description}
                       </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {project.strategicScenarios.length === 0 && <p className="text-center text-gray-500 py-8">Aucun scénario stratégique à traiter. Complétez l'Atelier 3 d'abord.</p>}
      </div>
    );
  }
  
  if (activeStepId === 5) {
     return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center">
                  <div>
                      <h2 className="text-xl font-semibold text-text-primary">Proposition de Mesures de Sécurité</h2>
                      <p className="text-sm text-text-secondary mt-1">L'agent IA va proposer des mesures de sécurité pour chaque scénario opérationnel non traité.</p>
                  </div>
                  <button onClick={handleRunBatchAgent} disabled={isBatchProcessing || project.operationalScenarios.length === 0} className="px-5 py-2.5 bg-brand-accent text-white rounded-lg shadow-sm hover:bg-brand-primary disabled:opacity-50 disabled:cursor-wait flex-shrink-0 font-semibold">
                      {isBatchProcessing ? "Proposition en cours..." : "Lancer pour tous"}
                  </button>
              </div>
            </div>
             <div className="space-y-4">
                {project.operationalScenarios.map(os => {
                    const measuresForThis = project.securityMeasures.filter(sm => sm.operationalScenarioId === os.id);
                    const isProcessed = measuresForThis.length > 0;
                    const groupedMeasures = measuresForThis.reduce((acc, measure) => {
                      (acc[measure.type] = acc[measure.type] || []).push(measure);
                      return acc;
                    }, {} as Record<string, SecurityMeasure[]>);

                    return (
                        <div key={os.id} className={`p-4 border rounded-lg transition-colors ${isProcessed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                             <div className="flex justify-between items-start">
                                <p className="text-sm font-mono whitespace-pre-wrap flex-1 mr-4 text-text-primary">{os.description}</p>
                                {isProcessed && (
                                <span className="flex-shrink-0 ml-4 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                                    Traité
                                </span>
                                )}
                            </div>

                            {isLoading[os.id] && <div className="mt-2"><Loader text="L'agent recherche des mesures..." /></div>}
                            {errors[os.id] && (
                                <div className="mt-2 p-3 bg-red-100 text-red-800 rounded-lg border border-red-200" role="alert">
                                    <p className="font-bold">Erreur de l'agent</p>
                                    <p className="text-sm">{errors[os.id]}</p>
                                </div>
                            )}
                            {isProcessed && (
                                <div className="mt-4 space-y-3">
                                  {Object.entries(groupedMeasures).map(([type, measures]) => (
                                    <div key={type}>
                                      <h4 className="font-semibold text-sm text-text-primary mb-1">{type}</h4>
                                      <div className="space-y-2">
                                        {measures.map(sm => (
                                          <div key={sm.id} className="pl-4 border-l-2 border-brand-accent/50 p-2 text-sm text-text-secondary">
                                            {sm.description}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
             {project.operationalScenarios.length === 0 && <p className="text-center text-gray-500 py-8">Aucun scénario opérationnel à traiter. Complétez l'Atelier 4 d'abord.</p>}
        </div>
    );
  }

  if (activeStepId === 6) {
    return (
       <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary mb-4 border-b pb-2">Synthèse de l'Analyse EBIOS RM</h2>
          
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
             <div><h3 className="font-semibold text-text-primary">Contexte</h3><p className="text-sm text-text-secondary whitespace-pre-wrap">{project.context || 'Non défini'}</p></div>
             <div><h3 className="font-semibold text-text-primary">Socle de sécurité</h3><p className="text-sm text-text-secondary whitespace-pre-wrap">{project.securityBaseline || 'Non défini'}</p></div>
             <div><h3 className="font-semibold text-text-primary">Valeurs métier</h3><ul className="list-disc list-inside text-sm text-text-secondary">{project.businessValues.map(v=><li key={v.id}>{v.name}</li>)}</ul></div>
             <div><h3 className="font-semibold text-text-primary">Événements redoutés</h3><ul className="list-disc list-inside text-sm text-text-secondary">{project.dreadedEvents.map(e=><li key={e.id}>{e.name} <span className={`px-2 text-xs font-semibold rounded-full ${SEVERITY_LEVELS[e.severity]?.bgColor} ${SEVERITY_LEVELS[e.severity]?.color}`}>{e.severity}</span></li>)}</ul></div>
          </div>

           {missingDataMessages.length > 0 && (
             <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
               <p className="font-semibold mb-2">Vérifications EBIOS RM avant synthèse</p>
               <ul className="list-disc list-inside space-y-1">
                 {missingDataMessages.map((msg, index) => (
                   <li key={index}>{msg}</li>
                 ))}
               </ul>
             </div>
           )}
          
           <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Matrice des Risques (Après Traitement Proposé)</h3>
             <div className="flex items-center">
                <div className="flex items-center justify-center -rotate-90 -translate-x-1/2 w-20 h-10">
                    <span className="font-semibold text-sm text-text-secondary">Gravité</span>
                </div>
                <div className="flex-1">
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <tbody>
                          {SEVERITY_LABELS.map((severity: Severity) => (
                            <tr key={severity}>
                              <th className="border border-gray-300 p-2 bg-gray-100 text-sm font-medium text-text-secondary text-right w-32">{severity}</th>
                              {LIKELIHOOD_LABELS.map((likelihood: Likelihood) => (
                                <td key={likelihood} className={`border border-gray-300 p-2 text-center align-middle ${getRiskColor(severity, likelihood)} min-w-[100px] min-h-[60px]`}>
                                  <div className="flex flex-wrap gap-2 justify-center items-center">
                                    {riskMatrixDataAfterTreatment[severity]?.[likelihood]?.map((scenario: StrategicScenario) => (
                                      <div
                                        key={scenario.id}
                                        title={scenario.description}
                                        className="h-8 w-8 bg-brand-primary text-white rounded-full cursor-pointer hover:ring-2 hover:ring-brand-dark flex items-center justify-center font-bold text-sm"
                                      >
                                        {scenarioMap[scenario.id]}
                                      </div>
                                    ))}
                                    {riskMatrixDataAfterTreatment[severity]?.[likelihood]?.length === 0 && totalMatrixEntries === 0 && (
                                      <span className="text-xs text-text-secondary">--</span>
                                    )}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr>
                            <th className="border-t border-gray-300"></th>
                            {LIKELIHOOD_LABELS.map((l: Likelihood) => (
                              <th key={l} className="border border-gray-300 p-2 bg-gray-100 text-sm font-medium text-text-secondary">{l}</th>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                     <div className="text-center mt-2">
                        <span className="font-semibold text-sm text-text-secondary">Vraisemblance</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                <h4 className="font-semibold text-text-primary">Légende des Scénarios Stratégiques et Traitement :</h4>
                <div className="mt-2 space-y-3 text-sm text-text-secondary">
                    {project.strategicScenarios.length > 0 ? project.strategicScenarios.map(s => (
                        <div key={s.id} className="p-2 border-l-4 border-gray-200">
                           <p><span className="font-bold text-text-primary">{scenarioMap[s.id]}:</span> {s.description}</p>
                           {s.residualLikelihood ? (
                            <div className="pl-4 text-xs mt-1 space-y-1">
                                <p>
                                    <span className="font-semibold">Transition de Vraisemblance :</span> 
                                    <span className="font-mono p-1 bg-gray-200 rounded">{s.likelihood}</span> → <span className="font-mono p-1 bg-green-200 rounded">{s.residualLikelihood}</span>
                                </p>
                                <p>
                                    <span className="font-semibold">Justification :</span> {s.residualLikelihoodJustification}
                                </p>
                            </div>
                           ) : (
                             <div className="pl-4 text-xs mt-1">
                                <p><span className="font-semibold">Vraisemblance Initiale :</span> <span className="font-mono p-1 bg-gray-200 rounded">{s.likelihood}</span> (Traitement non défini)</p>
                             </div>
                           )}
                        </div>
                    )) : <p>Aucun scénario stratégique défini.</p>}
                </div>
            </div>
          </div>
        </div>
    );
  }

  return null;
};

export default Step4_5_6_Synthesis;