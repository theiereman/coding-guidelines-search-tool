import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { SelectOption } from 'src/app/interfaces/select-option';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-input.component.html',
})
export class CustomInputComponent {
  @Input({ required: true }) label: string = '';
  @Input() selectOptions: SelectOption[] = [];
  @Input() yesNoSelector: boolean = false;
  @Input() control: FormControl = new FormControl('');
  @Input() isMultiline: boolean = false;

  yesNoOptions: SelectOption[] = [
    { value: true, name: 'Oui' },
    { value: false, name: 'Non' },
  ];

  constructor() {}

  get isSelectInput(): boolean {
    return this.selectOptions.length > 0;
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
