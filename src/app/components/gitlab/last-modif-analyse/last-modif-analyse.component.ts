import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';
import { AlertsService } from 'src/app/services/alerts.service';
import { GitlabService } from 'src/app/services/gitlab.service';

@Component({
    selector: 'app-last-modif-analyse',
    imports: [CommonModule],
    templateUrl: './last-modif-analyse.component.html'
})

//composan qui affiche une préview de la dernière modification d'analyes qui a été réintégrée
export class LastModifAnalyseComponent {
  constructor(
    private gitlabService: GitlabService,
    private alertsService: AlertsService,
  ) {}

  isLoading: boolean = false;
  lastModifAnalyseIssue: IGitlabIssue | undefined;

  ngOnInit(): void {
    this.isLoading = true;
    this.gitlabService
      .getLastModifAnalyse()
      .pipe(
        //TODO : utiliser le service intégré d'erreur pour catcher les erreurs non gérées et ne pas avoir à le faire par composant
        catchError((err) => {
          console.error(err);
          this.alertsService.addWarning(
            `Impossible de récupérer l'information de la dernière issue de réintégration.`,
          );
          this.isLoading = false;
          return of(undefined);
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((issue) => {
        this.lastModifAnalyseIssue = issue;
      });
  }

  getIssueUrl(issueId: number) {
    return this.gitlabService.getIssueReintegrationUrl(issueId);
  }

  getIssueCreationDate() {
    return new Date(
      this.lastModifAnalyseIssue?.created_at ?? '',
    ).toLocaleString('fr-FR', {});
  }
}
