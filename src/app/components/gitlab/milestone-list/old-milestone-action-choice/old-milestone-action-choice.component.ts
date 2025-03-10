import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FAKE_STATUS,
  IGitlabMilestone,
} from 'src/app/interfaces/gitlab/igitlab-milestone';
import { IGitlabProject } from 'src/app/interfaces/gitlab/igitlab-project';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

//élément qui affiche une ancienne milestone (fermée) et la potentielle milestone suivante (à ouvrir)
@Component({
    selector: 'app-old-milestone-action-choice',
    imports: [CommonModule],
    templateUrl: './old-milestone-action-choice.component.html'
})
export class OldMilestoneActionChoiceComponent {
  @Input({ required: true }) milestone: IGitlabMilestone =
    {} as IGitlabMilestone; //ancienne milestone d'une version fermée
  nextMilestone: IGitlabMilestone = {} as IGitlabMilestone; //milestone non existante avec le numéro de version suivant
  selectedMilestone?: IGitlabMilestone = undefined; //milestone actuellement selectionnée

  private projetReintegration?: IGitlabProject = undefined;
  private lastSelectedMilestone?: IGitlabMilestone = undefined;

  @Output() selectedMilestoneEvent = new EventEmitter<IGitlabMilestone>();

  constructor(public gitlabService: GitlabService) {}

  ngOnInit(): void {
    this.gitlabService
      .getProject(environment.GITLAB_ID_PROJET_REINTEGRATION)
      .subscribe((projet) => {
        this.projetReintegration = projet;
      });

    //création d'une fausse milestone avec un numéro de version suivant la milestone passée en entrée
    this.nextMilestone = {
      id: -1,
      title: this.gitlabService.incrementMilestoneBugFixVersion(
        this.milestone.title,
      ),
      state: FAKE_STATUS,
    };
  }

  getMilestoneURL(milestone: IGitlabMilestone) {
    if (!this.projetReintegration) return '';
    return `${this.projetReintegration.web_url}/-/milestones/${milestone.iid}`;
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
