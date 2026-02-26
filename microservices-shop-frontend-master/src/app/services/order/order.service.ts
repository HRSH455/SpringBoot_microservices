import { Injectable } from '@angular/core';
import {Product} from "../../model/product";
import {Observable, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Order} from "../../model/order";
import { environment } from '../../../environments/environment';
import {catchError, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl = `${environment.apiGatewayUrl}/api/order`;

  constructor(private httpClient: HttpClient) {
  }

  /**
   * Place an order for a product
   * @param order Order details with product and user information
   * @returns Observable success message
   * @throws Error if order placement fails
   */
  orderProduct(order: Order): Observable<string> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text' as 'json'
    };
    
    return this.httpClient.post<string>(this.apiUrl, order, httpOptions)
      .pipe(
        tap(response => console.log('Order placed successfully:', response)),
        catchError(error => this.handleError('orderProduct', error))
      );
  }

  /**
   * Handle HTTP errors during order operations
   * @param operation Name of the operation that failed
   * @param error HttpErrorResponse
   * @returns Error observable with user-friendly message
   */
  private handleError(operation = 'operation', error: HttpErrorResponse) {
    let errorMessage = `${operation} failed`;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network Error: ${error.error.message}`;
      console.error(`Client-side error in ${operation}:`, error.error.message);
    } else {
      // Server returned an unsuccessful response code
      const serverError = error.error as any;
      
      // Try to extract error message from server response
      if (serverError && typeof serverError === 'object') {
        if (serverError.message) {
          errorMessage = serverError.message;
        } else if (serverError.error) {
          errorMessage = serverError.error;
        }
      }
      
      // Provide user-friendly messages based on HTTP status
      switch (error.status) {
        case 400:
          errorMessage = `Invalid order: ${errorMessage}`;
          break;
        case 404:
          errorMessage = 'Product or resource not found';
          break;
        case 409:
          errorMessage = 'Product is out of stock';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to server. Please check your connection.';
          break;
      }
      
      console.error(
        `Server error in ${operation} - Status: ${error.status}, Message: ${errorMessage}`,
        error
      );
    }

    return throwError(() => new Error(errorMessage));
  }
}

