import { IGitlabUser } from './igitlab-user';

export interface IGitlabIssue {
  author: string;
  description: string;
  state: string;
  assignee?: IGitlabUser;
  labels: string[];
  id: number;
  iid: number;
  title: string;
  updated_at: string;
  created_at: string;
  closed_at: string;
  web_url: string;
}
