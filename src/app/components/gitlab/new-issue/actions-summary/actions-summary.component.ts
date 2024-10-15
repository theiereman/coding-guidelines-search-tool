import { Component, Input } from '@angular/core';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { IGitlabMilestone } from 'src/app/interfaces/gitlab/igitlab-milestone';
import { MilestoneListComponent } from '../../milestone-list/milestone-list.component';
import { CommentPreviewComponent } from '../comment-preview/comment-preview.component';
import { ProjectIssueCardComponent } from '../../project-list/project-issue-card/project-issue-card.component';

//résumé des actions qui seront effecutées lors de la création de l'issue de réintégration
@Component({
  selector: 'app-actions-summary',
  standalone: true,
  imports: [
    MilestoneListComponent,
    CommentPreviewComponent,
    ProjectIssueCardComponent,
  ],
  templateUrl: './actions-summary.component.html',
})
export class NewIssueActionsSummaryComponent {
  @Input() issue: IGitlabIssue = {} as IGitlabIssue;
  @Input() selectedMilestones: IGitlabMilestone[] = [];
  @Input() project?: IGitlabIssue = {} as IGitlabIssue;
}
