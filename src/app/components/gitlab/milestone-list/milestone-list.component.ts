import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  ReactiveFormsModule,
} from '@angular/forms';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { IGitlabProject } from 'src/app/interfaces/gitlab/igitlab-project';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { OldMilestoneActionChoiceComponent } from '../old-milestone-action-choice/old-milestone-action-choice.component';
import { Observable, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
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
  @Input() milestones: IGitlabMilestone[] = [];
  @Input() interactiveMode: boolean = true;

  @Output() selectedMilestonesEvent = new EventEmitter<IGitlabMilestone[]>();

  lastClosedMilestones: IGitlabMilestone[] = [];
  private projetReintegration?: IGitlabProject = undefined;

  selectedMilestones: IGitlabMilestone[] = [];

  private _destroy$ = new Subject<void>();

  private onChange: (value: IGitlabMilestone[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private gitlabService: GitlabService) {}

  ngOnInit(): void {
    this.gitlabService
      .getProject(environment.gitlab_id_projet_reintegration)
      .pipe(takeUntil(this._destroy$))
      .subscribe((projet) => {
        this.projetReintegration = projet;
      });

    this.gitlabService
      .getLastClosedVersionsFromProject(
        environment.gitlab_id_projet_reintegration
      )
      .pipe(takeUntil(this._destroy$))
      .subscribe((milestones) => {
        this.lastClosedMilestones = milestones;
      });
  }

  toggleMilestone(milestone: IGitlabMilestone) {
    const milestoneIndex = this.selectedMilestones.findIndex(
      (m) => m.title === milestone.title
    );
    if (milestoneIndex === -1) {
      this.selectedMilestones.push(milestone);
    } else {
      this.selectedMilestones.splice(milestoneIndex, 1);
    }
    this.selectedMilestonesEvent.emit([...this.selectedMilestones]);
    this.onChange(this.selectedMilestones);
    this.onTouched();
  }

  getMilestoneURL(milestone: IGitlabMilestone) {
    if (!this.projetReintegration) return '';
    return `${this.projetReintegration.web_url}/-/milestones/${milestone.id}`;
  }

  isSelected(milestone: IGitlabMilestone): boolean {
    return (
      this.selectedMilestones.findIndex((m) => m.id === milestone.id) !== -1
    );
  }

  getMilestoneStateLabel(milestone: IGitlabMilestone): string {
    switch (milestone.state) {
      case 'closed':
        return 'Fermée';
      case 'active':
        return 'Ouverte';
      case 'fake':
        return 'Prochaine';
      default:
        return 'Inconnue';
    }
  }

  getMilestoneStateColorClasses(milestone: IGitlabMilestone) {
    switch (milestone.state) {
      case 'closed':
        return 'bg-red-300 text-red-800';
      case 'active':
        return 'bg-green-300 text-green-800';
      case 'fake':
        return 'bg-blue-300 text-blue-800';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  }

  getSortedMilestones() {
    return this.milestones
      .sort((a, b) => a.title.localeCompare(b.title))
      .reverse();
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
