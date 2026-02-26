import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

/**
 * Global HTTP Error Interceptor
 * Handles all HTTP errors across the application
 * - Logs errors consistently
 * - Provides user-friendly error messages
 * - Can be extended for retry logic, error tracking, etc.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

  constructor() { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
      console.error('Client-side error:', error.error);
    } else {
      // Server-side error
      const serverError = error.error as any;
      
      // Extract error message from server response
      if (serverError && typeof serverError === 'object') {
        if (serverError.message) {
          errorMessage = serverError.message;
        } else if (serverError.error) {
          errorMessage = serverError.error;
        }
      }

      // Provide context-specific messages
      switch (error.status) {
        case 400:
          errorMessage = `Bad Request: ${errorMessage}`;
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access Denied.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 409:
          errorMessage = 'Conflict: ' + errorMessage;
          break;
        case 500:
          errorMessage = 'Internal Server Error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service Unavailable. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
      }
      
      console.error(
        `HTTP Error ${error.status}: ${error.statusText}`,
        `Endpoint: ${error.url}`,
        serverError
      );
    }

    return throwError(() => new Error(errorMessage));
  }
}
