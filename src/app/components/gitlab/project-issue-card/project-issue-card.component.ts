import { NgClass, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
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

  getProjectDetailsUrl(projectId: number) {
    return `${environment.gitlab_app_base_uri}/adhoc/suivi-de-projets/-/issues/${projectId}`;
  }
}
