import { Injectable } from '@angular/core';
import { Alert, AlertType } from './alert';

@Injectable({
  providedIn: 'root'
})

export class AlertsService {
  alerts: Alert[] = [];

  addError(message: string, debug?: string) {
    let newAlert = {message: message, type: AlertType.Error};
    this.alerts.push(newAlert);
    setTimeout(() => {
      this.remove(newAlert);
    }, 3000);
  }

  remove(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
}