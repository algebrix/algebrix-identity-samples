import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { AuthProvider } from 'react-oidc-context'
import App from './App.tsx'
import './index.css'

const env = import.meta.env
const missing = [
  'VITE_ALGEBRIX_ISSUER',
  'VITE_ALGEBRIX_CLIENT_ID',
  'VITE_ALGEBRIX_REDIRECT_URI',
  'VITE_ALGEBRIX_POST_LOGOUT_REDIRECT_URI',
].filter((key) => !env[key])

// Tokens live in localStorage so users stay signed in across reloads. See "Token storage" in the README.
const store = new WebStorageStateStore({ store: window.localStorage })

// Created once at module scope: a UserManager created inside the component tree would be
// created twice by StrictMode in development, and both instances would renew the token.
const userManager = missing.length
  ? null
  : new UserManager({
      authority: env.VITE_ALGEBRIX_ISSUER,
      client_id: env.VITE_ALGEBRIX_CLIENT_ID,
      redirect_uri: env.VITE_ALGEBRIX_REDIRECT_URI,
      post_logout_redirect_uri: env.VITE_ALGEBRIX_POST_LOGOUT_REDIRECT_URI,
      scope: 'openid profile email',
      userStore: store,
      stateStore: store,
      automaticSilentRenew: true,
    })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {userManager ? (
      <AuthProvider
        userManager={userManager}
        onSigninCallback={() => window.history.replaceState({}, document.title, '/')}
      >
        <App />
      </AuthProvider>
    ) : (
      <p>Missing configuration: {missing.join(', ')}. Copy .env.example to .env, set it, and restart npm start.</p>
    )}
  </StrictMode>,
)
