import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { HttpParams } from '@angular/common/http';
import { Base64 } from 'js-base64';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GitlabAuthService {
  private clientId = environment.gitlab_app_id;
  private redirectUri = environment.gitlab_auth_redirect_uri;
  private authUrl = `${environment.gitlab_app_base_uri}/oauth/authorize`;
  private tokenUrl = `${environment.gitlab_app_base_uri}/oauth/token`;

  private isAuthenticated$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(this.isAuthenticated());
  constructor(private http: HttpClient, private router: Router) {}

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
    localStorage.setItem('gitlab_state', state);
    localStorage.setItem('gitlab_code_verifier', codeVerifier);

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
    const storedState = localStorage.getItem('gitlab_state');
    const codeVerifier = localStorage.getItem('gitlab_code_verifier');
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
        .subscribe((response: any) => {
          console.log('Access Token:', response.access_token);
          localStorage.setItem('gitlab_access_token', response.access_token);
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
    return !!localStorage.getItem('gitlab_access_token');
  }

  getAccessToken(): string {
    return localStorage.getItem('gitlab_access_token') ?? '';
  }

  private clearLocalStorage() {
    localStorage.removeItem('gitlab_access_token');
    localStorage.removeItem('gitlab_state');
    localStorage.removeItem('gitlab_code_verifier');
  }
}
