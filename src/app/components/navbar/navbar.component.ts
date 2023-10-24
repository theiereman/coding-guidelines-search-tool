import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/auth.service';
import { User } from 'src/app/user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
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
