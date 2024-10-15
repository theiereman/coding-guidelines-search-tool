import { environment } from 'src/environments/environment';

export const GITLAB = {
  APP_ID: environment.GITLAB_APP_ID,

  ID_PROJET_REINTEGRATION: environment.GITLAB_ID_PROJET_REINTEGRATION,
  ID_PROJET_SUIVI_GENERAL: environment.GITLAB_ID_PROJET_SUIVI_GENERAL,
  ID_PROJET_CORRECTIONS_DIVERSES:
    environment.GITLAB_ID_PROJET_CORRECTIONS_DIVERSES,

  BASE_URI: environment.GITLAB_APP_BASE_URI,
  API_URI: `${environment.GITLAB_APP_BASE_URI}/api/v4`,
  AUTH_URI: `${environment.GITLAB_APP_BASE_URI}/oauth/authorize`,
  TOKEN_URI: `${environment.GITLAB_APP_BASE_URI}/oauth/token`,

  ACCESS_TOKEN_ITEM: 'gitlab_access_token',
  REFRESH_TOKEN_ITEM: 'gitlab_refresh_token',
  STATE_ITEM: 'gitlab_state',
  CODE_VERIFIER_ITEM: 'gitlab_code_verifier',
};
