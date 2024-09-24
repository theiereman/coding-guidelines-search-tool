import { NgClass, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { IGitlabLabel } from 'src/app/interfaces/gitlab/igitlab-label';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { ProjectListComponent } from '../project-list/project-list.component';
import { MilestoneListComponent } from '../milestone-list/milestone-list.component';
import { CommentPreviewComponent } from '../comment-preview/comment-preview.component';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { NewIssueActionsSummaryComponent } from '../new-issue-actions-summary/new-issue-actions-summary.component';
import { AlertsService } from 'src/app/services/alerts.service';

@Component({
  selector: 'app-new-issue',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgFor,
    ProjectListComponent,
    MilestoneListComponent,
    CommentPreviewComponent,
    NewIssueActionsSummaryComponent,
  ],
  templateUrl: './new-issue.component.html',
})
export class NewIssueComponent {
  milestones: IGitlabMilestone[] = [];
  labels: IGitlabLabel[] = [];

  developmentType = new FormControl('');
  isBugCorrection = new FormControl('');
  isQuoiDeNeuf = new FormControl('');
  scope = new FormControl('');
  title = new FormControl('');
  description = new FormControl('');
  milestone = new FormControl('');

  selectedProject?: IGitlabIssue = undefined;
  futureIssue: IGitlabIssue = {} as IGitlabIssue;
  selectedMilestones: IGitlabMilestone[] = [];

  constructor(
    private gitlabService: GitlabService,
    private alertsService: AlertsService
  ) {
    this.title.valueChanges.subscribe((value) => {
      this.updateIssueTitle(this.scope.value ?? '', value ?? '');
    });

    this.scope.valueChanges.subscribe((value) => {
      this.updateIssueTitle(value ?? '', this.title.value ?? '');
    });

    this.description.valueChanges.subscribe((value) => {
      this.futureIssue.description = value ?? '';
    });
  }

  ngOnInit(): void {
    this.updateLabelList();
    this.gitlabService
      .getLastMilestonesFromProject(environment.gitlab_id_projet_reintegration)
      .subscribe((milestones: IGitlabMilestone[]) => {
        this.milestones = milestones;
      });
  }

  private updateIssueTitle(scope: string, title: string) {
    this.futureIssue.title = `[${scope}] - ${title}`;
  }

  private updateLabelList() {
    this.gitlabService
      .getLabelsFromProject(environment.gitlab_id_projet_reintegration)
      .pipe(
        map((labels) => {
          return labels.filter(
            (label: IGitlabLabel) =>
              label.name !== 'bug' && label.name !== 'quoi de neuf ?'
          );
        })
      )
      .subscribe((labels) => {
        this.labels = labels;
      });
  }

  setSelectedProject(project: IGitlabIssue) {
    this.selectedProject = project;
  }

  setSelectedMilestones(milestones: IGitlabMilestone[]) {
    this.selectedMilestones = milestones;
  }

  createNewIssue() {
    this.gitlabService.createNewIssue(this.futureIssue).subscribe((success) => {
      if (success) {
        this.alertsService.addSuccess('Nouvelle issue créée');
        this.futureIssue = {} as IGitlabIssue;
        this.selectedProject = undefined;
        this.selectedMilestones = [];
      }
    });
  }
}
