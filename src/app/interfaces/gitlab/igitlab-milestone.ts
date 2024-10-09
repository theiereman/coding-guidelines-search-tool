export interface IGitlabMilestone {
  id?: number;
  iid?: number;
  title: string;
  description?: string;
  state?: string;
}

export interface IGitlabEditMilestone extends IGitlabMilestone {
  state_event: string;
}

export const FAKE_STATUS = 'fake';
export const OPEN_STATUS = 'active';
export const CLOSED_STATUS = 'closed';
