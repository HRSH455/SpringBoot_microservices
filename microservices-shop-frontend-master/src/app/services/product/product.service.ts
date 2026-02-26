import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {Product} from "../../model/product";
import {environment} from "../../../environments/environment";
import {catchError, tap} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = `${environment.apiGatewayUrl}/api/product`;

  constructor(private httpClient: HttpClient) {
  }

  /**
   * Get all available products
   * @returns Observable list of products
   * @throws Error if request fails
   */
  getProducts(): Observable<Array<Product>> {
    return this.httpClient.get<Array<Product>>(this.apiUrl)
      .pipe(
        tap(products => console.log(`Fetched ${products.length} products`)),
        catchError(error => this.handleError('getProducts', error))
      );
  }

  /**
   * Create a new product
   * @param product Product to create
   * @returns Observable created product
   * @throws Error if request fails
   */
  createProduct(product: Product): Observable<Product> {
    return this.httpClient.post<Product>(this.apiUrl, product)
      .pipe(
        tap(createdProduct => console.log(`Product created with ID: ${createdProduct.id}`)),
        catchError(error => this.handleError('createProduct', error))
      );
  }

  /**
   * Handle HTTP errors
   * @param operation Name of the operation that failed
   * @param error HttpErrorResponse
   * @returns Error observable
   */
  private handleError(operation = 'operation', error: HttpErrorResponse) {
    let errorMessage = `${operation} failed`;

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
      console.error(`Client-side error in ${operation}:`, error.error.message);
    } else {
      // Server returned an unsuccessful response code
      const serverError = error.error as any;
      if (serverError && serverError.message) {
        errorMessage = serverError.message;
      } else {
        errorMessage = `Server returned error ${error.status}: ${error.statusText}`;
      }
      console.error(
        `Server error in ${operation} - Status: ${error.status}, Message: ${errorMessage}`,
        error
      );
    }

    return throwError(() => new Error(errorMessage));
  }
}
