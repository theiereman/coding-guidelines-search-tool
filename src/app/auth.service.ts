import { Injectable } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {AuthenticationResult,InteractionStatus, PublicClientApplication, InteractionType} from '@azure/msal-browser';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { Client } from '@microsoft/microsoft-graph-client';
import { Observable,Subject, tap, filter, takeUntil, of, from, map} from 'rxjs';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public graphClient?: Client;
  private userSubject = new Subject<User | undefined>();
  private readonly _destroying$ = new Subject<void>();

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {
    //vérifie le statut de interactions 
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        this.getUser().subscribe((user:User | undefined) => {
          console.log(JSON.stringify(user));
        });
      })
  }

  getUserObservable(): Observable<User | undefined> {
    return this.userSubject.asObservable();
  }

  login(): Observable<AuthenticationResult> {
    return this.msalService.loginPopup();
  }

  logout(): Observable<void> {
    return this.msalService.logoutPopup()
    .pipe(
      tap(_ => {
        this.graphClient = undefined;
        this.userSubject.next(undefined); 
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
  
  private getUser(): Observable<User | undefined> {
    if (!this.isAuthenticated()) return of(undefined);

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
    let res:Observable<User> = from(this.graphClient.api('/me').select('displayName,mail,mailboxSettings,userPrincipalName').get())
                    .pipe(map((res) => {
                      console.log(res);
                      const resUser:User = {
                        displayName: res.displayName ?? '',
                        email: res.mail ?? res.userPrincipalName ?? ''
                      }
                      this.userSubject.next(resUser); 
                      return resUser
                    }));

    return res;
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
