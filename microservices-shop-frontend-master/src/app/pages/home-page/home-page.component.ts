import {Component, inject, OnInit, DestroyRef} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {Product} from "../../model/product";
import {ProductService} from "../../services/product/product.service";
import {AsyncPipe, JsonPipe} from "@angular/common";
import {Router} from "@angular/router";
import {Order} from "../../model/order";
import {FormsModule} from "@angular/forms";
import {OrderService} from "../../services/order/order.service";
import {ErrorNotificationService} from "../../services/error-notification.service";
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
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(ErrorNotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  isAuthenticated = false;
  products: Array<Product> = [];
  quantityIsNull = false;
  orderSuccess = false;
  orderFailed = false;
  isLoading = false;

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$
      .pipe(
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
      this.orderFailed = true;
      this.orderSuccess = false;
      this.quantityIsNull = true;
      this.showError('Quantity is required');
      return;
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      this.orderFailed = true;
      this.orderSuccess = false;
      this.quantityIsNull = true;
      this.showError('Quantity must be a positive number');
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

  loadMore(): void {
    if (this.products.length < 100) {
      this.notificationService.info('No additional products to load.');
      return;
    }

    this.notificationService.info('Loading more products...');
    // Placeholder for future paging support. Current backend returns a limited product set.
  }

  /**
   * Display error message temporarily
   */
  private showError(message: string) {
    this.notificationService.error(message);
  }

  /**
   * Display success message temporarily
   */
  private showSuccess(message: string) {
    this.notificationService.success(message);
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
    this.orderFailed = false;
    this.orderSuccess = false;
    this.quantityIsNull = false;
  }
}

