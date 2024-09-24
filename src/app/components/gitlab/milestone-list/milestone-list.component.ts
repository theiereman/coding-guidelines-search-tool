import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './milestone-list.component.html',
})
export class MilestoneListComponent {
  @Input() milestones: IGitlabMilestone[] = [];
  selectedMilestones: IGitlabMilestone[] = [];
  selectAll: boolean = false;
  @Input() disableInteraction: boolean = false;
  @Output() selectedMilestonesEvent = new EventEmitter<IGitlabMilestone[]>();

  constructor() {}

  // Gère la sélection des milestones
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
  }

  // Tout cocher ou décocher
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.selectedMilestones = [...this.milestones];
    } else {
      this.selectedMilestones = [];
    }
    this.selectedMilestonesEvent.emit([...this.selectedMilestones]);
  }

  // Vérifier si une milestone est sélectionnée
  isSelected(milestone: IGitlabMilestone): boolean {
    return (
      this.selectedMilestones.findIndex((m) => m.id === milestone.id) !== -1
    );
  }
}
