import { Routes } from '@angular/router';
import { CodeGuidelineListComponent } from './components/office365/code-guideline-list/code-guideline-list.component';
import { NewIssueComponent } from './components/gitlab/new-issue/new-issue.component';

export const routes: Routes = [
  { path: '', component: CodeGuidelineListComponent },
  { path: 'issue-reintegration', component: NewIssueComponent },
  { path: '**', component: CodeGuidelineListComponent },
];
