import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, NgClass],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent {
  searchValueControl: FormControl = new FormControl('');
  openOnlyControl: FormControl = new FormControl(true);
  issues: IGitlabIssue[] = [];
  recentIssues: IGitlabIssue[] = [];
  loadingIssuesList: boolean = false;
  selectedProject?: IGitlabIssue = undefined;

  constructor(private gitlabService: GitlabService) {
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

    //interrupteur ouvert uniquement
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

  setSelectedProject(project: IGitlabIssue) {
    console.log(project);

    this.gitlabService.addIssueToLocalStorage(project);
    this.selectedProject = project;
  }

  getProjectDetailsUrl(projectId: number) {
    return `${environment.gitlab_app_base_uri}/adhoc/suivi-de-projets/-/issues/${projectId}`;
  }

  startSearchingForIssues() {
    this.loadingIssuesList = true;
    return this.gitlabService.searchIssuesFromProject(
      environment.gitlab_id_projet_suivi_general,
      this.searchValueControl.value,
      this.openOnlyControl.value,
      6
    );
  }

  updateIssuesList(issues: IGitlabIssue[]) {
    this.issues = issues;
    if (!this.issues.some((issue) => issue.iid === this.selectedProject?.iid)) {
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
  }
}
