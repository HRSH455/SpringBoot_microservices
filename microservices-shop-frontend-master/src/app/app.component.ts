import {Component, inject, OnInit, DestroyRef} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {RouterModule} from "@angular/router";
import {HeaderComponent} from "./shared/header/header.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {AsyncPipe, NgFor, NgIf} from "@angular/common";
import {Observable} from "rxjs";
import {ErrorNotificationService, ErrorNotification} from "./services/error-notification.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent, AsyncPipe, NgIf, NgFor],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'microservices-shop-frontend';

  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly notificationService = inject(ErrorNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications$: Observable<ErrorNotification[]> = this.notificationService.notifications$;

  ngOnInit(): void {
    this.oidcSecurityService
      .checkAuth()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({isAuthenticated}) => {
        console.log('app authenticated', isAuthenticated);
      });
  }
}
