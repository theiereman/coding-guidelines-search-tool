import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { IGitlabLabel } from 'src/app/interfaces/gitlab/igitlab-label';
import { GitlabService } from 'src/app/services/gitlab.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-project-labels-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './project-labels-list.component.html',
})
export class ProjectLabelsListComponent {
  labels: IGitlabLabel[] = [];

  constructor(private gitlabService: GitlabService) {}

  ngOnInit(): void {
    //get labels from project
    this.gitlabService
      .getLabelsFromProject(environment.gitlab_id_projet_reintegration)
      .subscribe((labels: IGitlabLabel[]) => {
        this.labels = labels;
      });
  }
}
