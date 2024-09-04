import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { HttpParams } from '@angular/common/http';
import { Base64 } from 'js-base64';

@Injectable({
  providedIn: 'root',
})
export class GitlabAuthService {
  private clientId = environment.gitlab_app_id;
  private redirectUri = environment.gitlab_auth_redirect_uri;
  private authUrl = `${environment.gitlab_app_base_uri}/oauth/authorize`;
  private tokenUrl = `${environment.gitlab_app_base_uri}/oauth/token`;
  private codeVerifier: string = '';
  private state: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  //The CODE_VERIFIER is a random string, between 43 and 128 characters in length, which use the characters A-Z, a-z, 0-9, -, ., _, and ~.
  generateCodeVerifier() {
    this.codeVerifier = uuidv4() + uuidv4() + uuidv4();
    return this.codeVerifier;
  }

  //The CODE_CHALLENGE is an URL-safe base64-encoded string of the SHA256 hash of the CODE_VERIFIER
  generateCodeChallenge(codeVerifier: string) {
    return this.sha256(codeVerifier).then((hash) => {
      return Base64.encodeURI(hash);
    });
  }

  sha256(plain: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data).then((buffer) => {
      return this.bufferToBase64UrlEncoded(buffer);
    });
  }

  //The SHA256 hash must be in binary format before encoding
  bufferToBase64UrlEncoded(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    const binary = String.fromCharCode.apply(null, [...bytes]); //TODO : test it!
    return Base64.encodeURI(binary);
  }

  login() {
    this.codeVerifier = this.generateCodeVerifier();
    this.state = uuidv4();

    this.generateCodeChallenge(this.codeVerifier).then((codeChallenge) => {
      const params = new HttpParams()
        .set('client_id', this.clientId)
        .set('redirect_uri', this.redirectUri)
        .set('response_type', 'code')
        .set('state', this.state)
        .set('code_challenge', codeChallenge)
        .set('code_challenge_method', 'S256')
        .set('scope', 'read_user api');

      const authUrlWithParams = `${this.authUrl}?${params.toString()}`;
      window.location.href = authUrlWithParams;
    });
  }

  handleRedirectCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');

    if (code && returnedState === this.state) {
      const body = new HttpParams()
        .set('client_id', this.clientId)
        .set('redirect_uri', this.redirectUri)
        .set('grant_type', 'authorization_code')
        .set('code', code)
        .set('code_verifier', this.codeVerifier);

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
      console.error('State mismatch or code missing in the callback');
    }
  }

  logout() {
    localStorage.removeItem('gitlab_access_token');
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('gitlab_access_token');
  }
}
