import { name } from '@azure/msal-angular/packageMetadata';

export const BUG_LABEL = {
  name: 'bug',
  color: '#d9534f',
  text_color: '#ffffff',
};

export const DEV_STANDARD_LABEL = {
  name: 'dev standard',
  color: '#428bca',
  text_color: '#ffffff',
};

export const DEV_SPECIFIQUE_LABEL = {
  name: 'dev spécifique',
  color: '#7f8c8d',
  text_color: '#ffffff',
};

export const QUOI_DE_NEUF_LABEL = {
  name: 'quoi de neuf',
  color: '#8e44ad',
  text_color: '#ffffff',
};

export const MODIF_ANALYSE_LABEL = {
  name: "modif d'analyse",
  color: '#d10069',
  text_color: '#ffffff',
};

export interface IGitlabLabel {
  id?: number;
  name: string;
  color: string;
  text_color: string;
  description?: string;
  description_html?: string;
  open_issues_count?: number;
  closed_issues_count?: number;
  open_merge_requests_count?: number;
  subscribed?: boolean;
  priority?: number;
  is_project_label?: boolean;
}
