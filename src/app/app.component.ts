import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { IUser } from './interfaces/iuser';
import { CodeGuidelineListComponent } from './components/code-guideline-list/code-guideline-list.component';
import { ConnectionRequiredComponent } from './components/connection-required/connection-required.component';
import { NgIf } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertsComponent } from './components/alerts/alerts.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  host: { class: 'app' },
  standalone: true,
  imports: [
    NavbarComponent,
    NgIf,
    ConnectionRequiredComponent,
    CodeGuidelineListComponent,
    AlertsComponent,
    RouterOutlet,
  ],
})
export class AppComponent {
  title = 'Charte de programmation - Outil de recherche';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}
}
