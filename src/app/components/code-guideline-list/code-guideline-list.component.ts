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
  numberOfItems: number = 0;

  constructor(
    private graphService: MicrosoftGraphService
  ) { }

  ngOnInit(): void {
    // this.graphService.getAllCodingGuidelines()
    //   .subscribe(res => {
    //     this.codingGuidelinesItems = res
    //     this.numberOfItems = res.length;
    //     this.valuesInitialized = true;
    //   });
  }
}
