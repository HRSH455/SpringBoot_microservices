import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {authConfig} from "./config/auth.config";
import {provideAuth} from "angular-auth-oidc-client";
import {authInterceptor} from "./interceptors/auth.interceptor";
import {httpErrorInterceptor} from "./interceptors/http-error.interceptor";

/**
 * Angular application configuration
 * Configures routing, HTTP client with functional interceptors, and OIDC authentication
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, httpErrorInterceptor])
    ),
    provideAuth(authConfig),
  ]
};

