import React from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExportPdf, onExportExcel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 animate-fade-in-up">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-xl font-bold text-text-primary">Analyse Terminée</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="mt-4">
          <p className="text-text-secondary">Votre analyse de risque EBIOS RM est complète. Vous pouvez maintenant exporter les résultats pour vos archives ou pour les partager.</p>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onExportPdf}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 015 10zM6.5 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM8.5 6.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM10 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 10zM11.5 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM13.5 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z"></path></svg>
            Exporter en PDF
          </button>
          <button
            onClick={onExportExcel}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.75 6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5zM11.25 6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5zM6 10a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 016 10zm7.25-.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z"></path></svg>
            Exporter en Excel
          </button>
        </div>
        <div className="mt-6 text-right">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
