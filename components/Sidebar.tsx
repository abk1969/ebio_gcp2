import React from 'react';
import { STEPS } from '../constants';

interface SidebarProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

// Collection d'icônes pour chaque étape, utilisant le format SVG pour la clarté et l'évolutivité.
const ICONS: Record<number, React.ReactNode> = {
  1: ( // Cadrage et Socle de Sécurité: Un bouclier pour la protection et la fondation.
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417V21h18v-.583c0-3.46-2.29-6.44-5.382-7.434z" />
    </svg>
  ),
  2: ( // Sources de Risque: Un éclair pour représenter une menace ou un danger potentiel.
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  3: ( // Scénarios Stratégiques: Une cible pour symboliser la planification et le ciblage des menaces.
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
    </svg>
  ),
  4: ( // Scénarios Opérationnels: Une loupe pour l'analyse détaillée des chemins d'attaque.
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  5: ( // Traitement et Synthèse: Un presse-papiers pour la documentation, les mesures et le rapport final.
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
};

const Sidebar: React.FC<SidebarProps> = ({ currentStep, setCurrentStep }) => {
  return (
    <aside className="w-64 bg-brand-primary text-white flex-shrink-0 flex flex-col">
       <div className="h-16 flex items-center justify-center bg-brand-dark shadow-md">
        <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="ml-2 text-lg font-bold">Club EBIOS</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            className={`w-full text-left flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
              currentStep === index
                ? 'bg-brand-accent text-white'
                : 'text-blue-100 hover:bg-brand-secondary hover:text-white'
            }`}
          >
            <div className="h-5 w-5 mr-4 flex-shrink-0" aria-hidden="true">
              {ICONS[step.id]}
            </div>
            <span className="flex-1">{step.title}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-700 text-center text-xs text-blue-200">
        <p>Propulsé par Gemini AI</p>
        <p className="mt-2">Ce POC est une interprétation de l'appel à projet et utilise une API Cloud. Un modèle open-source local peut être substitué.</p>
      </div>
    </aside>
  );
};

export default Sidebar;