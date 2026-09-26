import { provideHttpClient } from '@angular/common/http';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AbstractSecurityStorage, DefaultLocalStorageService, provideAuth } from 'angular-auth-oidc-client';
import { App } from './app/app';

const keys = ['ALGEBRIX_ISSUER', 'ALGEBRIX_CLIENT_ID', 'ALGEBRIX_REDIRECT_URI', 'ALGEBRIX_POST_LOGOUT_REDIRECT_URI'];

function showMessage(message: string) {
  document.body.textContent = message;
}

const response = await fetch('/config.json').catch(() => null);
const config: Record<string, string> | null = response?.ok ? await response.json().catch(() => null) : null;
const missing = config ? keys.filter((key) => !config[key]) : [];

if (!config) {
  showMessage('Missing public/config.json. Copy public/config.example.json to public/config.json and set it.');
} else if (missing.length) {
  showMessage(`Missing configuration in public/config.json: ${missing.join(', ')}.`);
} else {
  bootstrapApplication(App, {
    providers: [
      provideBrowserGlobalErrorListeners(),
      // The library makes its discovery and token requests with HttpClient.
      provideHttpClient(),
      provideAuth({
        config: {
          authority: config['ALGEBRIX_ISSUER'],
          clientId: config['ALGEBRIX_CLIENT_ID'],
          redirectUrl: config['ALGEBRIX_REDIRECT_URI'],
          postLogoutRedirectUri: config['ALGEBRIX_POST_LOGOUT_REDIRECT_URI'],
          scope: 'openid profile email',
          responseType: 'code',
          // Renew with the refresh token only: no iframe and no prompt=none.
          silentRenew: true,
          useRefreshToken: true,
          renewTimeBeforeTokenExpiresInSeconds: 30,
          // Algebrix Identity issues refresh tokens without the offline_access scope.
          disableRefreshTokenOfflineAccessScopeWarning: true,
          // Show the ID token claims, not the userinfo response.
          autoUserInfo: false,
          // Report the sign-in result to the app instead of navigating with the router.
          triggerAuthorizationResultEvent: true,
        },
      }),
      // Tokens live in localStorage so users stay signed in across reloads. See "Token storage" in the README.
      { provide: AbstractSecurityStorage, useClass: DefaultLocalStorageService },
    ],
  }).catch((err) => console.error(err));
}
