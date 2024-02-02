import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/interfaces/iuser';
import { GRAPH_API } from 'src/app/constants/graph-api.constants';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: [],
})
export class NavbarComponent {
  user?: IUser;
  loginDisplay = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.setLoginDisplay();
    this.authService.getUserObservable().subscribe((user) => {
      this.user = user;
      this.setLoginDisplay();
    });
  }

  openSharepointWorksheet() {
    window.open(GRAPH_API.worksheetLink);
  }

  openRevolutionGuidelines() {
    window.open(GRAPH_API.revolutionGuidelinesLink);
  }

  openNewIssueTooltip() {
    window.open(GRAPH_API.newIssueTooltipLink);
  }

  login(): void {
    this.authService.login().subscribe((_) => {
      this.setLoginDisplay();
    });
  }

  logout() {
    this.authService.logout().subscribe((_) => {
      this.setLoginDisplay();
    });
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.isAuthenticated();
  }
}
