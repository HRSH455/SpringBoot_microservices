import { Component, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';
import {ngIf} from "@angular/common";

/**
 * Example component demonstrating OIDC authentication in Angular.
 */
@Component({
  selector: 'app-auth-demo',
  StandAlone: true,
  imports: [ngIf],
  template: `
    <div>
      <ng-container *ngIf="isAuthenticated$ | async as isAuthenticated">
        <ng-container *ngIf="isAuthenticated">
          <p>Welcome, {{ (userData$ | async)?.profile?.email }}</p>
          <button (click)="logout()">Logout</button>
        </ng-container>
        <ng-container *ngIf="!isAuthenticated">
          <button (click)="login()">Login</button>
        </ng-container>
      </ng-container>
    </div>
  `,
})
export class AuthDemoComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;
  userData$: Observable<any>;

  constructor(private oidcService: OidcSecurityService) {
    this.isAuthenticated$ = this.oidcService.isAuthenticated$;
    this.userData$ = this.oidcService.userData$;
  }

  ngOnInit(): void {
    this.oidcService.checkAuth().subscribe(({ isAuthenticated }) => {
      console.log('Authenticated:', isAuthenticated);
    });
  }

  login(): void {
    this.oidcService.authorize();
  }

  logout(): void {
    this.oidcService.logoff();
  }
}
