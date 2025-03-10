import { Component } from '@angular/core';
import { ICodingGuidelineItem } from '../../../interfaces/icoding-guideline-item';
import { MicrosoftGraphService } from '../../../services/microsoft-graph.service';
import { BehaviorSubject, Subject, debounceTime, switchMap } from 'rxjs';
import { normalize } from '../../../helpers/strings-helper';
import { HighlightOnSearchDirective } from '../../../directives/highlight-on-search.directive';
import { CommonModule } from '@angular/common';
import { IUser } from '@microsoft/mgt';
import { GRAPH_API } from 'src/app/constants/graph-api.constants';
import { MicrosoftGraphAuthService } from 'src/app/services/microsoft-graph-auth.service';
import { ConnectionRequiredComponent } from '../../common/connection-required/connection-required.component';

//interface de recherche + affichage dans la charte de programmation Sharepoint Custy
@Component({
    selector: 'app-code-guideline-list',
    templateUrl: './code-guideline-list.component.html',
    styleUrls: [],
    imports: [
        CommonModule,
        HighlightOnSearchDirective,
        ConnectionRequiredComponent,
    ]
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
    public authService: MicrosoftGraphAuthService,
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
        }),
      )
      .subscribe((res) => {
        this.codingGuidelinesItems = res;
        this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
        this.valuesInitialized = true;
        this.filterCodingGuidelines(this.currentSearchValue);
      });
  }

  openSharepointWorksheet() {
    window.open(GRAPH_API.worksheetLink);
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
      },
    );
  }

  ngOnInit(): void {
    //permet de ne pas afficher le 'connection-required' component pendant le chargement de l'utilisateur
    this.authService.loading$.subscribe((loading) => {
      this.contentLoaded = !loading;
    });

    this.authService.user$.subscribe((user) => {
      this.user = user;

      if (this.user) {
        this.codeguidelinesListTrigger$.next();
      }
    });
  }
}
