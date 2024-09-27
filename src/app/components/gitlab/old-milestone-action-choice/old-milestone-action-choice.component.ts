import { NgClass, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  selectedMilestone?: IGitlabMilestone = undefined;
  private lastSelectedMilestone?: IGitlabMilestone = undefined;
  @Output() selectedMilestoneEvent = new EventEmitter<IGitlabMilestone>();

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

  toggleMilestone(milestone: IGitlabMilestone) {
    const isAlreadySelected = this.selectedMilestone?.id === milestone.id;

    if (isAlreadySelected) {
      this.selectedMilestone = undefined;
    } else {
      this.selectedMilestone = milestone;
      this.selectedMilestoneEvent.emit(this.selectedMilestone);
    }

    //envoi de la dernière selection pour qu'elle se déselectionne
    if (this.lastSelectedMilestone) {
      this.selectedMilestoneEvent.emit(this.lastSelectedMilestone);
    }
    this.lastSelectedMilestone = this.selectedMilestone;
  }

  isSelected(milestone: IGitlabMilestone): boolean {
    return this.selectedMilestone === milestone;
  }
}
