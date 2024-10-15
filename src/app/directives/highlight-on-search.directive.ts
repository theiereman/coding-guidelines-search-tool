import { Directive, ElementRef, Input } from '@angular/core';
import { normalize } from '../helpers/strings-helper';

//directive qui met en gras le résultat d'une recherche
@Directive({
  selector: '[appHighlightOnSearch]',
  standalone: true,
})
export class HighlightOnSearchDirective {
  private elementValue: string = '';
  private previousValue: string = '';

  @Input() set appHighlightOnSearch(value: string) {
    this.previousValue = normalize(value);
    this.highlight();
  }

  constructor(private el: ElementRef) {}

  public ngAfterViewInit(): void {
    this.elementValue = normalize(this.el.nativeElement.innerText);
    this.highlight();
  }

  private highlight() {
    let termsArray = this.previousValue
      .split(' ')
      .filter((value) => value.length > 0);

    this.el.nativeElement.style.fontWeight = 400; //reset du highlihght
    termsArray.forEach((term) => {
      if (this.previousValue !== '' && this.elementValue.includes(term)) {
        this.el.nativeElement.style.fontWeight = 700;
      }
    });
  }
}
