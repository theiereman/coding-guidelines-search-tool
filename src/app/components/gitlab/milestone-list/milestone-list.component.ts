import { NgClass, NgFor, NgIf } from '@angular/common';
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
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, switchMap, tap } from 'rxjs';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { IGitlabProject } from 'src/app/interfaces/gitlab/igitlab-project';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';
import { OldMilestoneActionChoiceComponent } from '../old-milestone-action-choice/old-milestone-action-choice.component';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [
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

//TODO: modifier ce composant en "openMilestonesList"
export class MilestoneListComponent implements ControlValueAccessor {
  @Input() milestones: IGitlabMilestone[] = [];
  lastClosedMilestones: IGitlabMilestone[] = [];
  selectedMilestones: IGitlabMilestone[] = [];
  selectAll: boolean = false;
  @Input() disableInteraction: boolean = false;
  @Output() selectedMilestonesEvent = new EventEmitter<IGitlabMilestone[]>();

  loadingMilestones: boolean = false;

  private projetReintegration?: IGitlabProject = undefined;

  private onChange: (value: IGitlabMilestone[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private gitlabService: GitlabService) {}

  ngOnInit(): void {
    this.gitlabService
      .getProject(environment.gitlab_id_projet_reintegration)
      .subscribe((projet) => {
        this.projetReintegration = projet;
      });

    //TODO : liste d'éléments qui permettent de choisir entre la dernière milestone de la version ou un nouveau numéro de version

    this.gitlabService
      .getLastMilestonesOfOldVersionsFromProject(
        environment.gitlab_id_projet_reintegration
      )
      .subscribe((milestones) => {
        this.lastClosedMilestones = milestones;
      });
  }

  toggleMilestone(milestone: IGitlabMilestone) {
    const milestoneIndex = this.selectedMilestones.findIndex(
      (m) => m.id === milestone.id
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

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.selectedMilestones = [
        ...this.milestones,
        ...this.lastClosedMilestones,
      ];
    } else {
      this.selectedMilestones = [];
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
        return 'Nouvelle';
      default:
        return 'Inconnue';
    }
  }

  writeValue(value: IGitlabMilestone[]): void {
    if (value) {
      this.selectedMilestones = value;
      this.selectAll =
        this.selectedMilestones.length > 0 &&
        this.selectedMilestones.length ===
          this.milestones.length + this.lastClosedMilestones.length;
    } else {
      this.selectedMilestones = [];
    }
  }

  registerOnChange(fn: (value: IGitlabMilestone[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disableInteraction = isDisabled;
  }
}
