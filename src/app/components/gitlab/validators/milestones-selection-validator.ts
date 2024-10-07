import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const validateMilestonesSelection: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const selectedMilestones = control.value;
  return selectedMilestones && selectedMilestones.length > 0
    ? null
    : { noMilestonesSelected: true };
};
