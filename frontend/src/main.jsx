import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './router/index.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-elevated)',
            color:      'var(--color-text-primary)',
            border:     '1px solid var(--color-border-default)',
            boxShadow:  'var(--shadow-lg)',
          },
        }}
      />
    </AuthProvider>
  </StrictMode>,
)
