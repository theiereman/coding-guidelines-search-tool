import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

//valide la selection des milestones
export const validateMilestonesSelection: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const selectedMilestones = control.value;
  return selectedMilestones && selectedMilestones.length > 0
    ? null
    : { noMilestonesSelected: true };
};
