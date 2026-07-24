import { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ModalContextType {
  showAlert: (message: string, type?: 'info' | 'error' | 'success') => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string; type: 'info' | 'error' | 'success' }>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const showAlert = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAlertConfig({ isOpen: true, message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, message, onConfirm });
  };

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));
  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 mb-4">
                {alertConfig.type === 'error' && <AlertTriangle className="text-red-500" size={24} />}
                {alertConfig.type === 'success' && <CheckCircle className="text-green-500" size={24} />}
                {alertConfig.type === 'info' && <Info className="text-blue-500" size={24} />}
              </div>
              <p className="text-sm text-gray-700 font-medium">{alertConfig.message}</p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={closeAlert}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-amber-50 mb-4">
                <AlertTriangle className="text-amber-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi</h3>
              <p className="text-sm text-gray-600">{confirmConfig.message}</p>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeConfirm}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmConfig.onConfirm();
                  closeConfirm();
                }}
                className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
