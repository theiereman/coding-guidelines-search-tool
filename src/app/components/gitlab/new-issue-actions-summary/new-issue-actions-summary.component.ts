import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { MilestoneListComponent } from '../milestone-list/milestone-list.component';
import { CommentPreviewComponent } from '../comment-preview/comment-preview.component';
import { ProjectIssueCardComponent } from '../project-issue-card/project-issue-card.component';

@Component({
  selector: 'app-new-issue-actions-summary',
  standalone: true,
  imports: [
    MilestoneListComponent,
    CommentPreviewComponent,
    ProjectIssueCardComponent,
  ],
  templateUrl: './new-issue-actions-summary.component.html',
})
export class NewIssueActionsSummaryComponent {
  @Input() issue: IGitlabIssue = {} as IGitlabIssue;
  @Input() selectedMilestones: IGitlabMilestone[] = [];
  @Input() project?: IGitlabIssue = {} as IGitlabIssue;
}
