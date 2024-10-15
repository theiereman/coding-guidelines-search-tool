import { Injectable } from '@angular/core';

//force les services à implémenter une proécdure "login" pour utiliser le composant "connection-required"
@Injectable()
export abstract class AbstractAuthenticationServiceService {
  constructor() {}

  abstract login(): void;
}
