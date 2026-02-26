import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

/**
 * HTTP Interceptor to attach JWT access token to outgoing requests.
 * Automatically includes Authorization: Bearer <token> header.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private oidcService: OidcSecurityService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.oidcService.getAccessToken();

    // Add Authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Add custom headers for tracing
    request = request.clone({
      setHeaders: {
        'X-Request-ID': this.generateRequestId(),
        'X-Forwarded-Proto': 'https',
      },
    });

    return next.handle(request);
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
