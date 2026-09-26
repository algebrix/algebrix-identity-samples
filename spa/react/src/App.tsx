import { Fragment, useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'

export default function App() {
  const auth = useAuth()
  const renewedOnLoad = useRef(false)

  // The access token expired while the page was closed: renew once with the refresh token.
  // Renewal before expiry is automatic (automaticSilentRenew).
  useEffect(() => {
    if (renewedOnLoad.current || auth.isLoading || !auth.user?.expired || !auth.user.refresh_token) return
    renewedOnLoad.current = true
    auth.signinSilent().catch(() => auth.removeUser())
  }, [auth])

  let content
  if (auth.isLoading || auth.activeNavigator === 'signinSilent') {
    content = <p>Loading...</p>
  } else if (!auth.isAuthenticated || !auth.user) {
    content = (
      <>
        {auth.error && <div className="error">{auth.error.message}. See Troubleshooting in the README.</div>}
        <p>React sample: sign in with your Algebrix Identity account.</p>
        <p>
          <button onClick={() => void auth.signinRedirect()}>Sign in</button>
        </p>
      </>
    )
  } else {
    const { profile, access_token, expires_at } = auth.user
    const segment = access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const roles: string[] = JSON.parse(atob(segment)).realm_access?.roles ?? []
    const fields = (['sub', 'preferred_username', 'email', 'name'] as const).filter((key) => profile[key] !== undefined)
    content = (
      <>
        <dl>
          {fields.map((key) => (
            <Fragment key={key}>
              <dt>{key}</dt>
              <dd>{String(profile[key])}</dd>
            </Fragment>
          ))}
          <dt>Roles (realm_access.roles)</dt>
          <dd>{roles.join(', ')}</dd>
          <dt>Access token expires</dt>
          <dd>{expires_at ? new Date(expires_at * 1000).toLocaleString() : 'unknown'}</dd>
        </dl>
        <p className="note">
          Decoded for display only. Your application should not make decisions by decoding the access token; your API
          validates it.
        </p>
        <h2>ID token claims</h2>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
        <p>
          <button onClick={() => void auth.signoutRedirect()}>Sign out</button>
        </p>
      </>
    )
  }

  return (
    <>
      <header>
        <h1>Algebrix Identity</h1>
      </header>
      {content}
    </>
  )
}
