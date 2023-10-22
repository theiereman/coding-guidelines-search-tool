import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthService } from './auth.service';
import { EMPTY, Observable, catchError, combineLatest, combineLatestAll, concat, concatMap, filter, forkJoin, from, map, merge, mergeAll, mergeMap, of, reduce, switchMap, tap, toArray } from 'rxjs';
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

  private getCodingGuidelinesFromWorksheet(worksheetName:string) : Observable<ICodingGuidelineItem[]> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized')
      return of([]);
    }

    return from(this.authService.graphClient
      .api(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets/${worksheetName}/usedRange?$select=values`)
      .get())
      .pipe(
        map((range:MicrosoftGraph.WorkbookRange) => {
          //ignore la première ligne des entêtes
          return range.values.slice(1).map((row:string[]) => {
            let codingGuidelineValue:ICodingGuidelineItem = {
              name:row[0],
              prefix:row[1],
              case:row[2],
              example:row[3],
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

  getAllCodingGuidelines() : Observable<ICodingGuidelineItem[]> {
    return this.getWorksheetsNames().pipe(
      mergeMap((worksheetsNames) => {
        return from(worksheetsNames).pipe(
          filter(name => name !== 'WIP'),
          mergeMap((name) => {
            return this.getCodingGuidelinesFromWorksheet(name);
          })
        );
      }),
      reduce((res, one) => [...res, ...one])
    );
  }
}
