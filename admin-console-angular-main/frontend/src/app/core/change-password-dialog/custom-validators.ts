import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
 
export class CustomValidators {

  static passwordMatchValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const formGroup = group as any;
 
      const password = formGroup.get(passwordKey);
      const confirmPassword = formGroup.get(confirmPasswordKey);

      if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        return { passwordsMismatch: true }; 
      }
      return null;
    };
  }
}