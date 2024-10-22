import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, forwardRef, Output } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { ProjectIssueCardComponent } from './project-issue-card/project-issue-card.component';
import { AlertsService } from 'src/app/services/alerts.service';
import { GitlabAuthService } from 'src/app/services/gitlab-auth.service';
import { IGitlabUser } from 'src/app/interfaces/gitlab/igitlab-user';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    NgClass,
    ProjectIssueCardComponent,
  ],
  templateUrl: './project-list.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProjectListComponent),
      multi: true,
    },
  ],
})

//liste des projets de suivi général
export class ProjectListComponent implements ControlValueAccessor {
  searchValueControl: FormControl = new FormControl('');
  openOnlyControl: FormControl = new FormControl(true);
  assignedToMeControl: FormControl = new FormControl(false);
  noProjectControl: FormControl = new FormControl(false);

  authenticatedUser: IGitlabUser | undefined = undefined;

  issues: IGitlabIssue[] = []; //listes des projets
  recentIssues: IGitlabIssue[] = []; //listes des issues récentes dans le local storage
  loadingIssuesList: boolean = false; //indique si les issues sont en tran d'être récupérées pour affichage de chargement

  miscellaneousProject?: IGitlabIssue = undefined; //projet développements divers
  selectedProject?: IGitlabIssue = undefined; //projet actuellement selectionné

  private onChange: (value: IGitlabIssue | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private gitlabService: GitlabService,
    private gitlabAuthService: GitlabAuthService,
    private alertsService: AlertsService,
  ) {}

  ngOnInit(): void {
    this.recentIssues = this.getLocalStorageIssues();
    this.searchValueControl.valueChanges
      .pipe(
        tap(() => (this.loadingIssuesList = true)),
        debounceTime(300),
        switchMap(() => {
          return this.startSearchingForIssues();
        }),
      )
      .subscribe((issues) => {
        this.updateIssuesList(issues);
      });

    //uniquement les issues ouvertes
    this.openOnlyControl.valueChanges
      .pipe(
        tap(() => (this.loadingIssuesList = true)),
        tap(() => {
          this.recentIssues = this.getLocalStorageIssues();
        }),
        switchMap(() => {
          return this.startSearchingForIssues();
        }),
      )
      .subscribe((issues) => {
        this.updateIssuesList(issues);
      });

    //développement lié à aucun projet
    this.noProjectControl.valueChanges.subscribe((_) => {
      if (!this.miscellaneousProject) return;
      this.toggleSelectedProject(this.miscellaneousProject);
    });

    //récupération de l'utilisateur connecté
    this.gitlabAuthService.getAuthenticatedUser().subscribe((user) => {
      this.authenticatedUser = user;
    });

    //uniquement assignées à l'utilisateur connecté
    this.assignedToMeControl.valueChanges
      .pipe(
        tap(() => (this.loadingIssuesList = true)),
        tap(() => {
          this.recentIssues = this.getLocalStorageIssues();
        }),
        switchMap(() => {
          return this.startSearchingForIssues();
        }),
      )
      .subscribe((issues) => {
        this.updateIssuesList(issues);
      });

    this.getMiscellaneousDevelopmentProject();
  }

  //récupération du projet 'Développement divers'
  getMiscellaneousDevelopmentProject() {
    this.gitlabService
      .getIssueFromProject(
        environment.GITLAB_ID_PROJET_SUIVI_GENERAL,
        environment.GITLAB_ID_PROJET_CORRECTIONS_DIVERSES,
      )
      .pipe(
        catchError(() => {
          this.alertsService.addError(
            "Impossible de récupérer le projet 'Développement divers'",
          );
          this.noProjectControl.disable();
          return of(undefined);
        }),
      )
      .subscribe((project) => {
        this.miscellaneousProject = project;
      });
  }

  //active / desactive le projet selectionné
  toggleSelectedProject(project: IGitlabIssue) {
    this.selectedProject =
      this.selectedProject?.iid === project.iid ? undefined : project;
    this.onChange(this.selectedProject);
    this.onTouched();
  }

  //recherche des issues avec la valeur dans l'input de recherche
  startSearchingForIssues() {
    return this.gitlabService.searchIssuesFromProject(
      environment.GITLAB_ID_PROJET_SUIVI_GENERAL,
      this.searchValueControl.value,
      this.openOnlyControl.value,
      6,
      this.assignedToMeControl.value ? this.authenticatedUser : undefined,
    );
  }

  //mise à jour de la liste des issues
  updateIssuesList(issues: IGitlabIssue[]) {
    this.issues = issues;
    if (
      !(
        this.issues.some((issue) => issue.iid === this.selectedProject?.iid) ||
        this.recentIssues.some(
          (issue) => issue.iid === this.selectedProject?.iid,
        )
      )
    ) {
      this.selectedProject = undefined;
    }
    this.loadingIssuesList = false;
  }

  getLocalStorageIssues() {
    return this.gitlabService
      .getIssuesFromLocalStorage(6)
      .filter(
        (issue) =>
          (this.openOnlyControl.value === false || issue.state === 'opened') &&
          (!this.assignedToMeControl.value ||
            issue.assignee?.id === this.authenticatedUser?.id),
      );
  }

  numberOfRecentIssueSelected() {
    return this.recentIssues.find(
      (issue) => issue.iid === this.selectedProject?.iid,
    )
      ? '(1 selectionné)'
      : '';
  }

  writeValue(project: IGitlabIssue | undefined): void {
    this.selectedProject = project;
  }

  registerOnChange(fn: (value: IGitlabIssue | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Manage component disabled state
  }
}
