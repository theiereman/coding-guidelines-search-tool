import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-code-guideline-search',
    templateUrl: './code-guideline-search.component.html',
    styleUrls: [],
    standalone: true
})
export class CodeGuidelineSearchComponent {
  @Output() onSearchValueChanged: EventEmitter<string> = new EventEmitter();

  onInputChanged(searchTerm:string) {
    this.onSearchValueChanged.emit(searchTerm)
  }
}
