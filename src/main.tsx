import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "bootstrap/dist/css/bootstrap.min.css";
import App from './App.tsx'
import { ModalProvider } from './components/context/ModalProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>,
)
