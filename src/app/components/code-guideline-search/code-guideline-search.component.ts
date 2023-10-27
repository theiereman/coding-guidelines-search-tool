import { Component, EventEmitter, Output } from '@angular/core';
import { delay } from 'rxjs';

@Component({
  selector: 'app-code-guideline-search',
  templateUrl: './code-guideline-search.component.html',
  styleUrls: ['./code-guideline-search.component.css']
})
export class CodeGuidelineSearchComponent {
  @Output() onSearchValueChanged: EventEmitter<string> = new EventEmitter();

  onInputChanged(searchTerm:string) {
    this.onSearchValueChanged.emit(searchTerm)
  }
}
