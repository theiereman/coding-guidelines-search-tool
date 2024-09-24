import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [NgFor, NgIf],
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
  selectedMilestones: IGitlabMilestone[] = [];
  selectAll: boolean = false;
  @Input() disableInteraction: boolean = false;
  @Output() selectedMilestonesEvent = new EventEmitter<IGitlabMilestone[]>();

  private onChange: (value: IGitlabMilestone[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {}

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
      this.selectedMilestones = [...this.milestones];
    } else {
      this.selectedMilestones = [];
    }
    this.selectedMilestonesEvent.emit([...this.selectedMilestones]);
    this.onChange(this.selectedMilestones);
    this.onTouched();
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
        this.selectedMilestones.length === this.milestones.length;
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
