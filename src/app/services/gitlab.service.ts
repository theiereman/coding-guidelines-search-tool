import { Injectable } from '@angular/core';
import { GitlabAuthService } from './gitlab-auth.service';
import { AlertsService } from './alerts.service';
import { IGitlabUser } from '../interfaces/gitlab/igitlab-user';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { IGitlabLabel } from '../interfaces/gitlab/igitlab-label';
import { IGitlabIssue } from '../interfaces/gitlab/igitlab-issue';
import { IGitlabMilestone } from '../interfaces/gitlab/igitlab-milestone';
import { GITLAB_REQUEST_HEADER } from '../gitlab-auth.interceptor';

@Injectable({
  providedIn: 'root',
})
export class GitlabService {
  constructor(
    private authService: GitlabAuthService,
    private alertsService: AlertsService,
    private httpClient: HttpClient
  ) {}

  public getLabelsFromProject(projectId: number): Observable<IGitlabLabel[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of();
    }

    return this.httpClient
      .get<IGitlabLabel[]>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}/labels`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les labels du projet'
          );
          return of();
        })
      );
  }

  public getIssuesFromProject(
    projectId: number,
    openOnly: boolean
  ): Observable<IGitlabIssue[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of();
    }

    return this.httpClient
      .get<IGitlabIssue[]>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}/issues${
          openOnly ? '?state=opened' : ''
        }`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les issues du projet'
          );
          return of();
        })
      );
  }

  public getMilestonesFromProject(
    projectId: number
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of();
    }

    return this.httpClient
      .get<IGitlabMilestone[]>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}/milestones`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les milestones du projet'
          );
          return of();
        })
      );
  }
}
