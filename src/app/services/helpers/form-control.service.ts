import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

@Injectable()
export class FormControlService {
  constructor() {}

  formControlInvalid(formControl: AbstractControl): boolean;
  formControlInvalid(controlName: string, controlGroup: FormGroup): boolean;

  formControlInvalid(
    arg1: AbstractControl | string,
    arg2?: FormGroup
  ): boolean {
    if (arg1 instanceof AbstractControl) {
      return arg1.invalid && (arg1.dirty || arg1.touched);
    } else if (typeof arg1 === 'string' && arg2) {
      const control = arg2.get(arg1);
      return (control?.invalid && (control.dirty || control.touched)) ?? true;
    }
    return true;
  }
}
