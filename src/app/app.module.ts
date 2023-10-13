import { NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CodingGuidelineSearchComponent } from './coding-guideline-search/coding-guideline-search.component';
import { FormsModule } from '@angular/forms';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MsalModule, MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService, MsalRedirectComponent } from "@azure/msal-angular";
import { PublicClientApplication, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";

import { environment } from 'src/environments/environment';

const isIE =
  window.navigator.userAgent.indexOf("MSIE ") > -1 ||
  window.navigator.userAgent.indexOf("Trident/") > -1;


@NgModule({
  declarations: [
    AppComponent,
    CodingGuidelineSearchComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MsalModule.forRoot( new PublicClientApplication({ // MSAL Configuration
        auth: {
            clientId: environment.clientId,
            authority: `https://login.microsoftonline.com/${environment.tenantId}`,
            redirectUri: "http://localhost:4200",
        },
        cache: {
            cacheLocation : BrowserCacheLocation.LocalStorage,
            storeAuthStateInCookie: true, // set to true for IE 11
        },
        system: {
            loggerOptions: {
                loggerCallback: () => {},
                piiLoggingEnabled: isIE
            }
        }
    }), {
        interactionType: InteractionType.Redirect, // MSAL Guard Configuration
    }, {
        interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
        protectedResourceMap: new Map([
            ['https://graph.microsoft.com/v1.0/me', ['user.read']],
            ['https://api.myapplication.com/users/*', ['customscope.read']],
            ['http://localhost:4200/about/', null] 
        ])
    })
  ],
  schemas: [],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
