import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-milestone-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './milestone-list.component.html',
})
export class MilestoneListComponent {
  milestones: IGitlabMilestone[] = [];
  selectedMilestones: Set<number> = new Set();
  selectAll: boolean = false;

  constructor(private gitlabService: GitlabService) {
    this.gitlabService
      .getLastMilestonesFromProject(environment.gitlab_id_projet_reintegration)
      .subscribe((milestones: IGitlabMilestone[]) => {
        this.milestones = milestones;
      });
  }

  // Gère la sélection des milestones
  toggleMilestone(id: number) {
    if (this.selectedMilestones.has(id)) {
      this.selectedMilestones.delete(id);
    } else {
      this.selectedMilestones.add(id);
    }
  }

  // Tout cocher ou décocher
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.milestones.forEach((milestone) =>
        this.selectedMilestones.add(milestone.id)
      );
    } else {
      this.milestones.forEach((milestone) =>
        this.selectedMilestones.delete(milestone.id)
      );
    }
  }

  // Vérifier si une milestone est sélectionnée
  isSelected(id: number): boolean {
    return this.selectedMilestones.has(id);
  }
}
