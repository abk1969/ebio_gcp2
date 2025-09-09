import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Step1Cadrage from './components/steps/Step1Context';
import Step2_3_Scenarios from './components/steps/Step2Scenarios';
import Step4_5_Synthese from './components/steps/Step3Synthesis';
import Chatbot from './components/Chatbot';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { STEPS } from './constants';

const AppContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { project } = useProject();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Vérifier si le projet a des données qui méritent d'être sauvegardées.
      const isDirty =
        project.context !== '' ||
        project.securityBaseline !== '' ||
        project.businessValues.length > 0 ||
        project.dreadedEvents.length > 0 ||
        project.riskSources.length > 0 ||
        project.strategicScenarios.length > 0 ||
        project.operationalScenarios.length > 0 ||
        project.securityMeasures.length > 0;

      if (isDirty) {
        // Déclenche la boîte de dialogue de confirmation native du navigateur.
        event.preventDefault();
        // Requis par certaines anciennes versions de navigateurs.
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Nettoyer l'écouteur d'événement lorsque le composant est démonté.
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [project]); // L'effet dépend de l'état du projet.

  const renderStep = () => {
    const stepId = STEPS[currentStep]?.id;
    switch (stepId) {
      case 1:
        return <Step1Cadrage />;
      case 2:
        return <Step2_3_Scenarios activeStepId={stepId} />;
      case 3:
        return <Step2_3_Scenarios activeStepId={stepId} />;
      case 4:
        return <Step4_5_Synthese activeStepId={stepId} />;
      case 5:
        return <Step4_5_Synthese activeStepId={stepId} />;
      default:
        return <Step1Cadrage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar currentStep={currentStep} setCurrentStep={setCurrentStep} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{STEPS[currentStep].title}</h1>
            <p className="text-text-secondary mb-6">{STEPS[currentStep].description}</p>
            {renderStep()}
          </div>
          <div className="flex justify-between mt-8 max-w-7xl mx-auto">
              <button
                  onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  Précédent
              </button>
              <button
                  onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
                  disabled={currentStep === STEPS.length - 1}
                  className="px-6 py-2 bg-brand-primary text-white rounded-lg shadow-sm hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  Suivant
              </button>
          </div>
        </main>
      </div>
      <Chatbot />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};


export default App;