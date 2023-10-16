import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthService } from './auth.service';
import { EMPTY, Observable, catchError, from, map, of } from 'rxjs';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { GRAPH_API_IDS } from './constants/graph-api.constants';

@Injectable({
  providedIn: 'root'
})
export class MicrosoftGraphService {
  constructor(
    private authService: AuthService
  ) {}

  getWorksheets():Observable<MicrosoftGraph.WorkbookWorksheet[]> {
    if (!this.authService.graphClient) {
      console.error('Graph service uninitialized')
      return of([]);
    }

    //GET /sites/ms_site_id
    //      /drives/ms_drive_id
    //        /items/ms_workbook_id/workbook/worksheets

    let worksheetNames:Observable<MicrosoftGraph.WorkbookWorksheet[]> = from(this.authService.graphClient
      .api(`/sites/${GRAPH_API_IDS.siteId}/drives/${GRAPH_API_IDS.driveId}/items/${GRAPH_API_IDS.codingGuidelineWorkbookItemId}/workbook/worksheets`)
      .get()).pipe(
        catchError((err) => {
          console.error(err);
          return of([]);
        })
      );

    return worksheetNames;
  }

  getWorksheetsNames():Observable<string[]> {
    return this.getWorksheets().pipe(
      map((res) => {
        return res.map((worksheet:MicrosoftGraph.WorkbookWorksheet) => { return worksheet.name as string; })
      }),
      catchError((err) => {
        console.error(err);
        return of([]);
      })
    );
  }
}
