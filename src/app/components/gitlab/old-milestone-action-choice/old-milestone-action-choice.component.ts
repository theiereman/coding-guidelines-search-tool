import { NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { IGitlabProject } from 'src/app/interfaces/gitlab/igitlab-project';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-old-milestone-action-choice',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './old-milestone-action-choice.component.html',
})
export class OldMilestoneActionChoiceComponent {
  @Input({ required: true }) milestone: IGitlabMilestone =
    {} as IGitlabMilestone;
  nextMilestone: IGitlabMilestone = {} as IGitlabMilestone;

  private projetReintegration?: IGitlabProject = undefined;
  uniqueName: string = '';

  //TODO: gérer la selection dans le composant qui liste les milestones
  selectedMilestone?: IGitlabMilestone = undefined;

  constructor(private gitlabService: GitlabService) {}

  ngOnInit(): void {
    this.gitlabService
      .getProject(environment.gitlab_id_projet_reintegration)
      .subscribe((projet) => {
        this.projetReintegration = projet;
      });

    this.nextMilestone = {
      id: -1,
      title: this.gitlabService.incrementMilestoneBugFixVersion(
        this.milestone.title
      ),
      state: 'fake',
    };

    this.uniqueName = 'milestone_' + Math.random().toString(36).substring(2);
  }

  getMilestoneURL(milestone: IGitlabMilestone) {
    if (!this.projetReintegration) return '';
    return `${this.projetReintegration.web_url}/-/milestones/${milestone.id}`;
  }

  toggleRadio(milestone: IGitlabMilestone): void {
    if (this.selectedMilestone?.id === milestone.id) {
      this.selectedMilestone = undefined; // Désélectionner si c'est déjà sélectionné
    } else {
      this.selectedMilestone = milestone; // Sélectionner la nouvelle option
    }
  }

  isSelected(milestone: IGitlabMilestone): boolean {
    return this.selectedMilestone === milestone;
  }
}
