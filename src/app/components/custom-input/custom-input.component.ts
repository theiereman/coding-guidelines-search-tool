import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  NgModule,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './custom-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true,
    },
  ],
})
export class CustomInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label: string = '';
  @Input() disabled: boolean = false;
  @Input() control: FormControl = new FormControl('');
  @Input() isTextArea: boolean = false;

  inputRandomId = Math.random().toString(36).substring(2, 15);
  private _value: string = '';

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
    this._onChange(value);
    this._onTouched();
  }

  constructor() {}

  onInput(event: Event): void {
    console.log('onInput : ', event);
    const target = event.target as HTMLInputElement;
    this._onChange(target.value);
    this._onTouched();
  }

  writeValue(value: string): void {
    console.log('writeValue : ', value);
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
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
