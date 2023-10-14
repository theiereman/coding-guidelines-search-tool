import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftGraphService {

  private graphClient?: Client;

  constructor() {

    // this.graphClient = Client.init(

    // )

   }
}
