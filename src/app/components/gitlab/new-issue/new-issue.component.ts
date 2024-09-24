import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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
import { validateMilestonesSelection } from '../validators/milestones-selection-validator';
import { validateProjectSelection } from '../validators/selected-project-validator';

@Component({
  selector: 'app-new-issue',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgFor,
    NgIf,
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

  issueCreationForm = new FormGroup({
    developmentType: new FormControl('', Validators.required),
    isBugCorrection: new FormControl('', Validators.required),
    isQuoiDeNeuf: new FormControl('', Validators.required),
    scope: new FormControl('', Validators.required),
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    selectedMilestones: new FormControl<IGitlabMilestone[]>(
      [],
      [validateMilestonesSelection]
    ),
    selectedProject: new FormControl<IGitlabIssue | null>(null, [
      validateProjectSelection,
    ]),
  });

  selectedProject?: IGitlabIssue = undefined;
  futureIssue: IGitlabIssue = {} as IGitlabIssue;
  selectedMilestones: IGitlabMilestone[] = [];

  constructor(
    private gitlabService: GitlabService,
    private alertsService: AlertsService
  ) {
    this.issueCreationForm.controls.title.valueChanges.subscribe((value) => {
      this.updateIssueTitle(
        this.issueCreationForm.controls.scope.value ?? '',
        value ?? ''
      );
    });

    this.issueCreationForm.controls.scope.valueChanges.subscribe((value) => {
      this.updateIssueTitle(
        value ?? '',
        this.issueCreationForm.controls.title.value ?? ''
      );
    });

    this.issueCreationForm.controls.description.valueChanges.subscribe(
      (value) => {
        this.futureIssue.description = value ?? '';
      }
    );
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
    this.issueCreationForm.controls.selectedProject.setValue(project);
  }

  setSelectedMilestones(milestones: IGitlabMilestone[]) {
    this.selectedMilestones = milestones;
    this.issueCreationForm.controls.selectedMilestones.setValue(milestones);
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
