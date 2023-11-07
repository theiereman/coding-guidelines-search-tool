import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-connection-required',
  templateUrl: './connection-required.component.html',
  styleUrls: []
})
export class ConnectionRequiredComponent {
  constructor(private authService: AuthService) {}

  login(): void {
    this.authService.login().subscribe();
  }
}
