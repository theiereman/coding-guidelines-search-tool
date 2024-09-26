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
import { IGitlabProject } from '../interfaces/gitlab/igitlab-project';
import { last } from 'lodash';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class GitlabService {
  constructor(
    private authService: GitlabAuthService,
    private alertsService: AlertsService,
    private httpClient: HttpClient
  ) {}

  public getProject(projectId: number): Observable<IGitlabProject> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of();
    }

    return this.httpClient
      .get<IGitlabProject>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les informations du projet'
          );
          return of();
        })
      );
  }

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

  public getOpenMilestonesFromProject(
    projectId: number
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of([]);
    }

    return this.httpClient
      .get<IGitlabMilestone[]>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}/milestones?order_by=title&state=active`,
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

  //TODO: récupérer les dernières milestones fermées pour pouvoir créer des correctifs en une seule fois sur plusieurs anciennes versions

  getLastMilestonesOfOldVersionsFromProject(
    projectId: number,
    maxResults: number = 3
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of([]);
    }

    return this.httpClient
      .get<IGitlabMilestone[]>(
        `${environment.gitlab_api_base_uri}/projects/${projectId}/milestones?state=closed&order_by=due_date&sort=desc&per_page=100`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        }
      )
      .pipe(
        map((milestones: IGitlabMilestone[]) => {
          return milestones
            .reduce<IGitlabMilestone[]>((acc, milestone) => {
              const baseTitle =
                this.extractBaseVersionFromMilestoneTitle(milestone);
              const isVersionPresent = acc.some(
                (m) =>
                  this.extractBaseVersionFromMilestoneTitle(m) === baseTitle
              );

              if (!isVersionPresent && acc.length < maxResults) {
                acc.push(milestone);
              }

              return acc;
            }, [])
            .sort((a, b) => a.title.localeCompare(b.title))
            .reverse();
        }),
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les milestones du projet'
          );
          return of([]);
        })
      );
  }

  searchClosedMilestonesFromProject(
    projectId: number,
    query: string,
    maxResults: number = 20
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return of([]);
    }

    if (query.trim() === '') return of([]);

    //empeche la recherche de sous versions pour forcer à trouver forcément la dernière milestone corrective
    const numericQuery = query.replace(/[^\d.]/g, '');
    const url = `${environment.gitlab_api_base_uri}/projects/${projectId}/milestones?search=${numericQuery}&per_page=${maxResults}&state=closed`;

    return this.httpClient
      .get<IGitlabMilestone[]>(url, {
        context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
      })
      .pipe(
        map((milestones: IGitlabMilestone[]) => {
          if (milestones.length === 0) return [];

          milestones.sort((a, b) => a.title.localeCompare(b.title));
          const lastMilestone = milestones[milestones.length - 1];

          // nouvelle milestone fictive en incrémentant le dernier caractère
          const nextMilestoneTitle = this.incrementMilestone(
            lastMilestone.title
          );

          const newMilestone: IGitlabMilestone = {
            id: -1, // ID fictif
            title: nextMilestoneTitle,
            state: 'fake',
          };

          // Retourner seulement la dernière milestone et la nouvelle fictive
          return [lastMilestone, newMilestone];
        }),
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les milestones du projet'
          );
          return of([]);
        })
      );
  }

  // Fonction utilitaire pour incrémenter le dernier caractère
  private incrementMilestone(title: string): string {
    const match = title.match(/^(.*?)([a-z])$/i); // Capture la partie finale (dernière lettre)
    if (match) {
      const prefix = match[1]; // Partie avant la lettre
      const lastChar = match[2]; // Dernier caractère
      const newChar = String.fromCharCode(lastChar.charCodeAt(0) + 1); // Incrémenter le dernier caractère
      return prefix + newChar;
    } else {
      // Si pas de lettre à la fin, on ajoute 'a'
      return title + 'a';
    }
  }

  private extractBaseVersionFromMilestoneTitle(milestone: IGitlabMilestone) {
    // Si le titre se termine par une lettre (a-z), on l'enlève pour la comparaison
    const match = milestone.title.match(/^(.*?)([a-z]?)$/i);
    return match ? match[1] : milestone.title;
  }
}
