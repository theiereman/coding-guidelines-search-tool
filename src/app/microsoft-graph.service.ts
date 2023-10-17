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

    //GET /sites/custyburrus.sharepoint.com,63756e78-963f-4d88-b223-d59fbe37f706,071b9c7a-e181-4a2e-a512-0a1fa7611824
    //      /drives/b!eG51Yz-WiE2yI9Wfvjf3BnqcGweB4S5KpRIKH6dhGCQ-kgyuDTQLQry6tNoAkiUJ
    //        /items/01LP6ZGN6CGSAE7KWF65FYPI5BL5VIK472/workbook/worksheets

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
