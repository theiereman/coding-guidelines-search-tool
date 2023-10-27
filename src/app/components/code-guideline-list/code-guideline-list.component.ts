import { Component } from '@angular/core';
import { ICodingGuidelineItem } from '../../icoding-guideline-item';
import { MicrosoftGraphService } from '../../microsoft-graph.service';

@Component({
  selector: 'app-code-guideline-list',
  templateUrl: './code-guideline-list.component.html',
  styleUrls: ['./code-guideline-list.component.css']
})
export class CodeGuidelineListComponent {
  valuesInitialized:boolean = false
  codingGuidelinesItems: ICodingGuidelineItem[] = []
  filteredCodingGuidelinesItems: ICodingGuidelineItem[] = []
  numberOfItems: number = 0;

  constructor(
    private graphService: MicrosoftGraphService
  ) { }

  onSearchValueUpdated(searchValue: string) {
    this.filteredCodingGuidelinesItems = this.codingGuidelinesItems.filter(codingGuideline => {
      searchValue = searchValue.toLowerCase();
      return codingGuideline.name.toLowerCase().includes(searchValue) 
        || codingGuideline.prefix.toLowerCase().includes(searchValue) 
        || codingGuideline.case.toLowerCase().includes(searchValue) 
        || codingGuideline.example?.toLowerCase().includes(searchValue) 
        || codingGuideline.sheetName.toLowerCase().includes(searchValue)
    })
  }

  ngOnInit(): void {
    this.graphService.getAllCodingGuidelines()
      .subscribe(res => {
        this.codingGuidelinesItems = res
        this.filteredCodingGuidelinesItems = this.codingGuidelinesItems;
        this.numberOfItems = res.length;
        this.valuesInitialized = true;
      });
  }
}
