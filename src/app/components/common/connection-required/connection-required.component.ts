import { Component, Input } from '@angular/core';
import { AbstractAuthenticationServiceService } from 'src/app/services/abstract-authentication-service.service';

//permet de bloquer le contenu d'une page tant qu'on est pas connecté au service lié
@Component({
  selector: 'app-connection-required',
  templateUrl: './connection-required.component.html',
  styleUrls: [],
  standalone: true,
})
export class ConnectionRequiredComponent {
  @Input({ required: true })
  authenticationService!: AbstractAuthenticationServiceService;
  @Input({ required: true }) externalServiceName!: string;

  constructor() {}

  login(): void {
    this.authenticationService.login();
  }
}
