import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CodingGuidelineSearchComponent } from './coding-guideline-search/coding-guideline-search.component';

@NgModule({
  declarations: [
    AppComponent,
    CodingGuidelineSearchComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
