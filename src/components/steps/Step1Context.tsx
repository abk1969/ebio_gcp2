import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import Loader from '../Loader';
import { SEVERITY_LEVELS } from '../../constants';

const Step1Cadrage: React.FC = () => {
  const { project, updateContext, updateSecurityBaseline, runAgent } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRunAgent = async () => {
    if (!initialPrompt) return;
    setError(null);
    setIsLoading(true);
    try {
      await runAgent(1, initialPrompt);
    } catch (error: any) {
      console.error("Erreur lors de l'exécution de l'agent de l'Atelier 1:", error);
      setError(error.message || "Une erreur inconnue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = project.context && project.businessValues.length > 0;

  return (
    <div className="space-y-8">
      {isLoading ? (
        <Loader text="L'agent de l'Atelier 1 analyse votre demande et génère les artefacts..." />
      ) : hasData ? (
        // --- VUE DES RÉSULTATS APRÈS GÉNÉRATION ---
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-text-primary mb-4">1. Description du Contexte (Généré par IA)</h2>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent bg-gray-50 text-text-primary whitespace-pre-wrap font-mono text-sm"
                value={project.context}
                onChange={(e) => updateContext(e.target.value)}
              />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-text-primary mb-4">2. Socle de Sécurité (Généré par IA)</h2>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent bg-gray-50 text-text-primary whitespace-pre-wrap font-mono text-sm"
                value={project.securityBaseline}
                onChange={(e) => updateSecurityBaseline(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-text-primary">3. Valeurs Métier (Générées par IA)</h2>
            {project.businessValues.length > 0 ? (
              <div className="space-y-2 mt-4">
                {project.businessValues.map(v => <div key={v.id} className="p-3 border rounded-lg bg-gray-50"><p className="font-semibold text-text-primary">{v.name}</p><p className="text-sm text-text-secondary">{v.description}</p></div>)}
              </div>
            ) : <p className="text-center text-gray-500 py-4">Aucune valeur métier générée.</p>}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-text-primary">4. Événements Redoutés (Générés par IA)</h2>
            {project.dreadedEvents.length > 0 ? (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-text-secondary">Événement</th><th className="px-4 py-2 text-left text-text-secondary">Gravité</th></tr></thead>
                  <tbody>
                    {project.dreadedEvents.map(e => (
                      <tr key={e.id}><td className="border-t px-4 py-2 text-text-primary">{e.name}</td><td className="border-t px-4 py-2"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${SEVERITY_LEVELS[e.severity]?.bgColor} ${SEVERITY_LEVELS[e.severity]?.color}`}>{e.severity}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-center text-gray-500 py-4">Aucun événement redouté généré.</p>}
          </div>
        </div>
      ) : (
        // --- VUE INITIALE D'APPEL À L'ACTION ---
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Lancez l'analyse de l'Atelier 1</h2>
          <p className="text-text-secondary mb-4">Pour commencer, décrivez votre projet. L'IA utilisera cette description pour générer l'ensemble des éléments de cadrage (contexte, socle de sécurité, valeurs métier, événements redoutés).</p>
          
          <div className="grid lg:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="initialPrompt" className="block text-sm font-medium text-text-primary mb-2">Description de votre projet ou système</label>
                  <textarea
                      id="initialPrompt"
                      className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent transition-shadow"
                      placeholder={`Exemple :\n- Mission : Plateforme e-commerce pour produits artisanaux.\n- Utilisateurs : Clients, artisans, administrateurs.\n- Données sensibles : Informations personnelles des clients, données de paiement (via un prestataire externe).\n- Contraintes : Conformité RGPD stricte.\n- Technologie : Application web hébergée sur un cloud public en Europe.`}
                      value={initialPrompt}
                      onChange={(e) => setInitialPrompt(e.target.value)}
                  />
              </div>
              <div className="bg-brand-light/50 p-4 rounded-lg border border-brand-accent/30">
                  <h3 className="text-lg font-semibold text-brand-dark flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Conseils pour une description efficace
                  </h3>
                  <p className="text-sm text-brand-dark/80 mt-2 mb-3">Pour aider l'IA, pensez à inclure :</p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                      <li>La <span className="font-semibold">mission principale</span> du système.</li>
                      <li>Les <span className="font-semibold">types d'utilisateurs</span> (ex: public, admin, etc.).</li>
                      <li>Les <span className="font-semibold">données les plus sensibles</span> qu'il manipule.</li>
                      <li>Les <span className="font-semibold">contraintes réglementaires</span> ou normatives (ex: RGPD, ISO 27001).</li>
                      <li>Le <span className="font-semibold">contexte technologique</span> (ex: Cloud, application mobile).</li>
                  </ul>
              </div>
          </div>
          
          <div className="text-center mt-6">
            <button 
              onClick={handleRunAgent} 
              disabled={isLoading || !initialPrompt} 
              className="w-full md:w-auto px-8 py-3 bg-brand-primary text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              Générer l'Atelier 1 avec l'IA
            </button>
          </div>
           {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200" role="alert">
                  <p className="font-bold">Erreur de l'agent</p>
                  <p>{error}</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step1Cadrage;