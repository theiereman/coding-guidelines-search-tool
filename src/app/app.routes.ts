import { Routes } from '@angular/router';
import { CodeGuidelineListComponent } from './components/office365/code-guideline-list/code-guideline-list.component';
import { NewIssueComponent } from './components/gitlab/new-issue/new-issue.component';
import { PageNotFoundComponent } from './components/common/page-not-found/page-not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'charte-programmation', pathMatch: 'full' },
  { path: 'charte-programmation', component: CodeGuidelineListComponent },
  { path: 'issue-reintegration', component: NewIssueComponent },
  { path: '**', component: PageNotFoundComponent },
];
