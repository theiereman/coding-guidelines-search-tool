import { NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import {
  CLOSED_STATUS,
  OPEN_STATUS,
} from 'src/app/interfaces/gitlab/igitlab-milestone';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-project-issue-card',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './project-issue-card.component.html',
})
export class ProjectIssueCardComponent {
  @Input() issue?: IGitlabIssue = undefined;
  @Input() selectedProject?: IGitlabIssue = undefined;
  @Input() hideDetails: boolean = false;
  @Input() disableInteraction: boolean = false;

  CLOSED_STATUS: string = CLOSED_STATUS;
  OPEN_STATUS: string = OPEN_STATUS;

  getProjectDetailsUrl(projectId: number) {
    return `${environment.gitlab_app_base_uri}/adhoc/suivi-de-projets/-/issues/${projectId}`;
  }
}
