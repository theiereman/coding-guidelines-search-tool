import { Injectable } from '@angular/core';
import { GitlabAuthService } from './gitlab-auth.service';
import { AlertsService } from './alerts.service';
import { HttpClient, HttpContext } from '@angular/common/http';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { IGitlabLabel } from '../interfaces/gitlab/igitlab-label';
import {
  IGitlabEditIssue,
  IGitlabIssue,
} from '../interfaces/gitlab/igitlab-issue';
import {
  CLOSED_STATUS,
  FAKE_STATUS,
  IGitlabEditMilestone,
  IGitlabMilestone,
  IGitlabPreparedMilestone,
  OPEN_STATUS,
} from '../interfaces/gitlab/igitlab-milestone';
import { GITLAB_REQUEST_HEADER } from '../gitlab-auth.interceptor';
import { IGitlabProject } from '../interfaces/gitlab/igitlab-project';
import { GITLAB } from '../constants/gitlab.constants';
import { IssueCreationActionsService } from './issue-creation-actions.service';
import { createStandardPublicClientApplication } from '@azure/msal-browser';
import { IGitlabUser } from '../interfaces/gitlab/igitlab-user';

@Injectable({
  providedIn: 'root',
})
export class GitlabService {
  constructor(
    private authService: GitlabAuthService,
    private alertsService: AlertsService,
    private issueCreationActionService: IssueCreationActionsService,
    private httpClient: HttpClient,
  ) {}

  public getProject(projectId: number): Observable<IGitlabProject> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .get<IGitlabProject>(`${GITLAB.API_URI}/projects/${projectId}`, {
        context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            `Impossible de récupérer les informations du projet ${projectId}`,
          );
          return of();
        }),
      );
  }

  public getLabelsFromProject(projectId: number): Observable<IGitlabLabel[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .get<IGitlabLabel[]>(`${GITLAB.API_URI}/projects/${projectId}/labels`, {
        context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les labels du projet',
          );
          return of();
        }),
      );
  }

  public getIssueFromProject(projectId: number, issueId: number) {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .get<IGitlabIssue>(
        `${GITLAB.API_URI}/projects/${projectId}/issues/${issueId}`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          return throwError(
            () =>
              new Error(
                `Impossible de récupérer l'issue ${issueId} du projet ${projectId}`,
              ),
          );
        }),
      );
  }

  public searchIssuesFromProject(
    projectId: number,
    query: string,
    openOnly: boolean = true,
    maxResults: number = 20,
    assignedToUser: IGitlabUser | undefined = undefined,
  ): Observable<IGitlabIssue[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    const isUrl = /^https?:\/\//.test(query);
    const isNumber = /^\d+$/.test(query);
    const isIssueId = query.startsWith('#');

    let url = '';

    if (query.trim() === '') return of([]);

    if (isUrl) {
      const issueId = query.split('/').pop();
      if (!projectId || isNaN(+projectId)) return of([]);
      url = `${GITLAB.API_URI}/projects/${projectId}/issues?iids[]=${issueId}`;
    } else if (isIssueId || isNumber) {
      const issueId = query.replace('#', '');
      url = `${GITLAB.API_URI}/projects/${projectId}/issues?iids[]=${issueId}`;
    } else {
      url = `${GITLAB.API_URI}/projects/${projectId}/issues?search=${query}&in=title`;
    }

    url = `${url}&per_page=${maxResults}&${
      openOnly === true ? 'state=opened' : ''
    }`;

    if (assignedToUser) {
      url = `${url}&assignee_id=${assignedToUser.id}`;
    }

    console.log(url);

    //note : ajout '&with_labels_details=true' dans l'url pour récupérer les labels en détail

    return this.httpClient
      .get<IGitlabIssue[]>(url, {
        context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les issues du projet',
          );
          return of([]);
        }),
      );
  }

  public addIssueToLocalStorage(issue: IGitlabIssue) {
    if (issue.iid === GITLAB.ID_PROJET_CORRECTIONS_DIVERSES) return;
    let issuesArray: IGitlabIssue[] = this.getIssuesFromLocalStorage(10); //on en stocke 10 max
    issuesArray.unshift(issue);
    localStorage.setItem('issues', JSON.stringify(issuesArray));
  }

  public getIssuesFromLocalStorage(size: number = 10): IGitlabIssue[] {
    const issues = JSON.parse(localStorage.getItem('issues') ?? '[]');
    const uniqueIssues = issues.filter(
      (issue: IGitlabIssue, index: number, self: IGitlabIssue[]) =>
        index === self.findIndex((t) => t.iid === issue.iid) &&
        issue.iid !== GITLAB.ID_PROJET_CORRECTIONS_DIVERSES,
    );
    return uniqueIssues.slice(0, size);
  }

  createMilestone(title: string): Observable<IGitlabMilestone> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    const newMilestone: IGitlabMilestone = {
      title,
    };

    return this.httpClient
      .post<IGitlabMilestone>(
        `${GITLAB.API_URI}/projects/${GITLAB.ID_PROJET_REINTEGRATION}/milestones`,
        newMilestone,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            `Impossible de créer la milestone ${title}`,
          );
          return throwError(
            () => new Error(`Impossible de créer la milestone ${title}`),
          );
        }),
      );
  }

  private editMilestone(
    milestone: IGitlabEditMilestone,
  ): Observable<IGitlabMilestone> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    console.log('closing milestone');

    return this.httpClient
      .put<IGitlabMilestone>(
        `${GITLAB.API_URI}/projects/${GITLAB.ID_PROJET_REINTEGRATION}/milestones/${milestone.iid}`,
        milestone,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            `Impossible de modifier la milestone ${milestone.title}`,
          );
          return throwError(
            () =>
              new Error(
                `Impossible de modifier la milestone ${milestone.title}`,
              ),
          );
        }),
      );
  }

  openMilestone(milestone: IGitlabMilestone): Observable<IGitlabMilestone> {
    return this.editMilestone({
      ...milestone,
      state_event: 'activate',
    });
  }

  closeMilestone(milestone: IGitlabMilestone): Observable<IGitlabMilestone> {
    return this.editMilestone({
      ...milestone,
      state_event: 'close',
    });
  }

  //ouvre ou crée une milestone si elle n'est pas valide pour recevoir de nouvelles issues
  private prepareMilestoneForIssueCreation(
    milestone: IGitlabMilestone,
  ): Observable<IGitlabPreparedMilestone> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    if (this.milestoneIsFake(milestone)) {
      return this.createMilestone(milestone.title).pipe(
        map((milestone) => ({ ...milestone, needsToBeClosed: true })),
      );
    } else if (this.milestoneIsClosed(milestone)) {
      return this.openMilestone(milestone).pipe(
        map((milestone) => ({ ...milestone, needsToBeClosed: true })),
      );
    }

    return of(milestone).pipe(
      map((milestone) => ({ ...milestone, needsToBeClosed: false })),
    );
  }

  public getOpenMilestonesFromProject(
    projectId: number,
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .get<IGitlabMilestone[]>(
        `${GITLAB.API_URI}/projects/${projectId}/milestones?order_by=title&state=${OPEN_STATUS}`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        map((milestones) => {
          return milestones.map((milestone) => {
            const title = milestone.title.split(' ')[0];
            return {
              ...milestone,
              title,
            };
          });
        }),
        catchError(() => {
          this.alertsService.addError(
            'Impossible de récupérer les milestones du projet',
          );
          return of([]);
        }),
      );
  }

  //? on pourrait probablement réduire la complexité mais je suis pas assez intelligent pour le faire
  public createIssueReintegration(
    reintegrationIssue: IGitlabIssue,
    selectedMilestones: IGitlabMilestone[],
    selectedProject: IGitlabIssue,
  ): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    let createdIssues: IGitlabIssue[] = [];

    return forkJoin(
      selectedMilestones.map((milestone: IGitlabMilestone) => {
        const issueCreationAction = this.issueCreationActionService.addAction(
          `Milestone '${milestone.title}' -> Création de l'issue de réintégration`,
        );
        return this.prepareMilestoneForIssueCreation(milestone).pipe(
          mergeMap((preparedMilestone) => {
            return this.createNewIssue({
              ...reintegrationIssue,
              milestone_id: preparedMilestone.id!,
            }).pipe(
              //on stocke les issues créées pour les ajouter dans le commentaire
              tap((createdIssue) => {
                createdIssues.push(createdIssue);
              }),
              //fermeture des issues de réintégration
              mergeMap((createdIssue) =>
                this.closeIssue(createdIssue).pipe(
                  map(() => preparedMilestone),
                  catchError(() => {
                    this.issueCreationActionService.addErrorResult(
                      `Milestone ${preparedMilestone.title} - Impossible de refermer l'issue de réintégration`,
                    );
                    return of(preparedMilestone);
                  }),
                ),
              ),
              //création de l"issue ok
              tap(() => {
                this.issueCreationActionService.setActionsResult(
                  issueCreationAction,
                  true,
                );
              }),
              //erreur création de l'issue
              catchError((err) => {
                this.issueCreationActionService.setActionsResult(
                  issueCreationAction,
                  false,
                );
                return of(preparedMilestone); //on renvoie quand même la milestone pour pouvoir la fermer
              }),
            );
          }),
          mergeMap((preparedMilestone) => {
            // Fermer la milestone si nécessaire
            if (preparedMilestone.needsToBeClosed) {
              return this.closeMilestone(preparedMilestone).pipe(
                catchError(() => {
                  this.issueCreationActionService.addErrorResult(
                    `Milestone ${preparedMilestone.title} - Impossible de refermer la milestone`,
                  );
                  return of(false);
                }),
              );
            }
            return of(true);
          }),
        );
      }),
    ).pipe(
      mergeMap(() => {
        return this.addCommentOfReintegrationInLinkedProjectIssue(
          createdIssues,
          selectedProject,
        ).pipe(
          catchError(() => {
            this.issueCreationActionService.addErrorResult(
              "Impossible d'ajouter un commentaire sur le projet selectionné.",
            );
            return of(false);
          }),
          map(() => true),
        );
      }),
    );
  }

  public createNewIssue(issue: IGitlabIssue): Observable<IGitlabIssue> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .post<IGitlabIssue>(
        `${GITLAB.API_URI}/projects/${GITLAB.ID_PROJET_REINTEGRATION}/issues`,
        issue,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError('Impossible de créer une nouvelle issue');
          return throwError(
            () => new Error(`Impossible de créer l'issue ${issue.title}`),
          );
        }),
      );
  }

  public editIssue(issue: IGitlabEditIssue): Observable<IGitlabIssue> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .put<IGitlabIssue>(
        `${GITLAB.API_URI}/projects/${GITLAB.ID_PROJET_REINTEGRATION}/issues/${issue.iid}`,
        issue,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            `Impossible de modifier l'issue ${issue.title}`,
          );
          return throwError(
            () => new Error(`Impossible de modifier l'issue ${issue.title}`),
          );
        }),
      );
  }

  public closeIssue(issue: IGitlabIssue): Observable<IGitlabIssue> {
    return this.editIssue({
      ...issue,
      state_event: 'close',
    });
  }

  public addCommentOfReintegrationInLinkedProjectIssue(
    reintegrationIssues: IGitlabIssue[],
    linkedProjectIssue: IGitlabIssue,
  ): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    if (reintegrationIssues.length === 0) return of();

    const title = reintegrationIssues[0].title; //tous les titres sont les mêmes logiquement
    const reintegrationLinks = reintegrationIssues
      .filter((issue) => issue.web_url && issue.web_url.trim() !== '')
      .map((issue) => {
        return issue.web_url;
      })
      .join(' ; ');

    console.log(
      `${GITLAB.API_URI}/projects/${GITLAB.ID_PROJET_SUIVI_GENERAL}/issues/${linkedProjectIssue.iid}/notes`,
    );

    return this.httpClient
      .post<IGitlabIssue>(
        `${GITLAB.API_URI}/projects/${GITLAB.ID_PROJET_SUIVI_GENERAL}/issues/${linkedProjectIssue.iid}/notes`,
        {
          body: `${title} (${reintegrationLinks})`,
          resolved: false,
        },
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de mentionner la réintégration dans la issue',
          );
          return throwError(
            () =>
              new Error(
                'Impossible de mentionner la réintégration dans la issue',
              ),
          );
        }),
        map(() => {
          this.addIssueToLocalStorage(linkedProjectIssue);
        }),
      );
  }

  getLastClosedVersionsFromProject(
    projectId: number,
    maxResults: number = 3,
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    return this.httpClient
      .get<IGitlabMilestone[]>(
        `${GITLAB.API_URI}/projects/${projectId}/milestones?order_by=due_date&sort=desc&per_page=100`,
        {
          context: new HttpContext().set(GITLAB_REQUEST_HEADER, true),
        },
      )
      .pipe(
        map((milestones: IGitlabMilestone[]) => {
          //récupère que la première partie du titre de la milestone
          milestones = milestones
            .map((milestone) => {
              const title = milestone.title.split(' ')[0];
              return {
                ...milestone,
                title,
              };
            })
            .sort((a, b) => a.title.localeCompare(b.title))
            .reverse();

          const filteredByVersionMilestones = milestones.reduce<
            IGitlabMilestone[]
          >((acc, milestone) => {
            const baseTitle =
              this.extractBaseVersionFromMilestoneTitle(milestone);
            const isVersionPresent = acc.some((m) => {
              return this.extractBaseVersionFromMilestoneTitle(m) === baseTitle;
            });

            //permet de filtrer les versions qui ne contiennent pas de points comme "Dev" qui ne sera jamais une vieille version
            if (baseTitle.split('.').length < 3) return acc;
            if (isVersionPresent) return acc;
            if (acc.length > maxResults) return acc;

            acc.push(milestone);

            return acc;
          }, []);

          //ne renvoie pas les milestones ouvertes
          return filteredByVersionMilestones.reduce<IGitlabMilestone[]>(
            (acc, milestone) => {
              if (this.milestoneIsOpen(milestone)) return acc;
              acc.push(milestone);
              return acc;
            },
            [],
          );
        }),
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les milestones du projet',
          );
          return of([]);
        }),
      );
  }

  searchClosedMilestonesFromProject(
    projectId: number,
    query: string,
    maxResults: number = 20,
  ): Observable<IGitlabMilestone[]> {
    if (!this.authService.isAuthenticated()) {
      this.alertsService.addError('Utilisateur non authentifié sur Gitlab');
      return throwError(
        () => new Error('Utilisateur non authentifié sur Gitlab'),
      );
    }

    if (query.trim() === '') return of([]);

    //empeche la recherche de sous versions pour forcer à trouver forcément la dernière milestone corrective
    const numericQuery = query.replace(/[^\d.]/g, '');
    const url = `${GITLAB.API_URI}/projects/${projectId}/milestones?search=${numericQuery}&per_page=${maxResults}&state=${CLOSED_STATUS}`;

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
          const nextMilestoneTitle = this.incrementMilestoneBugFixVersion(
            lastMilestone.title,
          );

          const newMilestone: IGitlabMilestone = {
            id: -1, // ID fictif
            title: nextMilestoneTitle,
            state: FAKE_STATUS,
          };

          // Retourner seulement la dernière milestone et la nouvelle fictive
          return [lastMilestone, newMilestone];
        }),
        catchError((err) => {
          console.error(err);
          this.alertsService.addError(
            'Impossible de récupérer les milestones du projet',
          );
          return of([]);
        }),
      );
  }

  // Fonction utilitaire pour incrémenter le dernier caractère
  incrementMilestoneBugFixVersion(title: string): string {
    const match = title.match(/^(.*?)([a-z])$/); // Capture la partie finale (dernière lettre)
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
    const match = milestone.title.match(/^(.*?)([a-z]?)$/);
    return match ? match[1] : milestone.title;
  }

  milestoneIsClosed(milestone: IGitlabMilestone) {
    return milestone.state === CLOSED_STATUS;
  }

  milestoneIsOpen(milestone: IGitlabMilestone) {
    return milestone.state === OPEN_STATUS;
  }

  milestoneIsFake(milestone: IGitlabMilestone) {
    return milestone.state === FAKE_STATUS;
  }
}
