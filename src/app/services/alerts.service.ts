import { Injectable } from '@angular/core';
import { IAlert, AlertType } from '../interfaces/ialert';

@Injectable({
  providedIn: 'root'
})

export class AlertsService {
  alerts: IAlert[] = [];

  addError(message: string, debug?: string) {
    let newAlert = {message: message, type: AlertType.Error};
    this.alerts.push(newAlert);
    setTimeout(() => {
      this.remove(newAlert);
    }, 3000);
  }

  remove(alert: IAlert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
}