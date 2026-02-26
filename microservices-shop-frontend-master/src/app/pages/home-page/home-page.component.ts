import {Component, inject, OnInit, DestroyRef} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {Product} from "../../model/product";
import {ProductService} from "../../services/product/product.service";
import {AsyncPipe, JsonPipe} from "@angular/common";
import {Router} from "@angular/router";
import {Order} from "../../model/order";
import {FormsModule} from "@angular/forms";
import {OrderService} from "../../services/order/order.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {switchMap, finalize} from "rxjs";

@Component({
  selector: 'app-homepage',
  templateUrl: './home-page.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    JsonPipe,
    FormsModule
  ],
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  isAuthenticated = false;
  products: Array<Product> = [];
  quantityIsNull = false;
  orderSuccess = false;
  orderFailed = false;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(({isAuthenticated}) => {
          this.isAuthenticated = isAuthenticated;
          return this.productService.getProducts();
        })
      )
      .subscribe({
        next: (products) => {
          this.products = products;
        },
        error: (err) => {
          console.error('Error loading products:', err);
          this.showError('Failed to load products');
        }
      });
  }

  goToCreateProductPage() {
    this.router.navigateByUrl('/add-product');
  }

  /**
   * Place order with comprehensive error handling
   */
  orderProduct(product: Product, quantity: string) {
    // Validate input
    if (!quantity) {
      this.showError('Quantity is required');
      this.quantityIsNull = true;
      return;
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      this.showError('Quantity must be a positive number');
      this.quantityIsNull = true;
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.oidcSecurityService.userData$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(result => {
          if (!result.userData) {
            throw new Error('User data not available');
          }

          const userDetails = {
            email: result.userData.email,
            firstName: result.userData.firstName,
            lastName: result.userData.lastName
          };

          const order: Order = {
            skuCode: product.skuCode,
            price: product.price,
            quantity: parsedQuantity,
            userDetails: userDetails
          };

          return this.orderService.orderProduct(order);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.orderSuccess = true;
          this.orderFailed = false;
          this.showSuccess('Order placed successfully!');
          this.resetForm();
        },
        error: (err) => {
          this.orderFailed = true;
          this.orderSuccess = false;
          
          // Extract error message from HTTP response
          let errorMessage = 'Failed to place order. Please try again.';
          if (err?.error?.message) {
            errorMessage = err.error.message;
          } else if (err?.error?.error) {
            errorMessage = err.error.error;
          } else if (err?.message) {
            errorMessage = err.message;
          }
          
          console.error('Order placement error:', err);
          this.showError(errorMessage);
        }
      });
  }

  /**
   * Display error message temporarily
   */
  private showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  /**
   * Display success message temporarily
   */
  private showSuccess(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }

  /**
   * Reset form state
   */
  private resetForm() {
    this.quantityIsNull = false;
  }

  /**
   * Clear all messages
   */
  private clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }
}


          const order: Order = {
            skuCode: product.skuCode,
            price: product.price,
            quantity: Number(quantity),
            userDetails: userDetails
          };

          return this.orderService.orderProduct(order);
        })
      )
      .subscribe({
        next: () => {
          this.orderSuccess = true;
          this.orderFailed = false;
          this.quantityIsNull = false;
        },
        error: () => {
          this.orderFailed = true;
          this.orderSuccess = false;
        }
      });
  }
}
