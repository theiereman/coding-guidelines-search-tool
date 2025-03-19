import { environment } from 'src/environments/environment';

export const GRAPH_API = {
  siteId: environment.MS_SITE_ID,
  driveId: environment.MS_DRIVE_ID,
  codingGuidelineWorkbookItemId: environment.MS_WORKBOOK_ID,
  clientId: environment.MS_CLIENT_ID,
  tenantId: environment.MS_TENANT_ID,

  worksheetLink: environment.MS_WORKSHEET_LINK,
};
