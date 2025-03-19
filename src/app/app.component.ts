import { Component } from '@angular/core';
import { CodeGuidelineListComponent } from './components/office365/code-guideline-list/code-guideline-list.component';
import { NavbarComponent } from './components/common/navbar/navbar.component';
import { AlertsComponent } from './components/common/alerts/alerts.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  host: { class: 'app' },
  imports: [NavbarComponent, AlertsComponent, RouterOutlet],
})
export class AppComponent {
  title = 'Charte de programmation - Outil de recherche';

  constructor() {}

  ngOnInit(): void {}
}
