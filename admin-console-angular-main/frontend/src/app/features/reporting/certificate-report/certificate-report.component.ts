import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CertificateService } from '../../../core/services/certificate.service';
import { Certificate } from '../../../shared/models/certificate.model'; 

@Component({
  selector: 'app-certificate-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './certificate-report.component.html',
  styleUrls: ['./certificate-report.component.scss']
})
export class CertificateReportComponent implements OnInit {
  displayedColumns: string[] = [
    'certificate_name', 'expiration_date', 'calculated_status', 'responsible_group',
    'teams_channel', 'description', 'usage', 'jira_ticket_id', 'effected_users'
  ];
  
  dataSource = new MatTableDataSource<Certificate>([]);
  totalRows = 0;
  currentPageSize = 10;
  currentPageIndex = 0;
  
  isLoading = false;
  filterForm!: FormGroup;
  
  // Changed 'Valid' to 'ACTIVE' to match new schema
  statusOptions = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'];
  
  // Changed from teamOptions to responsibleGroupOptions
  responsibleGroupOptions = [
    'IBS - Dynamics 365', 
    'IBS - Mail Service', 
    'IBS - SDN', 
    'IBS-ROT', 
    'OI - Telecommunications', 
    'SAP Operations'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private certService: CertificateService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchData(); 
  }

  // Define Validator as an arrow function to ensure 'this' context if needed, 
  // though strictly not needed for this simple pure function.
  dateRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (start && end && start > end) {
      return { dateRangeInvalid: true };
    }
    return null;
  };

  initForm() {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      status: [''], 
      responsibleGroup: ['']  // Changed from 'team' to 'responsibleGroup'
    }, { validators: this.dateRangeValidator }); // Attach validator to the Form Group
  }

  fetchData() {
    // SECURITY GUARD: Stop execution if form is invalid (e.g. date range error)
    if (this.filterForm.invalid) return;

    this.isLoading = true;
    const filters = this.filterForm.value;
    
    const statusFilter = filters.status || ''; 
    const responsibleGroupFilter = filters.responsibleGroup || '';  // Changed from teamFilter
    const startDate = filters.startDate;
    const endDate = filters.endDate;

    this.certService.getCertificates(
      this.currentPageIndex + 1, 
      this.currentPageSize, 
      statusFilter,
      startDate,
      endDate,
      responsibleGroupFilter  // Changed parameter name
    ).subscribe({
        next: (res) => {
          this.dataSource.data = res.items;
          this.totalRows = res.total_rows;
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Failed to load report data', 'Dismiss', { duration: 3000 });
          this.isLoading = false;
        }
    });
  }

  handlePageChange(event: PageEvent) {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.fetchData();
  }

  handleSortChange(sortState: Sort) {
    const data = this.dataSource.data.slice();
    if (!sortState.active || sortState.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a: any, b: any) => {
      const isAsc = sortState.direction === 'asc';
      return this.compare(a[sortState.active], b[sortState.active], isAsc);
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  onDownload() {
    // SECURITY GUARD: Stop execution if form is invalid
    if (this.filterForm.invalid) return;

    this.isLoading = true;
    const filters = this.filterForm.value;

    const statusFilter = filters.status || ''; 
    const responsibleGroupFilter = filters.responsibleGroup || '';  // Changed from teamFilter
    const startDate = filters.startDate;
    const endDate = filters.endDate;

    this.certService.downloadCertificates(statusFilter, startDate, endDate, responsibleGroupFilter)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `certificates_report_${new Date().getTime()}.csv`;
          document.body.appendChild(a);
          a.click();
          
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.isLoading = false;
          this.snackBar.open('Report downloaded successfully!', 'Dismiss', { duration: 3000 });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Download failed', 'Dismiss', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
}