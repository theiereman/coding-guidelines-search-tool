import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

//page 404
@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-not-found.component.html',
})
export class PageNotFoundComponent {}
