import React, { useState, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import Loader from '../Loader';
import { SEVERITY_LEVELS } from '../../constants';

interface Props {
  activeStepId: number;
}

const Step4_5_Synthese: React.FC<Props> = ({ activeStepId }) => {
  const { project, runAgent } = useProject();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleRunAgentForId = useCallback(async (id: string) => {
    setIsLoading(prev => ({ ...prev, [id]: true }));
    try {
        const agentId = activeStepId === 4 ? 4 : 5;
        // Pass the target ID as the "payload"
        await runAgent(agentId, id);
    } catch (error) {
        console.error(`Erreur de l'agent pour l'ID ${id}:`, error);
        alert(`Erreur de l'agent: ${error.message}`);
    } finally {
        setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  }, [activeStepId, runAgent]);


  if (activeStepId === 4) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Génération des Scénarios Opérationnels</h2>
        <p className="text-sm text-text-secondary mb-4">Pour chaque scénario stratégique, lancez un agent IA pour détailler un chemin d'attaque plausible.</p>
        
        <div className="space-y-4">
          {project.strategicScenarios.map(ss => {
            const operationalScenariosForThis = project.operationalScenarios.filter(os => os.strategicScenarioId === ss.id);
            const riskSource = project.riskSources.find(rs => rs.id === ss.riskSourceId)?.name || 'N/A';
            const dreadedEvent = project.dreadedEvents.find(de => de.id === ss.dreadedEventId)?.name || 'N/A';

            return (
              <div key={ss.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{riskSource} → {dreadedEvent}</p>
                    <p className="text-sm text-text-secondary">{ss.description}</p>
                  </div>
                  <button onClick={() => handleRunAgentForId(ss.id)} disabled={isLoading[ss.id]} className="px-3 py-1.5 text-sm bg-brand-accent text-white rounded-lg shadow-sm hover:bg-brand-primary disabled:opacity-50 flex-shrink-0">
                    Générer
                  </button>
                </div>
                {isLoading[ss.id] && <div className="mt-2"><Loader text="L'agent élabore le scénario..." /></div>}
                {operationalScenariosForThis.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {operationalScenariosForThis.map(os => (
                       <div key={os.id} className="p-3 border rounded-lg bg-gray-50 whitespace-pre-wrap font-mono text-sm">
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
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Proposition de Mesures de Sécurité</h2>
            <p className="text-sm text-text-secondary mb-4">Pour chaque scénario opérationnel, lancez un agent IA pour proposer des mesures de sécurité.</p>
             <div className="space-y-4">
                {project.operationalScenarios.map(os => {
                    const measuresForThis = project.securityMeasures.filter(sm => sm.operationalScenarioId === os.id);
                    return (
                        <div key={os.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-mono whitespace-pre-wrap flex-1 mr-4">{os.description}</p>
                                <button onClick={() => handleRunAgentForId(os.id)} disabled={isLoading[os.id]} className="px-3 py-1.5 text-sm bg-brand-accent text-white rounded-lg shadow-sm hover:bg-brand-primary disabled:opacity-50 flex-shrink-0">
                                    Proposer Mesures
                                </button>
                            </div>
                            {isLoading[os.id] && <div className="mt-2"><Loader text="L'agent recherche des mesures..." /></div>}
                            {measuresForThis.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {measuresForThis.map(sm => (
                                         <div key={sm.id} className="p-3 border rounded-lg bg-gray-50">
                                            <p><span className="font-semibold text-xs text-white bg-green-600 px-2 py-0.5 rounded-full mr-2">{sm.type}</span>{sm.description}</p>
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
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary mb-4 border-b pb-2">Synthèse de l'Analyse EBIOS RM</h2>
          <div className="space-y-4">
             <div><h3 className="font-semibold">Contexte</h3><p className="text-sm text-gray-600 whitespace-pre-wrap">{project.context || 'Non défini'}</p></div>
             <div><h3 className="font-semibold">Socle de sécurité</h3><p className="text-sm text-gray-600 whitespace-pre-wrap">{project.securityBaseline || 'Non défini'}</p></div>
             <div><h3 className="font-semibold">Valeurs métier</h3><ul className="list-disc list-inside">{project.businessValues.map(v=><li key={v.id}>{v.name}</li>)}</ul></div>
             <div><h3 className="font-semibold">Événements redoutés</h3><ul className="list-disc list-inside">{project.dreadedEvents.map(e=><li key={e.id}>{e.name} <span className={`px-2 text-xs font-semibold rounded-full ${SEVERITY_LEVELS[e.severity]?.bgColor} ${SEVERITY_LEVELS[e.severity]?.color}`}>{e.severity}</span></li>)}</ul></div>
             <div><h3 className="font-semibold">Scénarios Stratégiques</h3><ul className="list-disc list-inside">{project.strategicScenarios.map(s=><li key={s.id}>{s.description} (Vraisemblance: {s.likelihood})</li>)}</ul></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Step4_5_Synthese;