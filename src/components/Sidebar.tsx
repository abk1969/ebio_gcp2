import React from "react";
import { STEPS } from "../constants";

interface SidebarProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const ICONS: Record<number, React.ReactNode> = {
  1: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417V21h18v-.583c0-3.46-2.29-6.44-5.382-7.434z" />
    </svg>
  ),
  2: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  3: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
    </svg>
  ),
  4: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  5: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  6: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

const SETTINGS_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ currentStep, setCurrentStep, isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen, showSettings, setShowSettings }) => {
  const handleNavigateStep = (index: number) => {
    setCurrentStep(index);
    setShowSettings(false);
    setIsMobileMenuOpen(false);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <aside className={`bg-brand-primary text-white flex flex-col transition-transform durée-300 ease-in-out fixed inset-y-0 left-0 z-30 w-64 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:flex-shrink-0 lg:transition-all ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}>
       <div className="h-16 flex items-center justify-center bg-brand-dark shadow-md px-4">
        <svg className="h-8 w-8 text-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className={`ml-2 text-lg font-bold whitespace-nowrap ${isCollapsed ? "lg:hidden" : ""}`}>Club EBIOS</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="relative group">
            <button
              onClick={() => handleNavigateStep(index)}
              className={`w-full text-left flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                !showSettings && currentStep === index
                  ? "bg-brand-accent text-white"
                  : "text-blue-100 hover:bg-brand-secondary hover:text-white"
              } ${isCollapsed ? "lg:justify-center" : ""}`}
              aria-label={step.title}
            >
              <div className="h-5 w-5 flex-shrink-0" aria-hidden="true">
                {ICONS[step.id]}
              </div>
              <span className={`flex-1 ml-4 ${isCollapsed ? "lg:hidden" : ""}`}>{step.title}</span>
            </button>
            {isCollapsed && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-dark text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity durée-300 pointer-events-none z-10 hidden lg:block">
                {step.title}
              </div>
            )}
          </div>
        ))}
        <div className="border-t border-blue-700 my-4" />
        <div className="relative group">
          <button
            onClick={handleOpenSettings}
            className={`w-full text-left flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
              showSettings
                ? "bg-brand-accent text-white"
                : "text-blue-100 hover:bg-brand-secondary hover:text-white"
            } ${isCollapsed ? "lg:justify-center" : ""}`}
            aria-label="Paramètres"
          >
            <div className="h-5 w-5 flex-shrink-0" aria-hidden="true">
              {SETTINGS_ICON}
            </div>
            <span className={`flex-1 ml-4 ${isCollapsed ? "lg:hidden" : ""}`}>Paramètres</span>
          </button>
          {isCollapsed && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-dark text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity durée-300 pointer-events-none z-10 hidden lg:block">
              Paramètres
            </div>
          )}
        </div>
      </nav>
      <div className={`p-4 border-t border-blue-700 ${isCollapsed ? "lg:hidden" : ""}`}>
        <p className="font-semibold text-center text-xs text-blue-200">Powered by GLOBACOM3000/Abbas BENTERKI</p>
        <p className="mt-2 text-center text-xs text-blue-200">© 2025. L'IA peut générer des erreurs. Vérifiez les informations. L'utilisation de cet outil est sous votre seule responsabilité.</p>
      </div>
      <div className="p-2 border-t border-blue-700 hidden lg:block">
          <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-3 text-blue-200 rounded-lg hover:bg-brand-secondary hover:text-white transition-colors"
              aria-label={isCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
          >
              <div className="h-5 w-5">
                  {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                  )}
              </div>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
