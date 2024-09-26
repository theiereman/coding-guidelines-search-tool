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

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, NgClass],
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
  searchedMilestones: IGitlabMilestone[] = [];
  selectedMilestones: IGitlabMilestone[] = [];
  selectAll: boolean = false;
  @Input() disableInteraction: boolean = false;
  @Output() selectedMilestonesEvent = new EventEmitter<IGitlabMilestone[]>();

  searchValueControl: FormControl = new FormControl('');
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

    this.searchValueControl.valueChanges
      .pipe(
        tap(() => (this.loadingMilestones = true)),
        debounceTime(300),
        switchMap(() => {
          return this.gitlabService.searchMilestonesFromProject(
            environment.gitlab_id_projet_reintegration,
            this.searchValueControl.value
          );
        })
      )
      .subscribe((milestones) => {
        this.searchedMilestones = milestones;
        //if selectedMilestones contains milestones that are not in searchedMilestones or milestones, remove them
        this.selectedMilestones = this.selectedMilestones.filter(
          (milestone) => {
            return (
              this.searchedMilestones.some((m) => m.id === milestone.id) ||
              this.milestones.some((m) => m.id === milestone.id)
            );
          }
        );

        this.selectedMilestonesEvent.emit([...this.selectedMilestones]);
        this.loadingMilestones = false;
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
        ...this.searchedMilestones,
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

  writeValue(value: IGitlabMilestone[]): void {
    if (value) {
      this.selectedMilestones = value;
      this.selectAll =
        this.selectedMilestones.length > 0 &&
        this.selectedMilestones.length ===
          this.milestones.length + this.searchedMilestones.length;
    } else {
      this.selectedMilestones = [];
    }
    console.log(this.selectAll);
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
