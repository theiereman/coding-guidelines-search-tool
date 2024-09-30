import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  catchError,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
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
  MODIF_ANALYSE_LABEL_NAME,
  QUOI_DE_NEUF_LABEL_NAME,
} from 'src/app/interfaces/gitlab/igitlab-label';
import { capitalizeFirstLetter } from 'src/app/helpers/strings-helper';
import { GitlabAuthService } from 'src/app/services/gitlab-auth.service';
import { ConnectionRequiredComponent } from '../../connection-required/connection-required.component';
import { HttpErrorResponse } from '@angular/common/http';

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
    ConnectionRequiredComponent,
  ],
  templateUrl: './new-issue.component.html',
})
export class NewIssueComponent {
  milestones: IGitlabMilestone[] = [];
  labels: IGitlabLabel[] = [];
  developmentTypeLabels: IGitlabLabel[] = [];
  lastDevelopmentTypeLabelUsed: IGitlabLabel | undefined = undefined;

  pendingCreationResult: boolean = false;

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
  selectedMilestones: IGitlabMilestone[] = [];
  futureIssue: IGitlabIssue = {
    labels: [] as string[],
    detailed_labels: [] as IGitlabLabel[],
  } as IGitlabIssue;

  constructor(
    public gitlabAuthService: GitlabAuthService,
    private gitlabService: GitlabService,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    if (!this.gitlabAuthService.isAuthenticated()) {
      return;
    }

    this.updateLabelList();
    this.updateMilestoneList();

    this.setCurrentUserAsAssignee();

    this.manageTitleValueUpdate();
    this.manageScopeValueUpdate();
    this.manageDescriptionValueUpdate();
    this.manageBugValueUpdate();
    this.manageQuoiDeNeufValueUpdate();
    this.manageDevelopmentTypeValueUpdate();
  }

  private manageDevelopmentTypeValueUpdate() {
    this.issueCreationForm.controls.developmentType.valueChanges.subscribe(
      (value) => {
        const correspondingLabel = this.labels.find(
          (label) => label.id === Number(value)
        );

        if (!correspondingLabel) return;

        this.issueCreationForm.controls.scope.setValue('');
        this.updateFutureIssueTitle();

        //met à jour les labels de 'type de développement' sur l'aperçu de l'issue
        this.futureIssue.detailed_labels =
          this.futureIssue.detailed_labels.filter(
            (label) => label.id !== this.lastDevelopmentTypeLabelUsed?.id
          );

        this.lastDevelopmentTypeLabelUsed = correspondingLabel;

        this.futureIssue.detailed_labels = [
          correspondingLabel,
          ...this.futureIssue.detailed_labels,
        ];

        this.futureIssue.labels = this.futureIssue.detailed_labels.map(
          (label) => label.name
        );
      }
    );
  }

  isCurrentDevelopmentTypeModificationAnalyse() {
    return (
      this.labels.find(
        (label) =>
          label.id ===
          Number(this.issueCreationForm.controls.developmentType.value)
      )?.name === MODIF_ANALYSE_LABEL_NAME
    );
  }

  private manageQuoiDeNeufValueUpdate() {
    this.issueCreationForm.controls.isQuoiDeNeuf.valueChanges.subscribe(
      (value) => {
        if (value === 'true') {
          const quoiDeNeufLabel = this.labels.find(
            (label) => label.name === QUOI_DE_NEUF_LABEL_NAME
          );

          if (
            quoiDeNeufLabel &&
            !this.futureIssue.detailed_labels.some(
              (label) => label.name === QUOI_DE_NEUF_LABEL_NAME
            )
          ) {
            this.futureIssue.detailed_labels.push(quoiDeNeufLabel);
          }
        } else {
          this.futureIssue.detailed_labels =
            this.futureIssue.detailed_labels.filter(
              (label) => label.name !== QUOI_DE_NEUF_LABEL_NAME
            );
        }
        this.futureIssue.labels = this.futureIssue.detailed_labels.map(
          (label) => label.name
        );
      }
    );
  }

  private manageBugValueUpdate() {
    this.issueCreationForm.controls.isBugCorrection.valueChanges.subscribe(
      (value) => {
        if (value === 'true') {
          const bugLabel = this.labels.find(
            (label) => label.name === BUG_LABEL_NAME
          );

          if (
            bugLabel &&
            !this.futureIssue.detailed_labels.some(
              (label) => label.name === BUG_LABEL_NAME
            )
          ) {
            this.futureIssue.detailed_labels.push(bugLabel);
          }
        } else {
          this.futureIssue.detailed_labels =
            this.futureIssue.detailed_labels.filter(
              (label) => label.name !== BUG_LABEL_NAME
            );
        }

        this.futureIssue.labels = this.futureIssue.detailed_labels.map(
          (label) => label.name
        );
      }
    );
  }

  private manageDescriptionValueUpdate() {
    this.issueCreationForm.controls.description.valueChanges.subscribe(
      (value) => {
        this.futureIssue.description = value ?? '';
      }
    );
  }

  //TODO: gérer le coller contenant "[ ] - blabla" qui met à jour automatiquement les autres variables
  private manageScopeValueUpdate() {
    this.issueCreationForm.controls.scope.valueChanges.subscribe((value) => {
      //uniquemnt des chiffres pour le numéro de l'analyse
      if (this.isCurrentDevelopmentTypeModificationAnalyse()) {
        const sanitizedValue =
          this.issueCreationForm.controls.scope.value?.replace(/[^0-9]/g, '') ??
          '';
        // Vérifiez si la valeur est différente pour éviter de mettre à jour inutilement
        if (sanitizedValue !== value) {
          this.issueCreationForm.controls.scope.setValue(sanitizedValue, {
            emitEvent: false,
          });
        }
      }
      this.updateFutureIssueTitle();
    });
  }

  private manageTitleValueUpdate() {
    this.issueCreationForm.controls.title.valueChanges.subscribe(() => {
      this.updateFutureIssueTitle();
    });
  }

  private updateFutureIssueTitle() {
    if (this.isCurrentDevelopmentTypeModificationAnalyse()) {
      this.futureIssue.title = `[Modification d'analyse] (${
        this.issueCreationForm.controls.scope.value ?? ''
      }) - ${this.issueCreationForm.controls.title.value ?? ''}`;
    } else {
      this.futureIssue.title = `[${
        this.issueCreationForm.controls.scope.value ?? ''
      }] - ${this.issueCreationForm.controls.title.value ?? ''}`;
    }
  }

  private updateLabelList() {
    this.gitlabService
      .getLabelsFromProject(environment.gitlab_id_projet_reintegration)
      .pipe(
        tap((labels) => {
          this.developmentTypeLabels = labels
            .filter(
              (label: IGitlabLabel) =>
                label.name !== BUG_LABEL_NAME &&
                label.name !== QUOI_DE_NEUF_LABEL_NAME
            )
            .map((label) => {
              return {
                id: label.id,
                name: capitalizeFirstLetter(label.name),
                color: label.color,
                text_color: label.text_color,
              };
            });
        })
      )
      .subscribe((labels) => {
        this.labels = labels;
      });
  }

  private updateMilestoneList() {
    this.gitlabService
      .getOpenMilestonesFromProject(environment.gitlab_id_projet_reintegration)
      .subscribe((milestones: IGitlabMilestone[]) => {
        this.milestones = milestones;
      });
  }

  private setCurrentUserAsAssignee() {
    this.gitlabAuthService.getAuthenticatedUser().subscribe((user) => {
      this.futureIssue.assignee = user;
      this.futureIssue.assignee_id = user?.id ?? 0;
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

  //TODO: faire un affichage pour résumé de la réintégration + lien vers la réintégration
  createNewIssue() {
    //? déplacer ce fonctionnement dans le service gitlab

    this.pendingCreationResult = true;

    const issueObservables = this.selectedMilestones.map((milestone) => {
      let milestoneOperation$: Observable<IGitlabMilestone> = of(milestone);

      // Vérifie si la milestone est fake (à créer) ou fermée (à ouvrir)
      if (this.gitlabService.milestoneIsFake(milestone)) {
        milestoneOperation$ = this.gitlabService.createMilestone(
          milestone.title
        );
      } else if (this.gitlabService.milestoneIsClosed(milestone)) {
        milestoneOperation$ = this.gitlabService.openMilestone(milestone);
      }

      // Crée l'issue une fois l'opération sur la milestone effectuée (si nécessaire)
      return milestoneOperation$.pipe(
        switchMap((milestoneResult) => {
          const newIssue: IGitlabIssue = {
            ...this.futureIssue,
            milestone_id: milestoneResult.id ?? -1,
          };

          return this.gitlabService.createNewIssue(newIssue).pipe(
            mergeMap((createdIssue) => {
              this.futureIssue.web_url = createdIssue.web_url;
              const commentOperation$ = this.gitlabService
                .addCommentOfReintegrationInLinkedProjectIssue(
                  createdIssue,
                  this.selectedProject!
                )
                .pipe(
                  map(() => true),
                  catchError((err) => {
                    console.log(err);
                    return of(false);
                  })
                );

              const closeMilestoneOperation$ =
                this.gitlabService.milestoneIsFake(milestone) ||
                this.gitlabService.milestoneIsClosed(milestone)
                  ? this.gitlabService.closeMilestone(milestoneResult).pipe(
                      map(() => true),
                      catchError((err) => {
                        console.log(err);
                        return of(false);
                      })
                    )
                  : of(true);

              return forkJoin([
                commentOperation$,
                closeMilestoneOperation$,
              ]).pipe(
                map(
                  ([commentOperationResult, closeMilestoneOperationResult]) =>
                    commentOperationResult && closeMilestoneOperationResult
                )
              );
            })
          );
        }),
        catchError((err) => {
          console.log(`Erreur lors de la création d'une issue : ${err}`);
          return of(false);
        })
      );
    });

    forkJoin(issueObservables).subscribe((results) => {
      this.pendingCreationResult = false;
      if (results.every((success) => success)) {
        this.alertsService.addSuccess(
          'Nouvelle(s) issue(s) créée(s) et mention(s) ajoutée(s)'
        );
      } else {
        this.alertsService.addError(
          'Une erreur est survenue lors de la création de la(des) issue(s). Détails des erreurs dans la console.'
        );
      }
    });
  }

  resetForm() {
    this.issueCreationForm.reset();
    this.futureIssue = {} as IGitlabIssue;
    this.selectedProject = undefined;
    this.selectedMilestones = [];
  }

  formControlInvalid(controlName: string): boolean {
    return (
      (this.issueCreationForm.get(controlName)?.invalid &&
        (this.issueCreationForm.get(controlName)?.dirty ||
          this.issueCreationForm.get(controlName)?.touched)) ??
      true
    );
  }
}
