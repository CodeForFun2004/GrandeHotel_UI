import  { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ModalContext } from './ModalContext.ts';
import type { ModalConfig } from './ModalContext.ts';

// ...existing code...

// Props cho Provider
interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({});
  const [isClient, setIsClient] = useState(false);

  // Chỉ set client 1 lần khi component mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Lắng nghe phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const openModal = (config: ModalConfig) => {
    setModalConfig(config);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalConfig({});
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {/* Modal chỉ render khi client đã mount */}
      {isClient && isOpen && (
        <div
          suppressHydrationWarning
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '5px',
              maxWidth: '450px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalConfig.title && (
              <h2 style={{ marginTop: 0 }}>{modalConfig.title}</h2>
            )}
            {modalConfig.content}
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                border:'0px',
                borderRadius:20
              }}
            >
              {modalConfig.actions || (
                <button style={{  border:'0px',borderRadius:10,fontSize:13,padding:10}} onClick={closeModal}>Đóng</button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

// ...existing code...