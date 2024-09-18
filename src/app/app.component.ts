import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { IUser } from './interfaces/iuser';
import { CodeGuidelineListComponent } from './components/code-guideline-list/code-guideline-list.component';
import { ConnectionRequiredComponent } from './components/connection-required/connection-required.component';
import { NgIf } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertsComponent } from './components/alerts/alerts.component';

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
  ],
})
export class AppComponent {
  title = 'Charte de programmation - Outil de recherche';
  user?: IUser;
  contentLoaded: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.handleRedirects().subscribe();
    this.authService.getUserObservable().subscribe((user) => {
      this.contentLoaded = true;
      this.user = user;
    });
  }
}
