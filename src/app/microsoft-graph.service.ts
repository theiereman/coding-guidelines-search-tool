import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthService } from './auth.service';
import { EMPTY, Observable, catchError, from, map, merge, mergeMap, of, tap } from 'rxjs';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { GRAPH_API_IDS } from './constants/graph-api.constants';
import { ICodingGuidelineItem } from './icoding-guideline-item';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftGraphService {
  constructor(
    private authService: AuthService
  ) {}

  //renvoie toutes les feuilles du document Excel
  private getWorksheets():Observable<MicrosoftGraph.WorkbookWorksheet[]> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized')
      return of([]);
    }

    //GET /sites/ms_site_id
    //      /drives/ms_drive_id
    //        /items/ms_workbook_id/workbook/worksheets

    let worksheets:Observable<MicrosoftGraph.WorkbookWorksheet[]> = from(this.authService.graphClient
      .api(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets`)
      .get()).pipe(
        map(res => res.value),
        catchError((err) => {
          console.error(err);
          return of([]);
        })
      );

    return worksheets;
  }

  //renvoie toutes les cellules d'une feuille Excel
  getWorksheetCompleteRange(worksheetName: string):Observable<MicrosoftGraph.WorkbookRange | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized')
      return of(undefined);
    }

    console.log(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets/${worksheetName}/usedRange?$select=values`)

    return from(this.authService.graphClient
      .api(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets/${worksheetName}/usedRange?$select=values`)
      .get())
      .pipe(
        tap(res => console.log(res)),
        catchError((err) => {
          console.error(err);
          return of(undefined);
        })
      );
  }

  getCodingGuidelinesFromWorksheet(worksheetName:string) : Observable<ICodingGuidelineItem[]> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized')
      return of([]);
    }

    console.log(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets/${worksheetName}/usedRange?$select=values`)

    return from(this.authService.graphClient
      .api(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets/${worksheetName}/usedRange?$select=values`)
      .get())
      .pipe(
        map((range:MicrosoftGraph.WorkbookRange) => {
          console.log(range)
          //ignore la première ligne des entêtes
          return range.values.slice(1).map((row:string[]) => {
            let codingGuidelineValue:ICodingGuidelineItem = {
              name:row[0],
              prefix:row[1],
              case:row[2],
              exemple:row[3],
              sheetName:worksheetName
            }
            return codingGuidelineValue
          })
        }),
        catchError((err) => {
          console.error(err);
          return of([]);
        })
      );
  }

  //renvoie le nom de toutes les feuilles du document
  getWorksheetsNames():Observable<string[]> {
    return this.getWorksheets().pipe(
      map(worksheetsArray => worksheetsArray.map(res => res.name!)),
      catchError((err) => {
        console.error(err);
        return of([]);
      })
    );
  }
}
