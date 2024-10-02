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
import { ProjectIssueCardComponent } from '../project-issue-card/project-issue-card.component';
import { AlertsService } from 'src/app/services/alerts.service';

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
export class ProjectListComponent implements ControlValueAccessor {
  searchValueControl: FormControl = new FormControl('');
  openOnlyControl: FormControl = new FormControl(true);
  noProjectControl: FormControl = new FormControl(false);

  issues: IGitlabIssue[] = [];
  recentIssues: IGitlabIssue[] = [];
  loadingIssuesList: boolean = false;

  miscellaneousProject?: IGitlabIssue = undefined;
  selectedProject?: IGitlabIssue = undefined;

  private onChange: (value: IGitlabIssue | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private gitlabService: GitlabService,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.recentIssues = this.getLocalStorageIssues();
    this.searchValueControl.valueChanges
      .pipe(
        tap(() => (this.loadingIssuesList = true)),
        debounceTime(300),
        switchMap(() => {
          return this.startSearchingForIssues();
        })
      )
      .subscribe((issues) => {
        this.updateIssuesList(issues);
      });

    //uniquement les issues ouvertes
    this.openOnlyControl.valueChanges
      .pipe(
        tap(() => {
          this.recentIssues = this.getLocalStorageIssues();
        }),
        switchMap(() => {
          return this.startSearchingForIssues();
        })
      )
      .subscribe((issues) => {
        this.updateIssuesList(issues);
      });

    this.noProjectControl.valueChanges.subscribe((value) => {
      if (!this.miscellaneousProject) return;
      this.setSelectedProject(value ? this.miscellaneousProject : undefined);
    });

    this.getMiscellaneousDevelopmentProject();
  }

  getMiscellaneousDevelopmentProject() {
    this.gitlabService
      .getIssueFromProject(
        environment.gitlab_id_projet_suivi_general,
        environment.gitlab_id_projet_corrections_diverses
      )
      .pipe(
        catchError(() => {
          this.alertsService.addError(
            "Impossible de récupérer le projet 'Développement divers'"
          );
          this.noProjectControl.disable();
          return of(undefined);
        })
      )
      .subscribe((project) => {
        this.miscellaneousProject = project;
      });
  }

  setSelectedProject(project: IGitlabIssue | undefined) {
    this.selectedProject = project;
    this.onChange(this.selectedProject);
    this.onTouched();
  }

  toggleSelectedProject(project: IGitlabIssue) {
    this.noProjectControl.setValue(false);
    if (this.selectedProject?.iid === project.iid) {
      this.selectedProject = undefined;
    } else {
      this.selectedProject = project;
    }
    this.onChange(this.selectedProject);
    this.onTouched();
  }

  startSearchingForIssues() {
    return this.gitlabService.searchIssuesFromProject(
      environment.gitlab_id_projet_suivi_general,
      this.searchValueControl.value,
      this.openOnlyControl.value,
      6
    );
  }

  updateIssuesList(issues: IGitlabIssue[]) {
    this.issues = issues;
    if (
      !(
        this.issues.some((issue) => issue.iid === this.selectedProject?.iid) ||
        this.recentIssues.some(
          (issue) => issue.iid === this.selectedProject?.iid
        )
      )
    ) {
      this.selectedProject = undefined;
    }
    this.loadingIssuesList = false;
  }

  getLocalStorageIssues() {
    return this.gitlabService
      .getIssuesFromLocalStorage(3)
      .filter(
        (issue) =>
          this.openOnlyControl.value === false || issue.state === 'opened'
      );
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
