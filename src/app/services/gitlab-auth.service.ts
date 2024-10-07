import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AlertsService } from './alerts.service';
import { IGitlabUser } from '../interfaces/gitlab/igitlab-user';
import { GITLAB_REQUEST_HEADER } from '../gitlab-auth.interceptor';
import { AbstractAuthenticationServiceService } from './abstract-authentication-service.service';
import { IGitlabTokenResponse } from '../interfaces/gitlab/igitlab-token-response';

const ACCESS_TOKEN = 'gitlab_access_token';
const REFRESH_TOKEN = 'gitlab_refresh_token';
const GITLAB_STATE = 'gitlab_state';
const GITLAB_CODE_VERIFIER = 'gitlab_code_verifier';

@Injectable({
  providedIn: 'root',
})
export class GitlabAuthService implements AbstractAuthenticationServiceService {
  private clientId = environment.envVar.GITLAB_APP_ID;
  private redirectUri = environment.envVar.GITLAB_AUTH_REDIRECT_URI;
  private authUrl = `${environment.envVar.GITLAB_APP_BASE_URI}/oauth/authorize`;
  private tokenUrl = `${environment.envVar.GITLAB_APP_BASE_URI}/oauth/token`;

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);

  public isAuthenticated$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(this.isAuthenticated());
  constructor(
    private http: HttpClient,
    private router: Router,
    private alertService: AlertsService,
  ) {}

  //The CODE_VERIFIER is a random string, between 43 and 128 characters in length, which use the characters A-Z, a-z, 0-9, -, ., _, and ~.
  generateCodeVerifier() {
    return uuidv4() + uuidv4() + uuidv4();
  }

  bufferToBase64UrlEncoded(buffer: ArrayBuffer) {
    const uint8Array = new Uint8Array(buffer);
    const binaryString = Array.from(uint8Array)
      .map((byte) => String.fromCharCode(byte))
      .join('');
    const base64String = btoa(binaryString);
    return base64String
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  //The CODE_CHALLENGE is an URL-safe base64-encoded string of the SHA256 hash of the CODE_VERIFIER
  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    // Créer un TextEncoder pour convertir le code verifier en Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);

    // Calculer le hash SHA-256 du code verifier
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convertir le buffer en Base64 URL-safe
    const codeChallenge = this.bufferToBase64UrlEncoded(hashBuffer);
    return codeChallenge;
  }

  login() {
    const codeVerifier = this.generateCodeVerifier();
    const state = uuidv4();
    localStorage.setItem(GITLAB_STATE, state);
    localStorage.setItem(GITLAB_CODE_VERIFIER, codeVerifier);

    this.generateCodeChallenge(codeVerifier).then((codeChallenge) => {
      const params = new HttpParams()
        .set('client_id', this.clientId)
        .set('redirect_uri', this.redirectUri)
        .set('response_type', 'code')
        .set('state', state)
        .set('code_challenge', codeChallenge)
        .set('code_challenge_method', 'S256')
        .set('scope', 'api');

      const authUrlWithParams = `${this.authUrl}?${params.toString()}`;
      window.location.href = authUrlWithParams;
    });
  }

  handleRedirectCallback() {
    const params = new URLSearchParams(window.location.search);
    const storedState = localStorage.getItem(GITLAB_STATE);
    const codeVerifier = localStorage.getItem(GITLAB_CODE_VERIFIER);
    const code = params.get('code');
    const returnedState = params.get('state');

    if (code && returnedState === storedState) {
      const body = new URLSearchParams();
      body.set('client_id', this.clientId);
      body.set('redirect_uri', this.redirectUri);
      body.set('grant_type', 'authorization_code');
      body.set('code', code);
      body.set('code_verifier', codeVerifier ?? '');

      this.http
        .post(this.tokenUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .pipe(
          tap({
            error: (err) => {
              this.alertService.addError(
                'Erreur authentification Gitlab : ' +
                  err.error.error_description,
              );
            },
          }),
        )
        .subscribe((response: any) => {
          this.setAccessToken(response.access_token);
          this.setRefreshToken(response.refresh_token);
          this.isAuthenticated$.next(true);
          this.router.navigate(['/']);
        });
    } else {
      this.clearLocalStorage();
      console.error('State mismatch or code missing in the callback');
    }

    this.isAuthenticated$.next(this.isAuthenticated());
  }

  logout() {
    this.clearLocalStorage();
    this.isAuthenticated$.next(false);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN);
  }

  getAccessToken(): string {
    return localStorage.getItem(ACCESS_TOKEN) ?? '';
  }

  getRefreshToken(): string {
    return localStorage.getItem(REFRESH_TOKEN) ?? '';
  }

  setAccessToken(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
  }

  setRefreshToken(refreshToken: string) {
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
  }

  refreshAccessToken(): Observable<IGitlabTokenResponse> {
    //permet de un rafrashchissement unique du token en cas de plusieurs 401 en parallèle
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) =>
          of({ access_token: token } as IGitlabTokenResponse),
        ),
      );
    } else {
      //la première 401 va trigger le refresh qui va faire attendre les autres requêtes
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.getRefreshToken();
      const codeVerifier = localStorage.getItem(GITLAB_CODE_VERIFIER);

      const body = new URLSearchParams();
      body.set('grant_type', 'refresh_token');
      body.set('client_id', this.clientId);
      body.set('refresh_token', refreshToken);
      body.set('code_verifier', codeVerifier ?? '');
      body.set('redirect_uri', this.redirectUri);

      return this.http
        .post<IGitlabTokenResponse>(this.tokenUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .pipe(
          tap((response: IGitlabTokenResponse) => {
            // Met à jour le nouveau token dans le localStorage
            this.setAccessToken(response.access_token);
            this.setRefreshToken(response.refresh_token);

            // Diffuse le nouveau token à toutes les requêtes en attente
            this.refreshTokenSubject.next(response.access_token);

            // Terminer le rafraîchissement
            this.isRefreshing = false;
          }),
          catchError((error) => {
            // Si le rafraîchissement échoue, on réinitialise tout et renvoie l'erreur
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null); // On réinitialise le subject
            console.log(error);
            return throwError(() => new Error(error));
          }),
        );
    }
  }

  getAuthenticatedUser(): Observable<IGitlabUser | undefined> {
    if (!this.isAuthenticated()) return of(undefined);

    const userInfoUrl = `${environment.envVar.GITLAB_API_BASE_URI}/user`;
    return this.http
      .get(userInfoUrl, {
        context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
      })
      .pipe(
        map((res: any) => {
          const userInfo: IGitlabUser = {
            id: res.id,
            username: res.username,
            name: res.name,
            state: res.state,
            locked: res.locked,
            avatar_url: res.avatar_url,
            web_url: res.web_url,
          };
          return userInfo;
        }),
        tap({
          error: (err) => {
            this.alertService.addError(err.message);
            this.logout();
          },
        }),
        catchError(() => {
          return of(undefined);
        }),
      );
  }

  private clearLocalStorage() {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(GITLAB_STATE);
    localStorage.removeItem(GITLAB_CODE_VERIFIER);
  }
}
