import { createContext } from 'react';
import type { ReactNode } from 'react';

export interface ModalConfig {
  title?: string;
  content?: ReactNode;
  actions?: ReactNode;
}

export interface ModalContextType {
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
