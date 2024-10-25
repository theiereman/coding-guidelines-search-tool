import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-input-slot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-slot.component.html',
})
export class NewIssueInputSlotComponent {
  @Input({ required: true }) label: string = '';
  @Input() required: boolean = false;
}
