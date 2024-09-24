import { NgClass, NgFor, NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { GitlabAuthService } from 'src/app/services/gitlab-auth.service';

@Component({
  selector: 'app-comment-preview',
  standalone: true,
  imports: [NgClass, NgStyle, NgFor],
  templateUrl: './comment-preview.component.html',
})
export class CommentPreviewComponent {
  @Input() issue: IGitlabIssue = {} as IGitlabIssue;

  titlePlaceholder: string = "[Périmètre] - Titre de l'issue";

  constructor(private gitlabAuthService: GitlabAuthService) {}

  ngOnInit(): void {
    this.gitlabAuthService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.gitlabAuthService.getAuthenticatedUser().subscribe((user) => {
          this.issue.assignee = user;
        });
      }
    });
  }
}
