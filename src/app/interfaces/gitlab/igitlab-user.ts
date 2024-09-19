export interface IGitlabUser {
  id: number;
  username: string;
  name: string;
  state: string;
  locked: boolean;
  avatar_url: string;
  web_url: string;
}
