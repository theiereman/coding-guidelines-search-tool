export interface IGitlabIssue {
  author: string;
  description: string;
  state: string;
  assignee: string;
  labels: string[];
  id: number;
  title: string;
  updated_at: string;
  created_at: string;
  closed_at: string;
}
