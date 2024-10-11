import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { GRAPH_API } from './app/constants/graph-api.constants';
import {
  PublicClientApplication,
  BrowserCacheLocation,
  InteractionType,
} from '@azure/msal-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import {
  MsalInterceptor,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalModule,
} from '@azure/msal-angular';
import {
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';
import { gitlabAuthInterceptor } from './app/gitlab-auth.interceptor';

const isIE =
  window.navigator.userAgent.indexOf('MSIE ') > -1 ||
  window.navigator.userAgent.indexOf('Trident/') > -1;

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([gitlabAuthInterceptor])),
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      MsalModule.forRoot(
        new PublicClientApplication({
          // MSAL Configuration
          auth: {
            clientId: GRAPH_API.clientId,
            authority: `https://login.microsoftonline.com/${GRAPH_API.tenantId}`,
          },
          cache: {
            cacheLocation: BrowserCacheLocation.LocalStorage,
            storeAuthStateInCookie: isIE, // set to true for IE 11
          },
          system: {
            loggerOptions: {
              loggerCallback: () => {},
              piiLoggingEnabled: isIE,
            },
          },
        }),
        {
          interactionType: InteractionType.Redirect, // MSAL Guard Configuration
        },
        {
          interactionType: InteractionType.Redirect,
          protectedResourceMap: new Map([
            [
              'https://graph.microsoft.com/*',
              ['User.Read', 'Sites.Read.All', 'Files.Read.All'],
            ],
          ]),
        },
      ),
    ),
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
  ],
}).catch((err) => console.error(err));
