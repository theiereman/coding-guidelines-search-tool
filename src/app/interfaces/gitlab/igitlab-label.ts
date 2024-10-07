export const BUG_LABEL_NAME = 'bug';
export const DEV_STANDARD_LABEL_NAME = 'dev standard';
export const DEV_SPECIFIQUE_LABEL_NAME = 'dev spécifique';
export const MODIF_ANALYSE_LABEL_NAME = "modif d'analyse";
export const QUOI_DE_NEUF_LABEL_NAME = 'quoi de neuf';

export interface IGitlabLabel {
  id: number;
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
