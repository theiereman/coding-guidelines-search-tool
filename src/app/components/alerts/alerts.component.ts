import { Component, OnInit, Optional } from '@angular/core';
import { AlertsService } from '../../services/alerts.service';
import { IAlert, AlertType } from '../../interfaces/ialert';
import {
  trigger,
  query,
  transition,
  style,
  stagger,
  animate,
  animateChild,
} from '@angular/animations';
import { NgClass, NgFor } from '@angular/common';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: [],
  animations: [
    trigger('list', [
      transition('* => *', [
        query('@animate', stagger(100, animateChild()), { optional: true }),
      ]),
    ]),
    trigger('animate', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50%)' }),
        animate('.5s ease', style({ opacity: 1, transform: 'translateY(0))' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate(
          '.5s ease',
          style({ opacity: 0, transform: 'translateY(-50%)' })
        ),
      ]),
    ]),
  ],
  standalone: true,
  imports: [NgFor, NgClass],
})
export class AlertsComponent implements OnInit {
  alertEnum = AlertType;
  constructor(public alertsService: AlertsService) {}

  ngOnInit() {}

  close(alert: IAlert) {
    this.alertsService.remove(alert);
  }
}
