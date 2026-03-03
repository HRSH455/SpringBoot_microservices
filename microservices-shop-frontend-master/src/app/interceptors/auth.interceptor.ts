import {HttpInterceptorFn} from "@angular/common/http";
import {inject} from "@angular/core";
import {OidcSecurityService} from "angular-auth-oidc-client";
import {switchMap, catchError} from "rxjs";
import {throwError} from "rxjs";

/**
 * Functional HTTP interceptor to attach JWT access token to outgoing requests.
 * Automatically includes Authorization: Bearer <token> header.
 * Handles errors in token retrieval gracefully.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(OidcSecurityService);

  return authService.getAccessToken().pipe(
    switchMap(token => {
      if (token) {
        const header = 'Bearer ' + token;
        const headers = req.headers.set('Authorization', header);
        const clonedReq = req.clone({headers});
        return next(clonedReq);
      }
      return next(req);
    }),
    catchError(error => {
      console.error('Error retrieving access token:', error);
      // Continue without token if retrieval fails
      return next(req);
    })
  );
}
