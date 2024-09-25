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

    //note : ajout '&with_labels_details=true' dans l'url pour récupérer les labels en détail

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

  public addIssueToLocalStorage(issue: IGitlabIssue) {
    let issuesArray: IGitlabIssue[] = this.getIssuesFromLocalStorage();
    issuesArray.unshift(issue);
    localStorage.setItem('issues', JSON.stringify(issuesArray));
  }

  public getIssuesFromLocalStorage(size: number = 10): IGitlabIssue[] {
    const issues = JSON.parse(localStorage.getItem('issues') ?? '[]');
    const uniqueIssues = issues.filter(
      (issue: IGitlabIssue, index: number, self: IGitlabIssue[]) =>
        index === self.findIndex((t) => t.iid === issue.iid)
    );
    return uniqueIssues.slice(0, size);
  }

  public getLastMilestonesFromProject(
    projectId: number,
    maxResults: number = 2
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of([]);
    }

    return this.httpClient
      .get<IGitlabMilestone[]>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}/milestones?per_page=${maxResults}&order_by=title`,
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
          return of([]);
        })
      );
  }

  public createNewIssue(
    issue: IGitlabIssue
  ): Observable<IGitlabIssue | undefined> {
    return this.httpClient
      .post<IGitlabIssue>(
        `${environment.gitlab_api_base_uri}/projects/${environment.gitlab_id_projet_reintegration}/issues`,
        issue,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError('Impossible de créer une nouvelle issue');
          return of(undefined);
        })
      );
  }

  public addCommentOfReintegrationInLinkedProjectIssue(
    reintegrationIssue: IGitlabIssue,
    linkedProjectIssue: IGitlabIssue
  ): Observable<boolean> {
    return this.httpClient
      .post<IGitlabIssue>(
        `${environment.gitlab_api_base_uri}/projects/${environment.gitlab_id_projet_suivi_general}/issues/${linkedProjectIssue.iid}/notes`,
        {
          body: `${reintegrationIssue.title} (${reintegrationIssue.web_url})`,
          resolved: false,
        },
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de mentionner la réintégration dans la issue'
          );
          return of(false);
        }),
        map(() => {
          this.addIssueToLocalStorage(linkedProjectIssue);
          return true;
        })
      );
  }
}
