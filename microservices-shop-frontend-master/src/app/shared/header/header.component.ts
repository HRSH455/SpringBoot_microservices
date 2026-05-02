import {Component, inject, OnInit, DestroyRef} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly destroyRef = inject(DestroyRef);
  isAuthenticated = false;
  username = "";

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({isAuthenticated}) => {
        this.isAuthenticated = isAuthenticated;
      });
    
    this.oidcSecurityService.userData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({userData}) => {
        this.username = userData?.preferred_username ?? '';
      });
  }

  login(): void {
    this.oidcSecurityService.authorize();
  }

  logout(): void {
    this.oidcSecurityService
      .logoff()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => console.log(result));
  }
}
