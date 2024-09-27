export interface IGitlabMilestone {
  id: number;
  title: string;
  description?: string;
  state: string;
}

export const FAKE_STATUS = 'fake';
export const OPEN_STATUS = 'active';
export const CLOSED_STATUS = 'closed';
