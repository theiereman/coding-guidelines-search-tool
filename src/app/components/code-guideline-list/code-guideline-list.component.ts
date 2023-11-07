import { Component,  } from '@angular/core';
import { ICodingGuidelineItem } from '../../interfaces/icoding-guideline-item';
import { MicrosoftGraphService } from '../../services/microsoft-graph.service';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-code-guideline-list',
  templateUrl: './code-guideline-list.component.html',
  styleUrls: []
})
export class CodeGuidelineListComponent {
  valuesInitialized:boolean = false
  codingGuidelinesItems: ICodingGuidelineItem[] = []
  filteredCodingGuidelinesItems: ICodingGuidelineItem[] = []

  private searchValueChangedSubject: Subject<string> = new Subject<string>();

  constructor(
    private graphService: MicrosoftGraphService
  ) {
    this.searchValueChangedSubject.pipe(
      debounceTime(300)
    ).subscribe((searchValue) => {
      this.filterCodingGuidelines(searchValue);
    });
   }

  onSearchValueUpdated(searchValue: string) {
    this.searchValueChangedSubject.next(searchValue);
  }

  private filterCodingGuidelines(searchValue:string) {
    if(searchValue.trim() === '') { this.filteredCodingGuidelinesItems = this.codingGuidelinesItems; return; }
      
    this.filteredCodingGuidelinesItems = this.codingGuidelinesItems.filter(codingGuideline => {
      //formattage de la recherche
      searchValue.replace(/\s+/g, ' ');
      searchValue = searchValue.toLowerCase();
      
      let containsSearchedTerms = true;

      //possibilité de chercher plusieurs termes séparés par un espace
      let i = 0;
      let termsArray = searchValue.split(' ').filter(value => value.length > 0)
      while(containsSearchedTerms === true && i<termsArray.length) {
        containsSearchedTerms = codingGuideline.name.toLowerCase().includes(termsArray[i])
                                  || codingGuideline.prefix.toLowerCase().includes(termsArray[i]) 
                                  || codingGuideline.case.toLowerCase().includes(termsArray[i]) 
                                  || codingGuideline.example?.toLowerCase().includes(termsArray[i]) 
                                  || codingGuideline.sheetName.toLowerCase().includes(termsArray[i]);
        i++;
      }
      
      return containsSearchedTerms;
    });
  }

  ngOnInit(): void {
    this.graphService.getAllCodingGuidelines()
      .subscribe(res => {
        this.codingGuidelinesItems = res
        this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
        this.valuesInitialized = true;
      });
  }
}
