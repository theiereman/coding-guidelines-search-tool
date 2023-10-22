import { Component } from '@angular/core';
import { ICodingGuidelineItem } from '../icoding-guideline-item';
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
  numberOfItems: number = 0;

  constructor(
    private graphService: MicrosoftGraphService
  ) { }

  ngOnInit(): void {
    this.graphService.getAllCodingGuidelines()
      .subscribe(res => {
        this.codingGuidelinesItems = res
        this.numberOfItems = res.length;
      });
  }
}
