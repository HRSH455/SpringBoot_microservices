import {Component, inject, OnInit, DestroyRef} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {RouterModule} from "@angular/router";
import {HeaderComponent} from "./shared/header/header.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'microservices-shop-frontend';

  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.oidcSecurityService
      .checkAuth()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({isAuthenticated}) => {
        console.log('app authenticated', isAuthenticated);
      });
  }
}
