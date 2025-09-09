
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417V21h18v-.583c0-3.46-2.29-6.44-5.382-7.434z" />
            </svg>
            <span className="ml-3 text-xl font-semibold text-gray-800">EBIOS RM AI Assistant</span>
          </div>
           <div className="text-xs text-gray-400">
              POC basé sur l'appel à projets du Club EBIOS
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
