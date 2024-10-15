import { Injectable } from '@angular/core';
import { IAlert, AlertType } from '../interfaces/ialert';

//contient la liste des alertes
@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  alerts: IAlert[] = [];

  addSuccess(message: string, autoRemove: boolean = true) {
    let newAlert = { message: message, type: AlertType.Success };
    this.alerts.push(newAlert);
    if (autoRemove) {
      setTimeout(() => {
        this.remove(newAlert);
      }, 5000);
    }
  }

  addError(message: string, autoRemove: boolean = true) {
    let newAlert = { message: message, type: AlertType.Error };
    this.alerts.push(newAlert);
    if (autoRemove) {
      setTimeout(() => {
        this.remove(newAlert);
      }, 5000);
    }
  }

  remove(alert: IAlert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
}
