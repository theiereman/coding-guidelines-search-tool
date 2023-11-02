import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { IUser } from './interfaces/iuser';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  host: {class: 'app'}
})
export class AppComponent {
  title = 'Charte de programmation - Outil de recherche';
  user?:IUser;
  contentLoaded:boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.handleRedirects().subscribe();
    this.authService.getUserObservable().subscribe(user => {
      this.contentLoaded = true;
      this.user = user;
    })
  }
}