import { Component } from '@angular/core';
import { Providers, Msal2Provider } from '@microsoft/mgt';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Charte de programmation - Outil de recherche';

  ngOnInit(): void {
    Providers.globalProvider = new Msal2Provider({clientId: `[${environment.clientId}]`})
  }
}