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
} from 'rxjs';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { ProjectListComponent } from '../project-list/project-list.component';
import { MilestoneListComponent } from '../milestone-list/milestone-list.component';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { NewIssueActionsSummaryComponent } from './actions-summary/actions-summary.component';
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
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { SelectOption } from 'src/app/interfaces/select-option';
import { NewIssueInputSlotComponent } from './input-slot/input-slot.component';
import { CreationSummaryModalComponent } from './creation-summary-modal/creation-summary-modal.component';
import { IssueCreationActionsService } from 'src/app/services/issue-creation-actions.service';
import { IIssueCreationAction } from 'src/app/interfaces/iissue-creation-action';

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
    NewIssueActionsSummaryComponent,
    ConnectionRequiredComponent,
    CustomInputComponent,
    NewIssueInputSlotComponent,
    CreationSummaryModalComponent,
  ],
  templateUrl: './new-issue.component.html',
})
export class NewIssueComponent {
  milestones: IGitlabMilestone[] = [];
  labels: IGitlabLabel[] = [];
  developmentTypeOptions: SelectOption[] = [];
  lastDevelopmentTypeLabelUsed: IGitlabLabel | undefined = undefined;

  isSummaryModalActive: boolean = false;

  //tous les champs du formulaire
  issueCreationForm = new FormGroup({
    developmentType: new FormControl('', Validators.required),
    isBugCorrection: new FormControl('', Validators.required),
    isQuoiDeNeuf: new FormControl('', Validators.required),
    scope: new FormControl('', Validators.required),
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    selectedMilestones: new FormControl<IGitlabMilestone[]>(
      [],
      [validateMilestonesSelection],
    ),
    selectedProject: new FormControl<IGitlabIssue | null>(null, [
      validateProjectSelection,
    ]),
  });

  //projet dans le suivi général selectionné
  selectedProject?: IGitlabIssue = undefined;

  //liste des milestones selectionnés
  selectedMilestones: IGitlabMilestone[] = [];

  //données de l'issue à créer
  futureIssue: IGitlabIssue = {
    labels: [] as string[],
    detailed_labels: [] as IGitlabLabel[],
  } as IGitlabIssue;

  constructor(
    public gitlabAuthService: GitlabAuthService,
    private gitlabService: GitlabService,
    private alertsService: AlertsService,
    public actionsService: IssueCreationActionsService,
  ) {}

  ngOnInit(): void {
    if (!this.gitlabAuthService.isAuthenticated()) {
      return;
    }

    this.updateLabelList();
    this.updateMilestoneList();

    this.setCurrentUserAsAssignee();

    this.manageMilestoneValueUpdate();
    this.manageProjectValueUpdate();
    this.manageTitleValueUpdate();
    this.manageScopeValueUpdate();
    this.manageDescriptionValueUpdate();
    this.manageBugValueUpdate();
    this.manageQuoiDeNeufValueUpdate();
    this.manageDevelopmentTypeValueUpdate();
  }

  createNewIssue() {
    //? Il faudrait probablement déplacer cette maxi fonction dans le service gitlab

    this.isSummaryModalActive = true; //affichage de la progression de la création en popup

    const issueObservables = this.selectedMilestones.map((milestone) => {
      let milestoneOperation$: Observable<IGitlabMilestone> = of(milestone);

      // Vérifie si la milestone est fake (à créer) ou fermée (à ouvrir)
      let milestoneOperationAction: IIssueCreationAction;
      if (this.gitlabService.milestoneIsFake(milestone)) {
        milestoneOperationAction = this.actionsService.addAction(
          `Milestone '${milestone.title}' inexistante -> Création de la milestone`,
        );
        milestoneOperation$ = this.gitlabService
          .createMilestone(milestone.title)
          .pipe(
            tap(() =>
              this.actionsService.setActionsResult(
                milestoneOperationAction,
                true,
              ),
            ),
            catchError((err) => {
              this.actionsService.setActionsResult(
                milestoneOperationAction,
                false,
              );
              return throwError(() => new Error(err));
            }),
          );
      } else if (this.gitlabService.milestoneIsClosed(milestone)) {
        milestoneOperationAction = this.actionsService.addAction(
          `Milestone  '${milestone.title}' fermée ->Ouverture de la milestone`,
        );
        milestoneOperation$ = this.gitlabService.openMilestone(milestone).pipe(
          tap(() =>
            this.actionsService.setActionsResult(
              milestoneOperationAction,
              true,
            ),
          ),
          catchError((err) => {
            this.actionsService.setActionsResult(
              milestoneOperationAction,
              false,
            );
            return throwError(() => new Error(err));
          }),
        );
      }

      // Crée l'issue une fois l'opération sur la milestone effectuée (si nécessaire)
      return milestoneOperation$.pipe(
        switchMap((milestoneResult) => {
          const newIssue: IGitlabIssue = {
            ...this.futureIssue,
            milestone_id: milestoneResult.id ?? -1,
          };

          const newIssueOperationAction = this.actionsService.addAction(
            `Milestone '${milestoneResult.title}' -> Création de l'issue de réintégration sur la milestone`,
          );
          return this.gitlabService.createNewIssue(newIssue).pipe(
            mergeMap((createdIssue) => {
              this.futureIssue.web_url = createdIssue.web_url;
              const commentOperationAction = this.actionsService.addAction(
                `Milestone '${milestoneResult.title}' -> Ajout d'un commentaire sur le projet '${this.selectedProject?.title} (#${this.selectedProject?.iid})'`,
              );
              const commentOperation$ = this.gitlabService
                .addCommentOfReintegrationInLinkedProjectIssue(
                  createdIssue,
                  this.selectedProject!,
                )
                .pipe(
                  map(() => {
                    this.actionsService.setActionsResult(
                      commentOperationAction,
                      true,
                    );
                    return true;
                  }),
                  catchError((err) => {
                    this.actionsService.setActionsResult(
                      commentOperationAction,
                      false,
                    );
                    console.log(err);
                    return of(false);
                  }),
                );

              let closeMilestoneOperation$ = of(true);
              if (
                this.gitlabService.milestoneIsFake(milestone) ||
                this.gitlabService.milestoneIsClosed(milestone)
              ) {
                let closeMilestoneOperationAction =
                  this.actionsService.addAction(
                    `Milestone '${milestoneResult.title}' -> Fermeture de la milestone '${milestone.title}'`,
                  );
                closeMilestoneOperation$ = this.gitlabService
                  .closeMilestone(milestoneResult)
                  .pipe(
                    map(() => {
                      this.actionsService.setActionsResult(
                        closeMilestoneOperationAction,
                        true,
                      );
                      return true;
                    }),
                    catchError((err) => {
                      this.actionsService.setActionsResult(
                        closeMilestoneOperationAction,
                        false,
                      );
                      console.log(err);
                      return of(false);
                    }),
                  );
              }

              return forkJoin([
                commentOperation$,
                closeMilestoneOperation$,
              ]).pipe(
                map(
                  ([commentOperationResult, closeMilestoneOperationResult]) =>
                    commentOperationResult && closeMilestoneOperationResult,
                ),
              );
            }),
            tap(() => {
              this.actionsService.setActionsResult(
                newIssueOperationAction,
                true,
              );
            }),
            catchError((err) => {
              this.actionsService.setActionsResult(
                newIssueOperationAction,
                false,
              );
              console.log(`Erreur lors de la création d'une issue : ${err}`);
              return of(false);
            }),
          );
        }),
        catchError((err) => {
          console.log(`Erreur lors de la création d'une issue : ${err}`);
          return of(false);
        }),
      );
    });

    forkJoin(issueObservables).subscribe((results) => {
      if (results.every((success) => success)) {
        this.alertsService.addSuccess(
          'Nouvelle(s) issue(s) créée(s) et mention(s) ajoutée(s)',
        );
      } else {
        this.alertsService.addError(
          'Une erreur est survenue lors de la création de la(des) issue(s). Détails des erreurs dans la console.',
        );
      }
    });
  }

  reloadPage() {
    window.location.reload();
  }

  formControlInvalid(controlName: string): boolean {
    return (
      (this.issueCreationForm.get(controlName)?.invalid &&
        (this.issueCreationForm.get(controlName)?.dirty ||
          this.issueCreationForm.get(controlName)?.touched)) ??
      true
    );
  }

  isCurrentDevelopmentTypeModificationAnalyse() {
    return (
      this.labels.find(
        (label) =>
          label.id ===
          Number(this.issueCreationForm.controls.developmentType.value),
      )?.name === MODIF_ANALYSE_LABEL_NAME
    );
  }

  showSummaryModal() {
    this.isSummaryModalActive = !this.isSummaryModalActive;
  }

  showModalEventHandler(value: boolean) {
    this.isSummaryModalActive = value;
    if (value === false) {
      this.actionsService.reset();
      this.reloadPage();
    }
  }

  private manageProjectValueUpdate() {
    this.issueCreationForm.controls.selectedProject.valueChanges.subscribe(
      (value) => {
        this.selectedProject = value ?? undefined;
      },
    );
  }

  private manageMilestoneValueUpdate() {
    this.issueCreationForm.controls.selectedMilestones.valueChanges.subscribe(
      (value) => {
        this.selectedMilestones = value ?? [];
      },
    );
  }

  private manageDevelopmentTypeValueUpdate() {
    this.issueCreationForm.controls.developmentType.valueChanges.subscribe(
      (value) => {
        //mise à jour du champ pour parser la valeur dans le périmètre (uniquement chiffres quand modif d'analyse)
        this.triggerScopeValueUpdateEvent();
        this.updateFutureIssueTitle();

        //suppression des labels bug et quoi de neuf qui ne servent à rien si c'est une modif d'analyse
        if (this.isCurrentDevelopmentTypeModificationAnalyse()) {
          this.resetBugAndQuoiDeNeufFields();
        }

        //met à jour les labels de 'type de développement' sur l'issue qui sera créée afin qu'il n'y en ait qu'un seul
        this.updateFutureIssueDevelopmentTypeLabel(value);
      },
    );
  }

  private resetBugAndQuoiDeNeufFields() {
    this.issueCreationForm.controls.isBugCorrection.setValue('false');
    this.issueCreationForm.controls.isQuoiDeNeuf.setValue('false');
  }

  private manageQuoiDeNeufValueUpdate() {
    this.issueCreationForm.controls.isQuoiDeNeuf.valueChanges.subscribe(
      (value) => {
        if (value === 'true') {
          const quoiDeNeufLabel = this.labels.find(
            (label) => label.name === QUOI_DE_NEUF_LABEL_NAME,
          );

          if (
            quoiDeNeufLabel &&
            !this.futureIssue.detailed_labels.some(
              (label) => label.name === QUOI_DE_NEUF_LABEL_NAME,
            )
          ) {
            this.futureIssue.detailed_labels.push(quoiDeNeufLabel);
          }
        } else {
          this.futureIssue.detailed_labels =
            this.futureIssue.detailed_labels.filter(
              (label) => label.name !== QUOI_DE_NEUF_LABEL_NAME,
            );
        }
        this.futureIssue.labels = this.futureIssue.detailed_labels.map(
          (label) => label.name,
        );
      },
    );
  }

  private manageBugValueUpdate() {
    this.issueCreationForm.controls.isBugCorrection.valueChanges.subscribe(
      (value) => {
        if (value === 'true') {
          const bugLabel = this.labels.find(
            (label) => label.name === BUG_LABEL_NAME,
          );

          if (
            bugLabel &&
            !this.futureIssue.detailed_labels.some(
              (label) => label.name === BUG_LABEL_NAME,
            )
          ) {
            this.futureIssue.detailed_labels.push(bugLabel);
          }
        } else {
          this.futureIssue.detailed_labels =
            this.futureIssue.detailed_labels.filter(
              (label) => label.name !== BUG_LABEL_NAME,
            );
        }

        this.futureIssue.labels = this.futureIssue.detailed_labels.map(
          (label) => label.name,
        );
      },
    );
  }

  private manageDescriptionValueUpdate() {
    this.issueCreationForm.controls.description.valueChanges.subscribe(
      (value) => {
        this.futureIssue.description = value ?? '';
      },
    );
  }

  private manageScopeValueUpdate() {
    this.issueCreationForm.controls.scope.valueChanges.subscribe((value) => {
      value = value ?? '';
      //uniquemnt des chiffres pour le numéro de l'analyse
      if (this.isCurrentDevelopmentTypeModificationAnalyse()) {
        const sanitizedValue = value.replace(/[^0-9]/g, '') ?? '';
        // Vérifiez si la valeur est différente pour éviter boucle infinie
        if (sanitizedValue !== value) {
          this.issueCreationForm.controls.scope.setValue(sanitizedValue, {
            emitEvent: false,
          });
        }
      } else {
        //si la chaine commence par "[...] -"
        if (/^\[.*].*-/g.test(value ?? '')) {
          //scope = partie entre les [ ]
          this.issueCreationForm.controls.scope.setValue(
            value.substring(value.indexOf('[') + 1, value.indexOf(']')),
          );
          //titre = partie après le -
          this.issueCreationForm.controls.title.setValue(
            value.split('-')[1].trim(),
          );
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

  private triggerScopeValueUpdateEvent() {
    this.issueCreationForm.controls.scope.setValue(
      this.issueCreationForm.controls.scope.value,
    );
  }

  private updateFutureIssueTitle() {
    if (
      this.issueCreationForm.controls.scope.value === '' &&
      this.issueCreationForm.controls.title.value === ''
    ) {
      this.futureIssue.title = '';
    } else {
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
  }

  private updateFutureIssueDevelopmentTypeLabel(selectedValue: string | null) {
    const developmentTypeCorrespondingLabel = this.labels.find(
      (label) => label.id === Number(selectedValue),
    );
    if (!developmentTypeCorrespondingLabel) return;

    //on conserve tous les labels qui ne sont pas liés au type de développement
    this.futureIssue.detailed_labels = this.futureIssue.detailed_labels.filter(
      (label) => label.id !== this.lastDevelopmentTypeLabelUsed?.id,
    );

    //conservation de l'historique du dernier label utilisé pour ne pas l'ajouter en double
    this.lastDevelopmentTypeLabelUsed = developmentTypeCorrespondingLabel;

    //ajout du type de développement en premier
    this.futureIssue.detailed_labels = [
      developmentTypeCorrespondingLabel,
      ...this.futureIssue.detailed_labels,
    ];

    //transformation des labels en string pour l'api gitlab
    this.futureIssue.labels = this.futureIssue.detailed_labels.map(
      (label) => label.name,
    );
  }

  private updateLabelList() {
    this.gitlabService
      .getLabelsFromProject(environment.GITLAB_ID_PROJET_REINTEGRATION)
      .pipe(
        tap((labels) => {
          this.developmentTypeOptions = labels
            .filter(
              (label: IGitlabLabel) =>
                label.name !== BUG_LABEL_NAME &&
                label.name !== QUOI_DE_NEUF_LABEL_NAME,
            )
            .map((label) => {
              return {
                value: label.id,
                name: capitalizeFirstLetter(label.name),
              };
            });
        }),
      )
      .subscribe((labels) => {
        this.labels = labels;
      });
  }

  private updateMilestoneList() {
    this.gitlabService
      .getOpenMilestonesFromProject(environment.GITLAB_ID_PROJET_REINTEGRATION)
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
}
