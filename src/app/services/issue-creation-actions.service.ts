import { Injectable } from '@angular/core';
import { IIssueCreationAction } from '../interfaces/iissue-creation-action';
import { BehaviorSubject, Observable } from 'rxjs';

//liste des actions effectuées lors de la création d'une issue de réintégration
@Injectable({
  providedIn: 'root',
})
export class IssueCreationActionsService {
  private _actionsList: IIssueCreationAction[] = [];
  private actionsListsubject$ = new BehaviorSubject<IIssueCreationAction[]>([]);

  constructor() {}

  private get actionsList(): IIssueCreationAction[] {
    return [...this._actionsList];
  }

  getActionsListObservable(): Observable<IIssueCreationAction[]> {
    return this.actionsListsubject$.asObservable();
  }

  private set actionsList(value: IIssueCreationAction[]) {
    this._actionsList = value;
    this.actionsListsubject$.next(this._actionsList);
  }

  addAction(title: string): IIssueCreationAction {
    const action: IIssueCreationAction = {
      title,
      hasResult: false,
      isOk: false,
    };

    this.actionsList = [...this.actionsList, action];
    return action;
  }

  addErrorResult(title: string): IIssueCreationAction {
    const action: IIssueCreationAction = {
      title,
      hasResult: true,
      isOk: false,
    };

    this.actionsList = [...this.actionsList, action];
    return action;
  }

  setActionsResult(action: IIssueCreationAction, isOk: boolean) {
    action.hasResult = true;
    action.isOk = isOk;
  }

  allActionsAreFinished(): boolean {
    return !this.actionsList.some((action) => !action.hasResult);
  }

  reset() {
    this.actionsList = [];
  }
}
