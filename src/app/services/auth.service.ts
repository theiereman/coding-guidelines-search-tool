import { Injectable } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {AuthenticationResult,InteractionStatus, PublicClientApplication, InteractionType} from '@azure/msal-browser';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { Client } from '@microsoft/microsoft-graph-client';
import { Observable,Subject, tap, filter, takeUntil, of, from, map, switchMap, catchError} from 'rxjs';
import { IUser } from '../interfaces/iuser';
import { AlertsService } from './alerts.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public graphClient?: Client;
  private user$ = new Subject<IUser | undefined>();
  private readonly _destroying$ = new Subject<void>();

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private alertService: AlertsService
  ) {
    //vérifie le statut de interactions 
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        this.updateUser();
      })
  }

  getUserObservable(): Observable<IUser | undefined> {
    return this.user$;
  }

  login(): Observable<AuthenticationResult> {
    return this.msalService.loginPopup();
  }

  logout(): Observable<void> {
    return this.msalService.logoutPopup()
    .pipe(
      tap(_ => {
        this.graphClient = undefined;
        this.user$.next(undefined); 
      })
    );
  }

  isAuthenticated(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  handleRedirects(): Observable<AuthenticationResult> {
    return this.msalService.handleRedirectObservable();
  }

  private checkAndSetActiveAccount(){
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      let accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }
  
  private updateUser(): void {
    if (!this.isAuthenticated()) {
      this.user$.next(undefined);
      return;
    }
    // Create an authentication provider for the current user
    const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
      this.msalService.instance as PublicClientApplication,
      {
        account: this.msalService.instance.getActiveAccount()!,
        scopes: ['user.read', 'mailboxsettings.read', 'calendars.readwrite','Sites.Read.All', 'Files.Read.All'],
        interactionType: InteractionType.Popup,
      },
    );

    // Initialize the Graph client
    this.graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    // Get the user from Graph (GET /me)
    from(this.graphClient.api('/me').select('displayName,mail,mailboxSettings,userPrincipalName').get())
      .pipe(
        tap((res) => {
          this.user$.next({
              displayName: res.displayName ?? '',
              email: res.mail ?? res.userPrincipalName ?? ''
            }); 
        }),
        tap((user) => {
          //récupération de l'image de profil au passage
          from(this.graphClient!.api('/me/photo/$value').get())
          .pipe(map((blob) => {
            var reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = () => {
              user.profilePictureBase64 = reader.result;
              this.user$.next({
                ...user,
                profilePictureBase64: reader.result
              });
            }
          })).subscribe();
        }),
        catchError((err) => {
          console.error(err);
          this.alertService.addError(err);
          return of();
        })
      ).subscribe();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
