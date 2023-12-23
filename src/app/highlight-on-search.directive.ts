import { Directive, ElementRef, Input } from '@angular/core';
import { customNormalization } from './helpers/strings-helper';

@Directive({
  selector: '[appHighlightOnSearch]'
})

export class HighlightOnSearchDirective{
  
  private elementValue: string = '';
  private previousValue: string = '';
  
  @Input() set appHighlightOnSearch(value: string) {
    this.previousValue = customNormalization(value);
    this.highlight();
  }

  constructor(private el: ElementRef) {  }

  public ngAfterViewInit(): void { 
    this.elementValue = customNormalization(this.el.nativeElement.innerText)
    this.highlight();
  }

  private highlight() {
    this.el.nativeElement.style.backgroundColor = 'transparent'; //reset du highlihght
    if(this.previousValue !== '' && this.elementValue.includes(this.previousValue)) {
      this.el.nativeElement.style.backgroundColor  = 'yellow';
    } 
  }
}
