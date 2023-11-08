import { Component,  } from '@angular/core';
import { ICodingGuidelineItem } from '../../interfaces/icoding-guideline-item';
import { MicrosoftGraphService } from '../../services/microsoft-graph.service';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { customNormalization } from '../../helpers/strings-normalizer';

@Component({
  selector: 'app-code-guideline-list',
  templateUrl: './code-guideline-list.component.html',
  styleUrls: []
})
export class CodeGuidelineListComponent {
  valuesInitialized:boolean = false
  codingGuidelinesItems: ICodingGuidelineItem[] = []
  filteredCodingGuidelinesItems: ICodingGuidelineItem[] = []

  private codeguidelinesListTrigger$ = new Subject<void>;
  private searchValueChangedSubject: Subject<string> = new Subject<string>();

  constructor(
    private graphService: MicrosoftGraphService
  ) {
    //mise à jour de la recherche
    this.searchValueChangedSubject.pipe(
      debounceTime(300)
    ).subscribe((searchValue) => {
      this.filterCodingGuidelines(searchValue);
    });

    //mise à jour de la liste
    this.codeguidelinesListTrigger$.pipe(
      debounceTime(2000),
      switchMap(() => {
        return this.graphService.getAllCodingGuidelines();
      })
    ).subscribe((res) => {
      console.log("test")
      this.codingGuidelinesItems = res
      this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
      this.valuesInitialized = true;
    })
   }

  onSearchValueUpdated(searchValue: string) {
    this.searchValueChangedSubject.next(searchValue);
  }

  updateList() {
    this.valuesInitialized = false;
    this.codingGuidelinesItems = [];
    this.filteredCodingGuidelinesItems = []

    this.codeguidelinesListTrigger$.next();
  }

  private filterCodingGuidelines(searchValue:string) {
    searchValue = customNormalization(searchValue)

    //liste par défaut si recherche vide
    if(searchValue === '') { 
      this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
      return; 
    }

    this.filteredCodingGuidelinesItems = this.codingGuidelinesItems.filter(codingGuideline => {
      let containsSearchedTerms = true;

      //possibilité de chercher plusieurs termes séparés par un espace (ET logique entre les termes)
      let i = 0;
      let termsArray = searchValue.split(' ').filter(value => value.length > 0)
      while(containsSearchedTerms === true && i < termsArray.length) {
        containsSearchedTerms =  customNormalization(codingGuideline.name).includes(termsArray[i])
                              || customNormalization(codingGuideline.prefix).includes(termsArray[i]) 
                              || customNormalization(codingGuideline.case).includes(termsArray[i]) 
                              || customNormalization(codingGuideline.example ?? "").includes(termsArray[i]) 
                              || customNormalization(codingGuideline.sheetName).includes(termsArray[i]);
        i++;
      }
      
      return containsSearchedTerms;
    });
  }

  ngOnInit(): void {
    this.codeguidelinesListTrigger$.next();
  }
}
