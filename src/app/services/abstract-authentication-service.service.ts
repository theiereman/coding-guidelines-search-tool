import { Injectable } from '@angular/core';

@Injectable()
export abstract class AbstractAuthenticationServiceService {
  constructor() {}

  abstract login(): void;
}
