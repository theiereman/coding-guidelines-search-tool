import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/interfaces/iuser';
import { GRAPH_API } from 'src/app/constants/graph-api.constants';
import { GitlabAuthService } from 'src/app/services/gitlab-auth.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IGitlabUser } from 'src/app/interfaces/gitlab/igitlab-user';
import { GitlabService } from 'src/app/services/gitlab.service';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: [],
  standalone: true,
  imports: [NgIf, RouterLink, NgClass],
})
export class NavbarComponent {
  user?: IUser;
  gitlabUser?: IGitlabUser;
  loginDisplay = false;

  constructor(
    private microsoftAuthService: AuthService,
    private gitlabAuthService: GitlabAuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.setLoginDisplay();
    this.microsoftAuthService.handleRedirects().subscribe();

    this.microsoftAuthService.user$.subscribe((user) => {
      this.user = user;
      this.setLoginDisplay();
    });

    //getsion de la redirection de Gitlab
    this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        this.gitlabAuthService.handleRedirectCallback();
      }
    });

    //si connecté sur Gitlab, récupérer l'utilisateur courant
    this.gitlabAuthService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.gitlabAuthService.getAuthenticatedUser().subscribe((user) => {
          this.gitlabUser = user;
        });
      }
    });
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
    this.gitlabUser = undefined;
    this.gitlabAuthService.logout();
  }

  isAuthenticatedOnGitlab(): boolean {
    return this.gitlabAuthService.isAuthenticated();
  }
}
