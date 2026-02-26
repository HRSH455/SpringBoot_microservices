import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

/**
 * Angular app configuration with OIDC authentication.
 * Integrates with Keycloak via angular-auth-oidc-client.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(
      AuthModule.forRoot({
        config: {
          authority: `${getKeycloakUrl()}/realms/spring-microservices-security-realm`,
          clientId: 'spring-cloud-client',
          redirectUrl: window.location.origin,
          postLogoutRedirectUrl: window.location.origin,
          scope: 'openid profile email',
          responseType: 'code',
          responseMode: 'query',
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          useRefreshToken: true,
          allowUnsafeReuseRefreshToken: false,
          disableIdTokenValidation: false,
          triggerRefreshWhenIdTokenExpiresIn: 10,
          autoUserInfo: true,
          renewTimeBeforeTokenExpiresInSeconds: 30,
          logLevel: LogLevel.Debug,
          eagerLoadAuthWellknownEndpoints: true,
          forbiddenRoute: '/forbidden',
          unauthorizedRoute: '/unauthorized',
        },
        loader: {
          preloadOnly: true,
          postLoginRoute: '/dashboard',
        },
      })
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
};

/**
 * Get Keycloak URL from environment config or window.APP_CONFIG (set via ConfigMap).
 */
function getKeycloakUrl(): string {
  return (window as any).APP_CONFIG?.keycloakUrl || 'http://keycloak.localdev.me';
}
