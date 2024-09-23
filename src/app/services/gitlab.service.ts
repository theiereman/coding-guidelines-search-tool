import { Injectable } from '@angular/core';
import { GitlabAuthService } from './gitlab-auth.service';
import { AlertsService } from './alerts.service';
import { IGitlabUser } from '../interfaces/gitlab/igitlab-user';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, map, max, Observable, of, tap } from 'rxjs';
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
        `${
          environment.gitlab_api_base_uri
        }/projects/${projectId}/issues?per_page=100&sort=asc${
          openOnly ? '&state=opened' : ''
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

  public searchIssuesFromProject(
    projectId: number,
    query: string,
    openOnly: boolean = true,
    maxResults: number = 20
  ): Observable<IGitlabIssue[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of([]);
    }

    const isUrl = /^https?:\/\//.test(query);
    const isNumber = /^\d+$/.test(query);
    const isIssueId = query.startsWith('#');

    let url = '';

    if (query.trim() === '') return of([]);

    if (isUrl) {
      const projectId = query.split('/').pop();
      if (!projectId || isNaN(+projectId)) return of([]);
      url = `${environment.gitlab_api_base_uri}/projects/${projectId}/issues?iids[]=${projectId}`;
    } else if (isIssueId || isNumber) {
      const issueId = query.replace('#', '');
      url = `${environment.gitlab_api_base_uri}/projects/${projectId}/issues?iids[]=${issueId}`;
    } else {
      url = `${environment.gitlab_api_base_uri}/projects/${projectId}/issues?search=${query}&in=title`;
    }

    url = `${url}&per_page=${maxResults}&${
      openOnly === true ? 'state=opened' : ''
    }`;

    return this.httpClient
      .get<IGitlabIssue[]>(url, {
        context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les issues du projet'
          );
          return of([]);
        })
      );
  }

  addIssueToLocalStorage(issue: IGitlabIssue) {
    let issuesArray: IGitlabIssue[] = this.getIssuesFromLocalStorage();
    issuesArray.unshift(issue);
    localStorage.setItem('issues', JSON.stringify(issuesArray));
  }

  getIssuesFromLocalStorage(size: number = 10): IGitlabIssue[] {
    const issues = JSON.parse(localStorage.getItem('issues') ?? '[]');
    const uniqueIssues = issues.filter(
      (issue: IGitlabIssue, index: number, self: IGitlabIssue[]) =>
        index === self.findIndex((t) => t.iid === issue.iid)
    );
    return uniqueIssues.slice(0, size);
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
