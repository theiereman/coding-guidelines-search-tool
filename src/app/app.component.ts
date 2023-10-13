import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from './user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Charte de programmation - Outil de recherche';
  user?:User;
  loginDisplay = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.handleRedirects().subscribe();
    this.setLoginDisplay();
    this.authService.getUserObservable().subscribe(user => {
      this.user = user;
    })
  }

  login(): void {
    this.authService.login().subscribe(_ => {
      this.setLoginDisplay()
    });
  }

  logout() {
    this.authService.logout().subscribe(_ => {
      this.setLoginDisplay()
    });
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.isAuthenticated();
  }
}