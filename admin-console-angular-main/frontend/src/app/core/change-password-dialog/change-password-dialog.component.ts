import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomValidators } from './custom-validators';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit {
  passwordForm!: FormGroup;

  currentPasswordType: string = 'password';
  newPasswordType: string = 'password';
  confirmPasswordType: string = 'password';

  private static getPatternValidator(regex: RegExp, errorKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      return regex.test(control.value) ? null : { [errorKey]: true };
    };
  }

  // Array of password validation rules
  validationRules = [
    { name: 'minLength', text: 'At least 8 characters', validator: Validators.minLength(8) },
    { name: 'uppercase', text: 'At least one uppercase letter', validator: ChangePasswordDialogComponent.getPatternValidator(/(?=.*[A-Z])/, 'uppercase') },
    { name: 'lowercase', text: 'At least one lowercase letter', validator: ChangePasswordDialogComponent.getPatternValidator(/(?=.*[a-z])/, 'lowercase') },
    { name: 'number', text: 'At least one number', validator: ChangePasswordDialogComponent.getPatternValidator(/(?=.*\d)/, 'number') },
    { name: 'special', text: 'At least one special character', validator: ChangePasswordDialogComponent.getPatternValidator(/(?=.*[^A-Za-z0-9])/, 'special') }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string }
  ) { }

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['',
        [
          Validators.required,
          ...this.validationRules.map(rule => rule.validator)
        ]
      ],
      confirmPassword: ['', Validators.required]
    }, {
      validators: [CustomValidators.passwordMatchValidator('newPassword', 'confirmPassword')]
    });
  }

  isRuleSatisfied(ruleName: string): boolean {
    const newPasswordControl = this.passwordForm.get('newPassword');
    if (!newPasswordControl || !newPasswordControl.value) {
      if (ruleName === 'minLength') {
        return (newPasswordControl?.value?.length ?? 0) >= 8;
      }
      return false;
    }

    return !newPasswordControl.hasError(ruleName);
  }

  toggleVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.currentPasswordType = this.currentPasswordType === 'password' ? 'text' : 'password';
    } else if (field === 'new') {
      this.newPasswordType = this.newPasswordType === 'password' ? 'text' : 'password';
    } else if (field === 'confirm') {
      this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
    }
  }

  onSave(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const payload = {
      current_password: this.passwordForm.value.currentPassword,
      new_password: this.passwordForm.value.newPassword
    };

    this.userService.updatePassword(this.data.userId, payload).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Password update failed:', err);
        alert(err.error?.detail || 'Failed to update password.');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}