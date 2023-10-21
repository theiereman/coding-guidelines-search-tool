import { Component } from '@angular/core';
import { ICodingGuidelineItem } from '../icoding-guideline-item';
import { GUIDELINES } from '../coding-guidelines.mock';
import { MicrosoftGraphService } from '../microsoft-graph.service';
import { mergeMap } from 'rxjs';


@Component({
  selector: 'app-coding-guideline-search',
  templateUrl: './coding-guideline-search.component.html',
  styleUrls: ['./coding-guideline-search.component.css']
})
export class CodingGuidelineSearchComponent {
  searchValue:string = ""
  codingGuidelinesItems: ICodingGuidelineItem[] = []
  worksheetNames: string[] = []

  constructor(
    private graphService: MicrosoftGraphService
  ) { }

  getWorksheets() {
    this.graphService.getWorksheetsNames()
    .subscribe((names:string[]) => {
      this.worksheetNames = names;
      names.forEach(name => {
        this.graphService.getCodingGuidelinesFromWorksheet(name).subscribe(codingGuideline => console.log(codingGuideline));
      })
    });
  }

  resetWorksheets() {
    this.worksheetNames = []
  }

  ngOnInit(): void {
    this.codingGuidelinesItems = GUIDELINES;
  }
}
