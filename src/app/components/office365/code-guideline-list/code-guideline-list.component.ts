import { Component } from '@angular/core';
import { ICodingGuidelineItem } from '../../../interfaces/icoding-guideline-item';
import { MicrosoftGraphService } from '../../../services/microsoft-graph.service';
import { BehaviorSubject, Subject, debounceTime, switchMap } from 'rxjs';
import { normalize } from '../../../helpers/strings-helper';
import { HighlightOnSearchDirective } from '../../../directives/highlight-on-search.directive';
import { NgIf, NgFor } from '@angular/common';
import { CodeGuidelineSearchComponent } from '../code-guideline-search/code-guideline-search.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from '@microsoft/mgt';
import { ConnectionRequiredComponent } from '../connection-required/connection-required.component';
import { ProjectLabelsListComponent } from "../../gitlab/project-labels-list/project-labels-list.component";

@Component({
  selector: 'app-code-guideline-list',
  templateUrl: './code-guideline-list.component.html',
  styleUrls: [],
  standalone: true,
  imports: [
    CodeGuidelineSearchComponent,
    NgIf,
    NgFor,
    HighlightOnSearchDirective,
    ConnectionRequiredComponent,
    ProjectLabelsListComponent
],
})
export class CodeGuidelineListComponent {
  currentSearchValue: string = '';
  valuesInitialized: boolean = false;
  codingGuidelinesItems: ICodingGuidelineItem[] = [];
  filteredCodingGuidelinesItems: ICodingGuidelineItem[] = [];
  user?: IUser;
  contentLoaded: boolean = false;

  private codeguidelinesListTrigger$ = new Subject<void>();
  private searchValueChangedSubject$ = new BehaviorSubject<string>('');

  constructor(
    private graphService: MicrosoftGraphService,
    private authService: AuthService
  ) {
    //mise à jour de la recherche
    this.searchValueChangedSubject$
      .pipe(debounceTime(300))
      .subscribe((searchValue) => {
        this.filterCodingGuidelines(searchValue);
      });

    //mise à jour de la liste
    this.codeguidelinesListTrigger$
      .pipe(
        debounceTime(1000),
        switchMap(() => {
          return this.graphService.getAllCodingGuidelines();
        })
      )
      .subscribe((res) => {
        this.codingGuidelinesItems = res;
        this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
        this.valuesInitialized = true;
        this.filterCodingGuidelines(this.currentSearchValue);
      });
  }

  onSearchValueUpdated(searchValue: string) {
    this.currentSearchValue = searchValue;
    this.searchValueChangedSubject$.next(searchValue);
  }

  updateList() {
    this.valuesInitialized = false;
    this.codingGuidelinesItems = [];
    this.filteredCodingGuidelinesItems = [];

    this.codeguidelinesListTrigger$.next();
  }

  private filterCodingGuidelines(searchValue: string) {
    searchValue = normalize(searchValue);

    //liste par défaut si recherche vide
    if (searchValue === '') {
      this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
      return;
    }

    this.filteredCodingGuidelinesItems = this.codingGuidelinesItems.filter(
      (codingGuideline) => {
        let containsSearchedTerms = true;

        //possibilité de chercher plusieurs termes séparés par un espace (ET logique entre les termes)
        let i = 0;
        let termsArray = searchValue
          .split(' ')
          .filter((value) => value.length > 0);
        while (containsSearchedTerms === true && i < termsArray.length) {
          containsSearchedTerms =
            normalize(codingGuideline.name).includes(termsArray[i]) ||
            normalize(codingGuideline.prefix).includes(termsArray[i]) ||
            normalize(codingGuideline.case).includes(termsArray[i]) ||
            normalize(codingGuideline.sheetName).includes(termsArray[i]);
          i++;
        }

        return containsSearchedTerms;
      }
    );
  }

  ngOnInit(): void {
    this.authService.handleRedirects().subscribe();
    this.authService.getUserObservable().subscribe((user) => {
      this.contentLoaded = true;
      this.user = user;

      if (this.user) {
        this.codeguidelinesListTrigger$.next();
      }
    });
  }
}
