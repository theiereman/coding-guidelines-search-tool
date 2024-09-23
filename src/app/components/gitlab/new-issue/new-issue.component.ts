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

@Component({
  selector: 'app-new-issue',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgFor,
    ProjectListComponent,
    MilestoneListComponent,
  ],
  templateUrl: './new-issue.component.html',
})
export class NewIssueComponent {
  milestones: IGitlabMilestone[] = [];
  labels: IGitlabLabel[] = [];

  developmentType = new FormControl('');
  isBugCorrection = new FormControl('');
  isQuoiDeNeuf = new FormControl('');
  title = new FormControl('');
  description = new FormControl('');
  milestone = new FormControl('');

  constructor(private gitlabService: GitlabService) {}

  ngOnInit(): void {
    // this.updateMilestoneList();
    this.updateLabelList();
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
}
