import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import Loader from '../Loader';
import { SEVERITY_LEVELS } from '../../constants';

const Step1Cadrage: React.FC = () => {
  const { project, updateContext, updateSecurityBaseline, runAgent } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');

  const handleRunAgent = async () => {
    if (!initialPrompt) return alert("Veuillez fournir une description initiale de votre projet.");
    setIsLoading(true);
    try {
      await runAgent(1, initialPrompt);
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'agent de l'Atelier 1:", error);
      alert(`Erreur de l'agent: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Lancement de l'Agent de Cadrage</h2>
        <p className="text-text-secondary mb-4">Décrivez brièvement votre projet ou votre système. L'agent IA utilisera cette information pour remplir automatiquement toutes les sections de cet atelier.</p>
        <textarea
          className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent"
          placeholder="Exemple : 'Mon projet est une application web e-commerce pour vendre des produits artisanaux. Elle gère des comptes clients, des paiements en ligne et des commandes.'"
          value={initialPrompt}
          onChange={(e) => setInitialPrompt(e.target.value)}
        />
        <div className="text-right mt-4">
          <button onClick={handleRunAgent} disabled={isLoading || !initialPrompt} className="px-6 py-2 bg-brand-primary text-white rounded-lg shadow-sm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? 'Agent en cours d'analyse...' : "Lancer l'agent"}
          </button>
        </div>
      </div>

      {isLoading && <Loader text="L'agent de l'Atelier 1 analyse votre demande et génère les artefacts..." />}

      {project.context && !isLoading && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-text-primary mb-4">1. Description du Contexte (Généré par IA)</h2>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent bg-gray-50"
                value={project.context}
                onChange={(e) => updateContext(e.target.value)}
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-text-primary mb-4">2. Socle de Sécurité (Généré par IA)</h2>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent bg-gray-50"
                value={project.securityBaseline}
                onChange={(e) => updateSecurityBaseline(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-text-primary">3. Valeurs Métier (Générées par IA)</h2>
            {project.businessValues.length > 0 ? (
              <div className="space-y-2 mt-4">
                {project.businessValues.map(v => <div key={v.id} className="p-3 border rounded-lg bg-gray-50"><p className="font-semibold">{v.name}</p><p className="text-sm text-text-secondary">{v.description}</p></div>)}
              </div>
            ) : <p className="text-center text-gray-500 py-4">Aucune valeur métier générée.</p>}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-text-primary">4. Événements Redoutés (Générés par IA)</h2>
            {project.dreadedEvents.length > 0 ? (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Événement</th><th className="px-4 py-2 text-left">Gravité</th></tr></thead>
                  <tbody>
                    {project.dreadedEvents.map(e => (
                      <tr key={e.id}><td className="border-t px-4 py-2">{e.name}</td><td className="border-t px-4 py-2"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${SEVERITY_LEVELS[e.severity]?.bgColor} ${SEVERITY_LEVELS[e.severity]?.color}`}>{e.severity}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-center text-gray-500 py-4">Aucun événement redouté généré.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Cadrage;