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
import { map, tap } from 'rxjs';
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
import {
  BUG_LABEL_NAME,
  IGitlabLabel,
  QUOI_DE_NEUF_LABEL_NAME,
} from 'src/app/interfaces/gitlab/igitlab-label';

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
  developmentTypeLabels: IGitlabLabel[] = [];
  lastDevelopmentTypeLabelUsed: IGitlabLabel | undefined = undefined;

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
  futureIssue: IGitlabIssue = {
    labels: [] as IGitlabLabel[],
  } as IGitlabIssue;
  selectedMilestones: IGitlabMilestone[] = [];

  constructor(
    private gitlabService: GitlabService,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.updateLabelList();
    this.gitlabService
      .getLastMilestonesFromProject(environment.gitlab_id_projet_reintegration)
      .subscribe((milestones: IGitlabMilestone[]) => {
        this.milestones = milestones;
      });

    //mise à jour du titre
    this.issueCreationForm.controls.title.valueChanges.subscribe((value) => {
      this.updateIssueTitle(
        this.issueCreationForm.controls.scope.value ?? '',
        value ?? ''
      );
    });

    //mise à jour du périmètre
    this.issueCreationForm.controls.scope.valueChanges.subscribe((value) => {
      this.updateIssueTitle(
        value ?? '',
        this.issueCreationForm.controls.title.value ?? ''
      );
    });

    //mise à jour de la description
    this.issueCreationForm.controls.description.valueChanges.subscribe(
      (value) => {
        this.futureIssue.description = value ?? '';
      }
    );

    //ajout du label 'bug' par défaut en fonction de la combo isBugCorrection
    this.issueCreationForm.controls.isBugCorrection.valueChanges.subscribe(
      (value) => {
        if (value === 'true') {
          const bugLabel = this.labels.find(
            (label) => label.name === BUG_LABEL_NAME
          );

          if (
            bugLabel &&
            !this.futureIssue.labels.some(
              (label) => label.name === BUG_LABEL_NAME
            )
          ) {
            this.futureIssue.labels.push(bugLabel);
          }
        } else {
          this.futureIssue.labels = this.futureIssue.labels.filter(
            (label) => label.name !== BUG_LABEL_NAME
          );
        }
      }
    );

    // ajout du label 'quoi de neuf ?' par défaut en fonction de la combo isQuoiDeNeuf
    this.issueCreationForm.controls.isQuoiDeNeuf.valueChanges.subscribe(
      (value) => {
        console.log(this.futureIssue);

        if (value === 'true') {
          const quoiDeNeufLabel = this.labels.find(
            (label) => label.name === QUOI_DE_NEUF_LABEL_NAME
          );

          if (
            quoiDeNeufLabel &&
            !this.futureIssue.labels.some(
              (label) => label.name === QUOI_DE_NEUF_LABEL_NAME
            )
          ) {
            this.futureIssue.labels.push(quoiDeNeufLabel);
          }
        } else {
          this.futureIssue.labels = this.futureIssue.labels.filter(
            (label) => label.name !== QUOI_DE_NEUF_LABEL_NAME
          );
        }
      }
    );

    //ajout du label spécifique au choix de la combo developmentType
    this.issueCreationForm.controls.developmentType.valueChanges.subscribe(
      (value) => {
        console.log(value);

        const correspondingLabel = this.labels.find(
          (label) => label.id === Number(value)
        );

        if (!correspondingLabel) return;

        this.futureIssue.labels = this.futureIssue.labels.filter(
          (label) => label.id !== this.lastDevelopmentTypeLabelUsed?.id
        );

        this.lastDevelopmentTypeLabelUsed = correspondingLabel;

        this.futureIssue.labels = [
          correspondingLabel,
          ...this.futureIssue.labels,
        ];
      }
    );
  }

  private updateIssueTitle(scope: string, title: string) {
    this.futureIssue.title = `[${scope}] - ${title}`;
  }

  private updateLabelList() {
    this.gitlabService
      .getLabelsFromProject(environment.gitlab_id_projet_reintegration)
      .pipe(
        tap((labels) => {
          this.developmentTypeLabels = labels.filter(
            (label: IGitlabLabel) =>
              label.name !== BUG_LABEL_NAME &&
              label.name !== QUOI_DE_NEUF_LABEL_NAME
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
