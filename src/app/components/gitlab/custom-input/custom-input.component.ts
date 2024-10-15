import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { SelectOption } from 'src/app/interfaces/select-option';
import { NewIssueInputSlotComponent } from '../new-issue/input-slot/input-slot.component';

//input normalisé pour le formulaire Gitlab
@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NewIssueInputSlotComponent],
  templateUrl: './custom-input.component.html',
})
export class CustomInputComponent {
  @Input({ required: true }) label: string = ''; //libellé de l'input
  @Input() selectOptions: SelectOption[] = []; //option pour un input de type "combo"
  @Input() yesNoSelector: boolean = false; //combo "oui" / "non"
  @Input() control: FormControl = new FormControl(''); //form control qui permet de valider la saisie
  @Input() isMultiline: boolean = false; //input multi lignes
  @Input() preselectedOption: any = undefined; //option préselectionnée

  constructor() {}

  ngOnInit() {
    if (this.yesNoSelector) {
      this.selectOptions = [
        { value: true, name: 'Oui' },
        { value: false, name: 'Non' },
      ];
    }

    if (this.preselectedOption !== undefined)
      this.control.setValue(this.preselectedOption);
  }

  get isSelectInput(): boolean {
    return this.selectOptions.length > 0 || this.yesNoSelector;
  }

  formControlRequired(): boolean {
    if (!this.control?.validator) return false;
    const validator = this.control.validator({} as AbstractControl);
    return validator && validator['required'];
  }

  formControlInvalid(): boolean {
    return (
      (this.control?.invalid &&
        (this.control?.dirty || this.control?.touched)) ??
      false
    );
  }
}
