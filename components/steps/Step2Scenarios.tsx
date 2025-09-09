import React, { useState, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import Loader from '../Loader';

interface Props {
  activeStepId: number;
}

const Step2_3_Scenarios: React.FC<Props> = ({ activeStepId }) => {
  const { project, runAgent } = useProject();
  const [isLoading, setIsLoading] = useState(false);

  const handleRunAgent = useCallback(async () => {
    const prerequisiteOk = activeStepId === 2 
      ? project.context.length > 0 
      : project.riskSources.length > 0 && project.dreadedEvents.length > 0;
      
    if (!prerequisiteOk) {
      return alert(`Les données de l'atelier ${activeStepId - 1} sont requises pour lancer cet agent.`);
    }

    setIsLoading(true);
    try {
      await runAgent(activeStepId);
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'agent de l'Atelier ${activeStepId}:`, error);
      alert(`Erreur de l'agent: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [project, activeStepId, runAgent]);

  const getRefName = (type: 'riskSource' | 'dreadedEvent', id: string) => {
    if (type === 'riskSource') return project.riskSources.find(rs => rs.id === id)?.name || 'Inconnue';
    return project.dreadedEvents.find(de => de.id === id)?.name || 'Inconnu';
  };

  const workshopTitle = activeStepId === 2 ? 'Sources de Risque' : 'Scénarios Stratégiques';
  const buttonText = activeStepId === 2 ? "Identifier les Sources de Risque" : "Construire les Scénarios Stratégiques";
  const loaderText = activeStepId === 2 ? "L'agent identifie les sources de risque..." : "L'agent construit les scénarios stratégiques...";

  return (
     <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary">{workshopTitle}</h2>
          <button onClick={handleRunAgent} disabled={isLoading} className="flex items-center px-4 py-2 bg-brand-accent text-white rounded-lg shadow-sm hover:bg-brand-primary disabled:opacity-50">
            Lancer l'agent
          </button>
        </div>
        
        {isLoading && <Loader text={loaderText} />}

        {!isLoading && activeStepId === 2 && (
            project.riskSources.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.riskSources.map(s => (
                    <div key={s.id} className="p-4 border rounded-lg bg-gray-50">
                    <p className="font-semibold">{s.name} <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full">{s.type}</span></p>
                    <p className="text-sm text-text-secondary">{s.description}</p>
                    </div>
                ))}
                </div>
            ) : <p className="text-center text-gray-500 py-8">Cliquez sur "Lancer l'agent" pour identifier les sources de risque.</p>
        )}

        {!isLoading && activeStepId === 3 && (
            project.strategicScenarios.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-50"><tr><th className="p-3 text-left">Source de Risque</th><th className="p-3 text-left">Description du Scénario</th><th className="p-3 text-left">Événement Redouté</th><th className="p-3 text-left">Vraisemblance</th></tr></thead>
                <tbody>
                  {project.strategicScenarios.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">{getRefName('riskSource', s.riskSourceId)}</td>
                      <td className="p-3">{s.description}</td>
                      <td className="p-3">{getRefName('dreadedEvent', s.dreadedEventId)}</td>
                      <td className="p-3 font-medium">{s.likelihood}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-center text-gray-500 py-8">Cliquez sur "Lancer l'agent" pour construire les scénarios stratégiques.</p>
        )}
      </div>
  );
};

export default Step2_3_Scenarios;