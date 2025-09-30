import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Step1Cadrage from './components/steps/Step1Context';
import Step2_3_Scenarios from './components/steps/Step2Scenarios';
import Step4_5_6_Synthesis from './components/steps/Step3Synthesis';
import Chatbot from './components/Chatbot';
import ExportModal from './components/ExportModal';
import DiagnosticPanel from './components/DiagnosticPanel';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { STEPS } from './constants';
import { exportToPdf, exportToExcel } from './services/exportService';

const AppContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { project } = useProject();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const renderContent = () => {
    if (showSettings) {
      return <Settings />;
    }

    const stepId = STEPS[currentStep]?.id;
    switch (stepId) {
      case 1:
        return <Step1Cadrage />;
      case 2:
        return <Step2_3_Scenarios activeStepId={stepId} />;
      case 3:
        return <Step2_3_Scenarios activeStepId={stepId} />;
      case 4:
        return <Step4_5_6_Synthesis activeStepId={stepId} />;
      case 5:
        return <Step4_5_6_Synthesis activeStepId={stepId} />;
      case 6:
        return <Step4_5_6_Synthesis activeStepId={stepId} />;
      default:
        return <Step1Cadrage />;
    }
  };

  const handleExportPdf = () => {
    exportToPdf(project);
    setIsExportModalOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel(project);
    setIsExportModalOpen(false);
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {showSettings ? (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">Paramètres</h1>
                <p className="text-text-secondary mb-6">Configuration des modèles de langage et paramètres de l'application</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{STEPS[currentStep].title}</h1>
                <p className="text-text-secondary mb-6">{STEPS[currentStep].description}</p>
              </>
            )}
            {renderContent()}
          </div>
          {!showSettings && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8 max-w-7xl mx-auto">
                <button
                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="w-full sm:w-auto px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Précédent
                </button>
                <button
                    onClick={() => {
                        if (!isLastStep) {
                            setCurrentStep(s => s + 1);
                        } else {
                            setIsExportModalOpen(true);
                        }
                    }}
                    className={`w-full sm:w-auto px-6 py-2 text-white rounded-lg shadow-sm transition-colors ${
                      isLastStep 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-brand-primary hover:bg-brand-dark'
                    }`}
                >
                    {isLastStep ? "Terminer l'analyse" : "Suivant"}
                </button>
            </div>
          )}
        </main>
      </div>
      <Chatbot />
      <DiagnosticPanel />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />
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