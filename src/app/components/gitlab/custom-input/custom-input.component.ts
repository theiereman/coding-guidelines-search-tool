import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { SelectOption } from 'src/app/interfaces/select-option';
import { NewIssueInputSlotComponent } from '../new-issue/input-slot/input-slot.component';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NewIssueInputSlotComponent],
  templateUrl: './custom-input.component.html',
})
export class CustomInputComponent {
  @Input({ required: true }) label: string = '';
  @Input() selectOptions: SelectOption[] = [];
  @Input() yesNoSelector: boolean = false;
  @Input() control: FormControl = new FormControl('');
  @Input() isMultiline: boolean = false;
  @Input() preselectedOption: any = undefined;

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
