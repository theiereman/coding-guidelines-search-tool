import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/interfaces/iuser';
import { GRAPH_API } from 'src/app/constants/graph-api.constants';
import { GitlabAuthService } from 'src/app/services/gitlab-auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: [],
})
export class NavbarComponent {
  user?: IUser;
  loginDisplay = false;

  constructor(
    private microsoftAuthService: AuthService,
    private gitlabAuthService: GitlabAuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.setLoginDisplay();
    this.microsoftAuthService.getUserObservable().subscribe((user) => {
      this.user = user;
      this.setLoginDisplay();
    });
    this.route.queryParams.subscribe((params) => {
      console.log('redirected from gitlab');
      console.log(params);
      if (params['code']) {
        this.gitlabAuthService.handleRedirectCallback();
      }
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

  microsoftLogin(): void {
    this.microsoftAuthService.login().subscribe((_) => {
      this.setLoginDisplay();
    });
  }

  microsoftLogout() {
    this.microsoftAuthService.logout().subscribe((_) => {
      this.setLoginDisplay();
    });
  }

  setLoginDisplay() {
    this.loginDisplay = this.microsoftAuthService.isAuthenticated();
  }

  gitlabLogin() {
    this.gitlabAuthService.login();
  }

  gitlabLogout() {
    this.gitlabAuthService.logout();
  }

  isAuthenticatedOnGitlab(): boolean {
    return this.gitlabAuthService.isAuthenticated();
  }
}
