import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/interfaces/iuser';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  user?:IUser;
  loginDisplay = false;
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.setLoginDisplay();
    this.authService.getUserObservable().subscribe(user => {
      this.user = user;
      this.setLoginDisplay()
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
