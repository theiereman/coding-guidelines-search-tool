import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, forwardRef, Output } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { ProjectIssueCardComponent } from '../project-issue-card/project-issue-card.component';
import * as _ from 'lodash';

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
  issues: IGitlabIssue[] = [];
  recentIssues: IGitlabIssue[] = [];
  loadingIssuesList: boolean = false;

  @Output() selectedProjectEvent = new EventEmitter<IGitlabIssue>();
  selectedProject?: IGitlabIssue = undefined;

  private onChange: (value: IGitlabIssue | undefined) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private gitlabService: GitlabService) {}

  toggleSelectedProject(project: IGitlabIssue) {
    if (_.isEqual(this.selectedProject, project)) {
      this.selectedProject = undefined;
    } else {
      this.selectedProject = project;
    }
    this.selectedProjectEvent?.emit(this.selectedProject);
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

    // interrupteur ouvert uniquement
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
