import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  ReactiveFormsModule,
} from '@angular/forms';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { IGitlabProject } from 'src/app/interfaces/gitlab/igitlab-project';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { OldMilestoneActionChoiceComponent } from './old-milestone-action-choice/old-milestone-action-choice.component';
import { Subject, takeUntil } from 'rxjs';

//liste des milestones (actuelles et anciennes) pour selection lors de la création d'une nouvelle issue
@Component({
  selector: 'app-milestone-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgFor,
    NgIf,
    NgClass,
    OldMilestoneActionChoiceComponent,
  ],
  templateUrl: './milestone-list.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MilestoneListComponent),
      multi: true,
    },
  ],
})
export class MilestoneListComponent implements ControlValueAccessor {
  @Input() milestones: IGitlabMilestone[] = []; //liste des milestones à afficher
  @Input() interactiveMode: boolean = true; //affichage uniquement ou non

  lastClosedMilestones: IGitlabMilestone[] = [];
  private projetReintegration?: IGitlabProject = undefined;

  selectedMilestones: IGitlabMilestone[] = [];

  private _destroy$ = new Subject<void>();

  private onChange: (value: IGitlabMilestone[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private gitlabService: GitlabService) {}

  ngOnInit(): void {
    this.gitlabService
      .getProject(environment.GITLAB_ID_PROJET_REINTEGRATION)
      .pipe(takeUntil(this._destroy$))
      .subscribe((projet) => {
        this.projetReintegration = projet;
      });

    this.gitlabService
      .getLastClosedVersionsFromProject(
        environment.GITLAB_ID_PROJET_REINTEGRATION,
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe((milestones) => {
        this.lastClosedMilestones = milestones;
      });
  }

  toggleMilestone(milestone: IGitlabMilestone) {
    const milestoneIndex = this.selectedMilestones.findIndex(
      (m) => m.title === milestone.title,
    );
    if (milestoneIndex === -1) {
      this.selectedMilestones.push(milestone);
    } else {
      this.selectedMilestones.splice(milestoneIndex, 1);
    }
    this.onChange(this.selectedMilestones);
    this.onTouched();
  }

  getMilestoneURL(milestone: IGitlabMilestone) {
    if (!this.projetReintegration) return '';
    if (this.gitlabService.milestoneIsFake(milestone)) return '';
    return `${this.projetReintegration.web_url}/-/milestones/${milestone.iid}`;
  }

  isSelected(milestone: IGitlabMilestone): boolean {
    return (
      this.selectedMilestones.findIndex((m) => m.id === milestone.id) !== -1
    );
  }

  getMilestoneStateLabel(milestone: IGitlabMilestone): string {
    if (this.gitlabService.milestoneIsFake(milestone)) return 'Nouvelle';
    if (this.gitlabService.milestoneIsClosed(milestone)) return 'Fermée';
    if (this.gitlabService.milestoneIsOpen(milestone)) return 'Ouverte';
    return 'Inconnue';
  }

  getMilestoneStateColorClasses(milestone: IGitlabMilestone) {
    if (this.gitlabService.milestoneIsFake(milestone))
      return 'bg-blue-300 text-blue-800';
    if (this.gitlabService.milestoneIsClosed(milestone))
      return 'bg-red-300 text-red-800';
    if (this.gitlabService.milestoneIsOpen(milestone))
      return 'bg-green-300 text-green-800';
    return 'bg-gray-300 text-gray-800';
  }

  getSortedMilestones() {
    return this.milestones
      .sort((a, b) => a.title.localeCompare(b.title))
      .reverse();
  }

  getNumberOfOldSelectedMilestones() {
    return this.selectedMilestones.filter(
      (milestone) =>
        this.lastClosedMilestones.find(
          (oldMilestone) => milestone.iid === oldMilestone.iid,
        ) || this.gitlabService.milestoneIsFake(milestone),
    ).length;
  }

  numberOfOldSelectedMilestones() {
    const numOfMsSelected = this.getNumberOfOldSelectedMilestones();
    return numOfMsSelected === 0
      ? ''
      : `(${numOfMsSelected} sélectionnée${numOfMsSelected > 1 ? 's' : ''})`;
  }

  writeValue(value: IGitlabMilestone[]): void {
    this.selectedMilestones = value ?? [];
  }

  registerOnChange(fn: (value: IGitlabMilestone[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.interactiveMode = !isDisabled;
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
