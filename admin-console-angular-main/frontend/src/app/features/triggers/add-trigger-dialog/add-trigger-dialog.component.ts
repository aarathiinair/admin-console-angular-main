import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { Trigger } from '../../../shared/models/trigger.model';

interface DialogData {
  currentTrigger: Trigger | undefined;
  existingTriggers: Trigger[];
}

@Component({
  selector: 'app-add-trigger-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule
  ],
  templateUrl: './add-trigger-dialog.component.html',
  styleUrls: ['./add-trigger-dialog.component.scss']
})
export class AddTriggerDialogComponent implements OnInit {
  triggerForm!: FormGroup;
  isEditMode: boolean = false;
  errorMessage: string = '';

  priorityOptions = ['P1', 'P2', 'P3'];
  actionableOptions = ['Actionable', 'Informational'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddTriggerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: DialogData
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.dialogData.currentTrigger;
    const data = this.dialogData.currentTrigger;

    this.triggerForm = this.fb.group({
      trigger_name: [data?.trigger_name || '', Validators.required],
      category: [data?.category || '', Validators.required],
      actionable: [data?.actionable || 'Actionable', Validators.required],
      priority: [data?.priority || 'P1', Validators.required], 
      team: [data?.team || ''],
      department: [data?.department || ''],
      recommended_action: [data?.recommended_action || ''],
      responsible_persons: [data?.responsible_persons || '']
    });

    this.triggerForm.valueChanges.subscribe(() => {
      if (this.errorMessage) this.errorMessage = '';
    });

    this.triggerForm.get('actionable')?.valueChanges.subscribe(value => {
      const priorityControl = this.triggerForm.get('priority');
      if (value === 'Informational') {
        priorityControl?.setValue('Informational');
        priorityControl?.clearValidators();
      } else {
        if (priorityControl?.value === 'Informational') priorityControl?.setValue('P1');
        priorityControl?.setValidators([Validators.required]);
      }
      priorityControl?.updateValueAndValidity();
    });
  }

  private checkCompositeKey(newName: string, newCategory: string): boolean {
    const newKey = `${newName.toLowerCase()}::${newCategory.toLowerCase()}`;
    return !this.dialogData.existingTriggers.some(t => {
      if (this.isEditMode && t.id === this.dialogData.currentTrigger?.id) return false;
      return `${t.trigger_name.toLowerCase()}::${t.category.toLowerCase()}` === newKey;
    });
  }

  onSave(): void {
    if (this.triggerForm.invalid) return;
    const formValue = this.triggerForm.getRawValue();

    if (!this.checkCompositeKey(formValue.trigger_name, formValue.category)) {
      this.errorMessage = `The Trigger "${formValue.trigger_name}" with Category "${formValue.category}" already exists.`;
      return;
    }

    this.dialogRef.close({ 
      newTrigger: formValue, 
      isEdit: this.isEditMode 
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}