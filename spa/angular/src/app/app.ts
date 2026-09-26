import { Component, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { EventTypes, OidcSecurityService, PublicEventsService } from 'angular-auth-oidc-client';
import { filter, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [JsonPipe],
  template: `
    <header><h1>Algebrix Identity</h1></header>
    @if (loading()) {
      <p>Loading...</p>
    } @else if (!authenticated()) {
      @if (sessionEnded()) {
        <div class="info">Your session has ended. Please sign in again.</div>
      }
      @if (error()) {
        <div class="error">{{ error() }}. See Troubleshooting in the README.</div>
      }
      <p>Angular sample: sign in with your Algebrix Identity account.</p>
      <p><button (click)="signIn()">Sign in</button></p>
    } @else {
      <dl>
        @for (key of fields(); track key) {
          <dt>{{ key }}</dt>
          <dd>{{ claims()[key] }}</dd>
        }
        <dt>Roles (realm_access.roles)</dt>
        <dd>{{ roles().join(', ') }}</dd>
        <dt>Access token expires</dt>
        <dd>{{ expires() }}</dd>
      </dl>
      <p class="note">
        Decoded for display only. Your application should not make decisions by decoding the access token; your API
        validates it.
      </p>
      <h2>ID token claims</h2>
      <pre>{{ claims() | json }}</pre>
      <p><button (click)="signOut()">Sign out</button></p>
    }
  `,
})
export class App {
  private readonly oidc = inject(OidcSecurityService);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly sessionEnded = signal(false);
  protected readonly authenticated = computed(() => this.oidc.authenticated().isAuthenticated);
  protected readonly claims = computed(() => this.oidc.userData().userData ?? {});
  protected readonly fields = computed(() =>
    ['sub', 'preferred_username', 'email', 'name'].filter((key) => this.claims()[key] !== undefined),
  );
  private readonly accessPayload = signal<{ exp?: number; realm_access?: { roles?: string[] } }>({});
  protected readonly roles = computed(() => this.accessPayload().realm_access?.roles ?? []);
  protected readonly expires = computed(() => {
    const exp = this.accessPayload().exp;
    return exp ? new Date(exp * 1000).toLocaleString() : 'unknown';
  });

  constructor() {
    const events = inject(PublicEventsService).registerForEvents();
    // Re-read the access token whenever new tokens are stored, including after each renewal.
    events.pipe(filter((event) => event.type === EventTypes.NewAuthenticationResult)).subscribe(() => this.readAccessToken());
    events.pipe(filter((event) => event.type === EventTypes.SilentRenewFailed)).subscribe(() => this.endSession());
    void this.start();
  }

  private async start() {
    const params = new URL(location.href).searchParams;
    const pendingState = params.has('error') ? await firstValueFrom(this.oidc.getState()) : '';
    const { isAuthenticated, errorMessage } = await firstValueFrom(this.oidc.checkAuth());
    if (location.pathname === '/callback') history.replaceState(null, '', '/');

    if (errorMessage) {
      // The library does not report provider errors from the callback. Show one only when its state
      // matches this browser's pending sign-in and its iss is the issuer; anyone can craft a callback link.
      const issuer = (await firstValueFrom(this.oidc.getConfiguration()))?.authority;
      const verified = pendingState && params.get('state') === pendingState && params.get('iss') === issuer;
      this.error.set(
        verified ? `${params.get('error')}: ${params.get('error_description') ?? 'no description'}` : 'Sign-in could not be completed',
      );
    }

    // The access token expired while the page was closed: renew once with the refresh token.
    if (!isAuthenticated && (await firstValueFrom(this.oidc.getRefreshToken()))) {
      const renewed = await firstValueFrom(this.oidc.forceRefreshSession()).catch(() => null);
      // A second checkAuth() starts the library's automatic renewal; it makes no token request.
      if (renewed?.isAuthenticated) await firstValueFrom(this.oidc.checkAuth());
      else this.endSession();
    }
    if (this.authenticated()) this.readAccessToken();
    this.loading.set(false);
  }

  // A failed renewal means the identity session has ended: clear the stored tokens so they are not retried.
  private endSession() {
    this.oidc.logoffLocal();
    this.sessionEnded.set(true);
  }

  // Decoded for display only.
  private readAccessToken() {
    this.oidc.getPayloadFromAccessToken().subscribe((payload) => this.accessPayload.set(payload ?? {}));
  }

  protected signIn() {
    // Load discovery first: authorize() only logs a failure to the console, and the path-form
    // issuer is the most common configuration mistake.
    this.oidc.preloadAuthWellKnownDocument().subscribe({
      next: () => this.oidc.authorize(),
      error: (err) =>
        this.error.set(
          String(err).includes('Issuer mismatch')
            ? 'Sign-in could not start: the configured issuer does not match the discovery document. Use the exact issuer value from the console integration view'
            : 'Sign-in could not start: the discovery document could not be loaded',
        ),
    });
  }

  protected signOut() {
    this.oidc.logoff().subscribe();
  }
}
