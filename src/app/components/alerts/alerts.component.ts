import { Component, OnInit } from '@angular/core';
import { AlertsService } from '../../alerts.service';
import { Alert } from '../../alert';
import { trigger,query, transition, style, stagger, animate } from '@angular/animations';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css'],
  animations: [
    trigger('listInOut', [
      transition(':enter', [
        query('*', [
          style({ opacity: 0, transform: 'translateY(50%)' }),
          stagger(100, [
            animate('1s ease', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ]),
      transition(':leave', [
        query('*', [
          style({ opacity: 1, transform: 'translateY(0)' }),
          stagger(100, [
            animate('.5s ease', style({ opacity: 0, transform: 'translateY(-50%)' }))
          ])
        ])
      ])
    ])],
})
export class AlertsComponent implements OnInit {

  constructor(public alertsService: AlertsService) { }

  ngOnInit() {
  }

  close(alert: Alert) {
    this.alertsService.remove(alert);
  }
}