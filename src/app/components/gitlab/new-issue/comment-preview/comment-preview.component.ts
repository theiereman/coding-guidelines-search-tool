import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { IGitlabUser } from 'src/app/interfaces/gitlab/igitlab-user';
import { GitlabAuthService } from 'src/app/services/gitlab-auth.service';

//imitation de commentaire Gitlab avec le contenu d'une issue de réintégration
@Component({
    selector: 'app-comment-preview',
    imports: [CommonModule],
    templateUrl: './comment-preview.component.html'
})
export class CommentPreviewComponent {
  @Input({ required: true }) issue: IGitlabIssue = {} as IGitlabIssue;
  connectedUser: IGitlabUser | undefined;

  private _destroy$ = new Subject<void>();

  titlePlaceholder: string = "[Périmètre] - Titre de l'issue";

  constructor(private gitlabAuthService: GitlabAuthService) {}

  ngOnInit(): void {
    this.gitlabAuthService.isAuthenticated$
      .pipe(takeUntil(this._destroy$))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.gitlabAuthService.getAuthenticatedUser().subscribe((user) => {
            this.connectedUser = user;
          });
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
