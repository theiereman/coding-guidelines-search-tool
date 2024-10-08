import { NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-project-issue-card',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './project-issue-card.component.html',
})
export class ProjectIssueCardComponent {
  @Input() issue?: IGitlabIssue = undefined;
  @Input() hideDetails: boolean = false;

  constructor(public gitlabService: GitlabService) {}

  getProjectDetailsUrl(projectId: number) {
    return `${environment.GITLAB_APP_BASE_URI}/adhoc/suivi-de-projets/-/issues/${projectId}`;
  }
}
