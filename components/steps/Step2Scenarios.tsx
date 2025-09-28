import React, { useState, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import Loader from '../Loader';

interface Props {
  activeStepId: number;
}

const Step2_3_Scenarios: React.FC<Props> = ({ activeStepId }) => {
  const { project, runAgent } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prerequisiteOk = activeStepId === 2 
      ? project.context.length > 0 
      : project.riskSources.length > 0 && project.dreadedEvents.length > 0;

  const hasData = activeStepId === 2 
      ? project.riskSources.length > 0 
      : project.strategicScenarios.length > 0;

  const handleRunAgent = useCallback(async () => {
    if (!prerequisiteOk) {
      setError(`Les données de l'atelier ${activeStepId - 1} sont requises pour lancer cet agent.`);
      return;
    }
    
    setError(null);
    setIsLoading(true);
    try {
      await runAgent(activeStepId);
    } catch (error: any) {
      console.error(`Erreur lors de l'exécution de l'agent de l'Atelier ${activeStepId}:`, error);
      setError(error.message || "Une erreur inconnue est survenue.");
    } finally {
      setIsLoading(false);
    }
  }, [project, activeStepId, runAgent, prerequisiteOk]);

  const getRefName = (type: 'riskSource' | 'dreadedEvent', id: string) => {
    if (type === 'riskSource') return project.riskSources.find(rs => rs.id === id)?.name || 'Inconnue';
    return project.dreadedEvents.find(de => de.id === id)?.name || 'Inconnu';
  };

  const workshopTitle = activeStepId === 2 ? 'Atelier 2 : Sources de Risque' : 'Atelier 3 : Scénarios Stratégiques';
  const buttonText = activeStepId === 2 ? "Identifier les Sources de Risque avec l'IA" : "Construire les Scénarios Stratégiques avec l'IA";
  const loaderText = activeStepId === 2 ? "L'agent identifie les sources de risque..." : "L'agent construit les scénarios stratégiques...";
  const descriptionText = activeStepId === 2 
    ? "L'agent IA va analyser le contexte de votre projet pour identifier les 3 à 5 profils d'attaquants les plus pertinents et leurs motivations."
    : "En se basant sur les sources de risque et les événements redoutés, l'agent IA va maintenant construire les scénarios d'attaque les plus plausibles.";

  const renderContent = () => {
    if (isLoading) {
      return <Loader text={loaderText} />;
    }

    if (hasData) {
      if (activeStepId === 2) {
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
            {project.riskSources.map(s => (
              <div key={s.id} className="p-4 border rounded-lg bg-gray-50">
                <p className="font-semibold text-text-primary">{s.name} <span className="text-xs font-normal text-white bg-blue-500 px-2 py-0.5 rounded-full">{s.type}</span></p>
                <p className="text-sm text-text-secondary">{s.description}</p>
              </div>
            ))}
          </div>
        );
      } else { // activeStepId === 3
        return (
          <div className="overflow-x-auto animate-fade-in-up">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-50"><tr><th className="p-3 text-left text-text-secondary">Source de Risque</th><th className="p-3 text-left text-text-secondary">Description du Scénario</th><th className="p-3 text-left text-text-secondary">Événement Redouté</th><th className="p-3 text-left text-text-secondary">Vraisemblance</th></tr></thead>
              <tbody>
                {project.strategicScenarios.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3 text-text-primary">{getRefName('riskSource', s.riskSourceId)}</td>
                    <td className="p-3 text-text-primary">{s.description}</td>
                    <td className="p-3 text-text-primary">{getRefName('dreadedEvent', s.dreadedEventId)}</td>
                    <td className="p-3 font-medium text-text-primary">{s.likelihood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // --- VUE INITIALE D'APPEL À L'ACTION ---
    return (
      <div className={`text-center p-8 border-2 border-dashed rounded-lg ${!prerequisiteOk ? 'bg-gray-100' : 'bg-brand-light/50'}`}>
        <h3 className="text-lg font-semibold text-text-primary">{workshopTitle}</h3>
        <p className="text-text-secondary mt-2 mb-4 max-w-2xl mx-auto">{descriptionText}</p>
        
        {!prerequisiteOk ? (
           <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200" role="alert">
              <p className="font-bold">Prérequis manquant</p>
              <p>Veuillez compléter l'atelier {activeStepId - 1} avant de pouvoir lancer celui-ci.</p>
           </div>
        ) : (
          <button 
            onClick={handleRunAgent} 
            disabled={isLoading || !prerequisiteOk} 
            className="mt-2 px-6 py-2 bg-brand-accent text-white font-semibold rounded-lg shadow-sm hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {buttonText}
          </button>
        )}
      </div>
    );
  };

  return (
     <div className="bg-white p-6 rounded-lg shadow-md">
       <h2 className="text-xl font-semibold text-text-primary mb-4 sr-only">{workshopTitle}</h2>
        {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200" role="alert">
                <p className="font-bold">Erreur de l'agent</p>
                <p>{error}</p>
            </div>
        )}
        {renderContent()}
      </div>
  );
};

export default Step2_3_Scenarios;