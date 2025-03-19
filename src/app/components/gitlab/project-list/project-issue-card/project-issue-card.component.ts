import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

//card contenant les informations d'un projet
@Component({
    selector: 'app-project-issue-card',
    imports: [CommonModule],
    templateUrl: './project-issue-card.component.html'
})
export class ProjectIssueCardComponent {
  @Input() issue?: IGitlabIssue = undefined;
  @Input() hideDetails: boolean = false;
  @Input() isSelected: boolean = false;

  constructor(private gitlabService: GitlabService) {}

  getProjectDetailsUrl(projectId: number) {
    return this.gitlabService.getSuiviGeneralIssueUrl(projectId);
  }

  getIssueAssigneesNames(): string {
    return (
      this.issue?.assignees?.map((assignee) => assignee.name).join(', ') ||
      'Aucun'
    );
  }
}
