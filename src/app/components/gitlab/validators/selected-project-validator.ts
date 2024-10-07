import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';

export function validateProjectSelection(
  control: AbstractControl
): ValidationErrors | null {
  const selectedProject = control.value as IGitlabIssue | null;
  return selectedProject ? null : { noProjectSelected: true };
}
