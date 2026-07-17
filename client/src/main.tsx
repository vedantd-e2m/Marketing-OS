import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSupabase } from './utils/supabaseClient'

if (window.location.hash.includes('type=invite') || window.location.hash.includes('type=magiclink') || window.location.hash.includes('type=recovery')) {
  sessionStorage.setItem('authRedirect', '/update-password');
}

initSupabase().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
});
