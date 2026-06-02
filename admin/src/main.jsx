import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

import { SocketProvider } from './context/SocketContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminAuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SocketProvider>
    </AdminAuthProvider>
  </StrictMode>,
)
