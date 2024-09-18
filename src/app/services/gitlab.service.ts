import { Injectable } from '@angular/core';
import { GitlabAuthService } from './gitlab-auth.service';
import { AlertsService } from './alerts.service';
import { IGitlabUser } from '../interfaces/gitlab/igitlabuser';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GitlabService {
  constructor(
    private authService: GitlabAuthService,
    private alertService: AlertsService,
    private httpClient: HttpClient
  ) {}

  getAuthenticatedUser(): Observable<IGitlabUser | undefined> {
    if (!this.authService.isAuthenticated()) return of(undefined);

    const userInfoUrl = `${environment.gitlab_api_base_uri}/user`;
    return this.httpClient
      .get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${this.authService.getAccessToken()}`,
        },
      })
      .pipe(
        map((res: any) => {
          console.log(res);
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
          },
        }),
        catchError(() => {
          return of(undefined);
        })
      );
  }
}
