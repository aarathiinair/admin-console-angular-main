import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CertificateService } from '../../../core/services/certificate.service';
import { Certificate, CertificateStatus } from '../../../shared/models/certificate.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ImageBannerComponent } from '../../../shared/components/image-banner/image-banner.component';
import { ResizableDirective } from '../../../shared/directives/column-resize.directive';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule, MatSnackBarModule,
    MatDialogModule, MatProgressSpinnerModule, ImageBannerComponent, ResizableDirective,
    MatTooltipModule
  ],
  templateUrl: './certificate-watcher.component.html',
  styleUrls: ['./certificate-watcher.component.scss']
})
export class CertificateComponent implements OnInit {
  dataSource = new MatTableDataSource<Certificate>([]);
  
  displayedColumns: string[] = [
    'certificate_name', 'expiration_date', 'description', 
    'usage', 'calculated_status', 'responsible_group', 
    'teams_channel', 'effected_users', 'jira_ticket_id', 'actions'
  ];

  isAdding = false;
  isEditing = false;
  isLoading = false;
  
  currentCertId: number | null = null;
  
  statusOptions: CertificateStatus[] = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'];
  selectedStatusFilter: string = '';
  totalRows = 0;
  pageSize = 10;
  currentPage = 0;

  certificateForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private certService: CertificateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCertificates();
  }

  initForm() {
    this.certificateForm = this.fb.group({
      certificate_name: ['', Validators.required],
      expiration_date: [null, Validators.required],
      description: [''],
      usage: [''],
      responsible_group: ['', Validators.required],
      teams_channel: ['', Validators.required],
      effected_users: ['']
    });
  }

  loadCertificates() {
    this.isLoading = true;
    this.certService.getCertificates(this.currentPage + 1, this.pageSize, this.selectedStatusFilter)
      .subscribe({
        next: (res) => {
          this.dataSource.data = res.items;
          this.totalRows = res.total_rows;
          this.isLoading = false;
        },
        error: (err) => {
          this.snackBar.open('Failed to load certificates', 'Dismiss', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  startAdd() {
    this.isAdding = true;
    this.isEditing = false;
    this.certificateForm.reset();
  }

  startEdit(cert: Certificate) {
    this.isEditing = true;
    this.isAdding = false;
    
    this.currentCertId = cert.id;
    
    this.certificateForm.patchValue({
      certificate_name: cert.certificate_name,
      expiration_date: new Date(cert.expiration_date),
      description: cert.description,
      usage: cert.usage,
      responsible_group: cert.responsible_group,
      teams_channel: cert.teams_channel,
      effected_users: cert.effected_users
    });
  }

  cancel() {
    this.isAdding = false;
    this.isEditing = false;
    this.currentCertId = null;
    this.certificateForm.reset();
  }

  resetForm() {
    this.certificateForm.reset();
  }

  saveCertificate() {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.certificateForm.value;
    
    const payload = {
      ...formValue,
      expiration_date: formValue.expiration_date.toISOString()
    };

    const request = this.isEditing && this.currentCertId
      ? this.certService.updateCertificate(this.currentCertId, payload)
      : this.certService.createCertificate(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(`Certificate ${this.isEditing ? 'updated' : 'added'} successfully`, 'Dismiss', { duration: 3000 });
        this.cancel();
        this.loadCertificates();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.detail || 'Save failed', 'Dismiss', { duration: 5000 });
      }
    });
  }

  deleteCertificate(cert: Certificate) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete ${cert.certificate_name}?`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.certService.deleteCertificate(cert.id).subscribe({
          next: () => {
            this.snackBar.open('Certificate deleted', 'Dismiss', { duration: 3000 });
            this.loadCertificates();
          },
          error: () => this.isLoading = false
        });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCertificates();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadCertificates();
  }
}