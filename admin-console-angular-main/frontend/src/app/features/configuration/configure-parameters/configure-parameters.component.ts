import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ConfigService } from '../../../core/services/config.service';
import { ConfigResponse, ConfigUpdate, WebhookMapping } from '../../../shared/models/config.model';
import { ImageBannerComponent } from '../../../shared/components/image-banner/image-banner.component';
import { WebhookDialogComponent } from '../../../core/webhook-dialog/webhook-dialog.component';

interface ConfigField {
  label: string;
  controlName: string;
  type: string;
  tooltip: string;
  placeholder: string;
}

export function commaSeparatedEmailValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      return null;
    }
    const emails = (control.value as string).split(/[,\s]+/).map(e => e.trim()).filter(e => e.length > 0);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    const invalidEmails = emails.filter(email => !emailRegex.test(email));

    return invalidEmails.length > 0 ? { 'invalidEmailList': { value: control.value } } : null;
  };
}

export function commaSeparatedUrlValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) {
      return null;
    }
    const urls = (control.value as string).split(/[,\s]+/).map(e => e.trim()).filter(e => e.length > 0);
    const urlRegex = /^(http|https):\/\/[^ "\s]+$/;

    const invalidUrls = urls.filter(url => !urlRegex.test(url));

    return invalidUrls.length > 0 ? { 'invalidUrlList': { value: control.value } } : null;
  };
}

export function jiraApiTokenValidator(): ValidatorFn {
  const tokenRegex = /^[A-Za-z0-9:_=–-]{24,}$/;

  return (control: AbstractControl): { [key: string]: any } | null => {
    const raw = control.value;

    // Allow empty value to be handled by Validators.required if present
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    const value = String(raw).trim(); // Trim to avoid leading/trailing whitespace issues

    // Quick fail on spaces anywhere
    if (/\s/.test(value)) {
      return { invalidJiraToken: { reason: 'containsSpaces', value: raw } };
    }

    // Validate format
    if (!tokenRegex.test(value)) {
      return { invalidJiraToken: { reason: 'formatOrLength', value: raw } };
    }

    return null;
  };
}

@Component({
  standalone: true,
  selector: 'app-configure-parameters',
  templateUrl: './configure-parameters.component.html',
  styleUrls: ['./configure-parameters.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ImageBannerComponent,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule
  ],
})
export class ConfigureParametersComponent implements OnInit {
  configForm!: FormGroup;
  isLoading = true;
  message: { type: 'success' | 'error' | 'info'; text: string } | null = null;

  private currentConfigId: string | undefined;
  private initialFormValue: any = {};

  isEditing = false;
  hideJiraToken = true;

  displayedColumns: string[] = ['channel_name', 'webhook_url', 'actions'];
  webhookDataSource = new MatTableDataSource<WebhookMapping>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  fieldData: ConfigField[] = [
    { label: 'Job Frequency (Minutes)', controlName: 'job_frequency', type: 'number', tooltip: 'How often the synchronization job runs.', placeholder: "e.g. 10" },
    { label: 'Sender Email', controlName: 'outlook_email', type: 'email', tooltip: 'Monitoring System sender email', placeholder: "e.g. ControlUp@bitzer.de" },
    { label: 'JIRA Base URL', controlName: 'jira_base_url', type: 'url', tooltip: 'Base URL for your JIRA instance (e.g., https://bitzer.atlassian.net).', placeholder: "https://baseurl.com" },
    { label: 'JIRA API Token', controlName: 'jira_api_token', type: 'password', tooltip: 'API token generated from your JIRA profile.', placeholder: "uaioe2183791Ahwjqebhqjw" },
  ];

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadData();
    this.loadWebhooks();
  }

  initForm(): void {
    const controls: { [key: string]: any } = {};
    this.fieldData.forEach(field => {
      let validators = [Validators.required];
      if (field.controlName === 'outlook_email') {
        validators.push(commaSeparatedEmailValidator());
      } else if (field.controlName === 'teams_webhook') {
        validators.push(commaSeparatedUrlValidator());
      }
      else if (field.controlName === 'jira_api_token') {
        validators.push(jiraApiTokenValidator());
      } else if (field.type === 'number') {
        validators.push(Validators.min(1), Validators.pattern(/^\d+$/));
      } else if (field.type === 'email') {
        validators.push(Validators.email);
      } else if (field.type === 'url') {
        validators.push(Validators.pattern(/^(http|https):\/\/[^ "]+$/));
      }
      controls[field.controlName] = [{ value: '', disabled: true }, validators];
    });

    this.configForm = this.fb.group(controls);
  }

  loadData(): void {
    this.isLoading = true;
    this.message = { type: 'info', text: 'Attempting to load configuration...' };
    this.configService.loadConfiguration().subscribe({
      next: (config: ConfigResponse) => {
        this.configForm.patchValue(config);
        this.currentConfigId = config.id;

        this.initialFormValue = this.configForm.getRawValue();

        this.isLoading = false;
        this.message = { type: 'success', text: 'Configuration loaded successfully.' };
        console.log("Configuration loaded successfully:", config);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.message = { type: 'error', text: 'Access Denied. Your session may have expired or your role is not allowed.' };
        } else {
          this.message = { type: 'error', text: err.error?.detail || 'Failed to load configuration. Check your network and API server logs.' };
        }
        console.error('Config load failed. Status:', err.status, 'Response:', err.error);
      }
    });
  }

  loadWebhooks(): void {
    this.configService.getWebhooks().subscribe(data => {
      this.webhookDataSource.data = data;
      this.webhookDataSource.paginator = this.paginator;
    });
  }

  openWebhookDialog(mapping?: WebhookMapping): void {
    const dialogRef = this.dialog.open(WebhookDialogComponent, {
      width: '500px',
      data: mapping
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (mapping?.id) {
          this.configService.updateWebhook(mapping.id, result).subscribe(() => this.loadWebhooks());
        } else {
          this.configService.addWebhook(result).subscribe(() => this.loadWebhooks());
        }
      }
    });
  }

  openAddDialog(): void {
    this.openWebhookDialog();
  }

  onEditWebhook(element: WebhookMapping): void {
    this.openWebhookDialog(element);
  }

  onDeleteWebhook(id: string): void {
    if (confirm('Are you sure you want to delete this mapping?')) {
      this.configService.deleteWebhook(id).subscribe(() => this.loadWebhooks());
    }
  }

  onEdit(): void {
    this.isEditing = true;
    this.configForm.enable();
    this.configForm.markAsPristine();
    this.message = { type: 'info', text: 'Configuration is now editable.' };
  }

  onCancel(): void {
    this.isEditing = false;
    this.configForm.patchValue(this.initialFormValue);
    this.configForm.disable();
    this.configForm.markAsPristine();
    this.message = { type: 'info', text: 'Loaded initial configurations.' };
  }

  toggleJiraTokenVisibility(): void {
    this.hideJiraToken = !this.hideJiraToken;
  }

  onSubmit(): void {
    this.message = null;
    if (this.configForm.invalid) {
      this.message = { type: 'error', text: 'Please fill out all required fields correctly.' };
      this.configForm.markAllAsTouched();
      return;
    }
    this.message = { type: 'info', text: 'Saving configuration...' };

    const updateData: ConfigUpdate = this.configForm.getRawValue();
    this.configService.saveConfiguration(updateData).subscribe({
      next: (newConfig: ConfigResponse) => {
        this.currentConfigId = newConfig.id;

        this.initialFormValue = this.configForm.getRawValue();

        this.isEditing = false;
        this.configForm.disable();
        this.message = { type: 'success', text: 'Configuration saved successfully!' };
        this.configForm.markAsPristine();
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.message = { type: 'error', text: 'Access Denied. You do not have permission to save.' };
        } else {
          this.message = { type: 'error', text: err.error?.detail || 'Failed to save configuration.' };
        }
        console.error('Config save failed. Status:', err.status, 'Response:', err.error);
      }
    });
  }

  onReset(): void {
    this.message = null;
    this.configForm.reset();
    this.configForm.patchValue({
      job_frequency: null,
      outlook_email: '',
      jira_base_url: '',
      jira_api_token: '',
    });

    this.configForm.markAsPristine();
    this.message = { type: 'info', text: 'Configuration form fields cleared.' };
  }
}