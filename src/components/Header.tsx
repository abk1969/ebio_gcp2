
import React from 'react';

interface HeaderProps {
  readonly setIsMobileMenuOpen?: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsMobileMenuOpen }) => {
  return (
    <header className="bg-white shadow-md z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start h-16">
          {setIsMobileMenuOpen && (
            <button
              className="p-2 mr-2 text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex items-center">
            <svg className="h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.417V21h18v-.583c0-3.46-2.29-6.44-5.382-7.434z" />
            </svg>
            <span className="ml-3 text-xl font-semibold text-gray-800">EBIOS RM AI Assistant</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
