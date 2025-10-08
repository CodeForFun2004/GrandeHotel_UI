import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "bootstrap/dist/css/bootstrap.min.css";
import App from './App.tsx'
import { ModalProvider } from './components/context/ModalProvider.tsx'
import { store } from './redux/store.ts';
import { Provider } from 'react-redux'

// NEW:
import { attachInterceptors } from './api/axios';
import { logout } from './redux/slices/authSlice';

// Gắn interceptor SAU khi store đã có
attachInterceptors({
  onLogout: () => store.dispatch(logout()),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <App />
      </ModalProvider>
    </Provider>
  </StrictMode>,
)
