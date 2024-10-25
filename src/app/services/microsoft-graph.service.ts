import { Injectable } from '@angular/core';
import { MicrosoftGraphAuthService } from './microsoft-graph-auth.service';
import {
  Observable,
  catchError,
  filter,
  from,
  map,
  mergeMap,
  switchMap,
  of,
  reduce,
  concatMap,
} from 'rxjs';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
import { GRAPH_API } from '../constants/graph-api.constants';
import { ICodingGuidelineItem } from '../interfaces/icoding-guideline-item';
import { AlertsService } from './alerts.service';
import { capitalizeFirstLetter } from '../helpers/strings-helper';

@Injectable({
  providedIn: 'root',
})
export class MicrosoftGraphService {
  constructor(
    private authService: MicrosoftGraphAuthService,
    private alertsService: AlertsService,
  ) {}

  private getWorksheets(): Observable<MicrosoftGraph.WorkbookWorksheet[]> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized');
      this.alertsService.addError('Graph service uninitialized');
      return of([]);
    }

    let worksheets: Observable<MicrosoftGraph.WorkbookWorksheet[]> = from(
      this.authService.graphClient
        .api(
          `/sites/${GRAPH_API.siteId}/drives/${GRAPH_API.driveId}/items/${GRAPH_API.codingGuidelineWorkbookItemId}/workbook/worksheets`,
        )
        .get(),
    ).pipe(
      map((res) => res.value),
      catchError((err) => {
        console.error(err);
        this.alertsService.addError(err);
        return of([]);
      }),
    );

    return worksheets;
  }

  private getCodingGuidelinesFromWorksheet(
    worksheetName: string,
  ): Observable<ICodingGuidelineItem[]> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized');
      this.alertsService.addError('Graph service uninitialized');
      return of([]);
    }

    return from(
      this.authService.graphClient
        .api(
          `/sites/${GRAPH_API.siteId}/drives/${GRAPH_API.driveId}/items/${GRAPH_API.codingGuidelineWorkbookItemId}/workbook/worksheets/${worksheetName}/usedRange?$select=values`,
        )
        .get(),
    ).pipe(
      map((range: MicrosoftGraph.WorkbookRange) => {
        //ignore la première ligne des entêtes
        return range.values.slice(1).map((row: string[]) => {
          let codingGuidelineValue: ICodingGuidelineItem = {
            name: capitalizeFirstLetter(row[0]),
            prefix: row[1],
            case: row[2],
            example: row[3],
            sheetName: worksheetName,
          };
          return codingGuidelineValue;
        });
      }),
      catchError((err) => {
        console.error(err);
        this.alertsService.addError(err);
        return of([]);
      }),
    );
  }

  getWorksheetsNames(): Observable<string[]> {
    return this.getWorksheets().pipe(
      map((worksheetsArray) => worksheetsArray.map((res) => res.name!)),
      catchError((err) => {
        console.error(err);
        this.alertsService.addError(err);
        return of([]);
      }),
    );
  }

  //renvoie toutes les valeurs de toutes les feuilles excel du document sharepoint
  getAllCodingGuidelines(): Observable<ICodingGuidelineItem[]> {
    return this.getWorksheetsNames().pipe(
      mergeMap((worksheetsNames) => {
        return from(worksheetsNames).pipe(
          filter((name) => name !== 'WIP'),
          mergeMap((name) => {
            return this.getCodingGuidelinesFromWorksheet(name);
          }),
        );
      }),
      reduce((res, one) => [...res, ...one]),
    );
  }
}
