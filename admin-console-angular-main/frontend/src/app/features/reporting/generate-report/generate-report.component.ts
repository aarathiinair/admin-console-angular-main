import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors, FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ReportDataRow, ReportRequest } from '../../../shared/models/report.model';
import { ReportService } from '../../../core/services/report.service';
import { ImageBannerComponent } from '../../../shared/components/image-banner/image-banner.component';
import { CertificateReportComponent } from '../certificate-report/certificate-report.component';

const MAX_DATE_DIFF_MS = 31 * 24 * 60 * 60 * 1000;
const UI_DISPLAY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-generate-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatIconModule, MatSnackBarModule,
    ImageBannerComponent,
    CertificateReportComponent
  ],
  templateUrl: './generate-report.component.html',
  styleUrls: ['./generate-report.component.scss']
})
export class GenerateReportComponent implements OnInit, AfterViewInit {
  
  // --- Source Selection State ---
  selectedSource: string | null = null;
  availableSources: string[] = ['ControlUp', 'Certificate Watcher', 'PRTG', 'IMC', 'SAP'];

  // --- Existing ControlUp Logic State ---
  reportForm!: FormGroup;
  dataSource = new MatTableDataSource<ReportDataRow>([]);
  displayedColumns: string[] = [
    'received_at', 'sender', 'subject', 'type',
    'priority', 'jira_ticket', 'timestamp', 'assigned_to', 'teams_channel'
  ];

  totalRows = 0;
  isLoading = false;

  // Pagination & Sorting state (ControlUp)
  currentPage = 1;
  currentPageSize = 20;
  currentSortBy = 'received_at';
  currentSortOrder: 'asc' | 'desc' = 'desc';

  // Filters (ControlUp)
  filterTypes = ['Informational', 'Actionable'];
  filterPriorities = ['Informational', 'P1', 'P2'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) { }

  ngAfterViewInit(): void {
    if (this.dataSource.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnInit(): void {
    const defaultEndTime = new Date();
    defaultEndTime.setSeconds(0, 0);

    const defaultStartTime = new Date(defaultEndTime.getTime() - UI_DISPLAY_LIMIT_MS);
    defaultStartTime.setSeconds(0, 0);

    this.reportForm = this.fb.group({
      startDate: [defaultStartTime, Validators.required],
      startTime: [this.getTimeString(defaultStartTime), Validators.required],
      endDate: [defaultEndTime, Validators.required],
      endTime: [this.getTimeString(defaultEndTime), Validators.required],

      filterType: [null],
      filterPriority: [null],
      // Note: filterSource is removed from the form group as it is now handled by the parent dropdown
    }, {
      validators: [this.dateRangeValidator(), this.maxRangeValidator()]
    });

    // NOTE: We do NOT auto-fetch here anymore. 
    // We wait for the user to select 'ControlUp' from the dropdown.
  }

  /**
   * Handles the dropdown change event. 
   * If ControlUp is selected, we can optionally trigger an initial fetch.
   */
  onSourceChange(newSource: string): void {
    this.selectedSource = newSource;

    // Optional: Auto-fetch data if switching to ControlUp and no data is present yet
    if (newSource === 'ControlUp' && this.totalRows === 0 && !this.isLoading) {
       this.fetchReportData();
    }
  }

  // --------------------------------------------------------------------------
  // EXISTING CONTROL-UP HELPER METHODS
  // --------------------------------------------------------------------------

  private getTimeString(date: Date): string {
    if (!date) return '00:00';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private combineDateTime(datePart: Date | null | undefined, timePart: string | null | undefined): Date | null {
    if (!datePart || !timePart) return null;
    const combinedDate = new Date(datePart.getTime());
    const [hours, minutes] = timePart.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    combinedDate.setHours(hours, minutes, 0, 0);
    return combinedDate;
  }

  dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDateControl = group.get('startDate');
      const startTimeControl = group.get('startTime');
      const endDateControl = group.get('endDate');
      const endTimeControl = group.get('endTime');

      if (!startDateControl || !startTimeControl || !endDateControl || !endTimeControl) return null;

      const start = this.combineDateTime(startDateControl.value, startTimeControl.value);
      const end = this.combineDateTime(endDateControl.value, endTimeControl.value);

      if (!start || !end) return null;

      return start.getTime() >= end.getTime() ?
        { 'invalidRange': 'Start Date/Time must be before End Date/Time.' } :
        null;
    };
  }

  maxRangeValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDateControl = group.get('startDate');
      const startTimeControl = group.get('startTime');
      const endDateControl = group.get('endDate');
      const endTimeControl = group.get('endTime');

      if (!startDateControl || !startTimeControl || !endDateControl || !endTimeControl) return null;

      const start = this.combineDateTime(startDateControl.value, startTimeControl.value);
      const end = this.combineDateTime(endDateControl.value, endTimeControl.value);

      if (!start || !end) return null;

      const diff = end.getTime() - start.getTime();

      return diff > MAX_DATE_DIFF_MS ?
        { 'maxRangeExceeded': 'Date range cannot exceed 31 days.' } :
        null;
    };
  }

  private buildReportRequest(pageSize: number = this.currentPageSize, isDownload: boolean = false): ReportRequest | null {
    if (this.reportForm.invalid) return null;

    const formValue = this.reportForm.value;
    let startDateTime = this.combineDateTime(formValue.startDate, formValue.startTime);
    const endDateTime = this.combineDateTime(formValue.endDate, formValue.endTime);

    if (!startDateTime || !endDateTime) {
      return null;
    }

    const selectedRangeDiff = endDateTime.getTime() - startDateTime.getTime();

    if (!isDownload && selectedRangeDiff > UI_DISPLAY_LIMIT_MS) {
      const sevenDaysBeforeEnd = new Date(endDateTime.getTime() - UI_DISPLAY_LIMIT_MS);
      startDateTime = sevenDaysBeforeEnd;
    }

    return {
      start_date: startDateTime,
      end_date: endDateTime,
      filter_type: formValue.filterType || null,
      filter_priority: formValue.filterPriority || null,
      filter_source: 'ControlUp', // Hardcoded for this view as it is specific to ControlUp
      page: this.currentPage,
      page_size: pageSize,
      sort_by: this.currentSortBy,
      sort_order: this.currentSortOrder
    };
  }

  fetchReportData() {
    // Safety check: ensure we are in ControlUp mode (optional but good practice)
    if (this.selectedSource !== 'ControlUp') return;

    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      this.snackBar.open('Please correct the date range errors before fetching data.', 'Dismiss', { duration: 3000 });
      return;
    }

    const request = this.buildReportRequest(this.currentPageSize);
    if (!request) return;

    this.isLoading = true;
    this.reportService.getReportData(request).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalRows = response.total_rows;
        this.isLoading = false;
        if (response.total_rows === 0) {
          this.snackBar.open('No data found for the selected criteria.', 'Dismiss', { duration: 3000 });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching report data:', error);
        this.dataSource.data = [];
        this.totalRows = 0;
        this.snackBar.open(error.error.detail || 'Failed to fetch report data due to a server error.', 'Dismiss', { duration: 5000 });
      }
    });
  }

  handlePageChange(event: PageEvent) {
    this.currentPageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.fetchReportData();
  }

  handleSortChange(sort: Sort) {
    this.currentSortBy = sort.active;
    this.currentSortOrder = (sort.direction as 'asc' | 'desc') || 'desc';
    this.fetchReportData();
  }

  onDownloadReport() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      this.snackBar.open('Please correct the date range errors before downloading.', 'Dismiss', { duration: 3000 });
      return;
    }

    const downloadRequest = this.buildReportRequest(100000, true);
    if (!downloadRequest) return;

    this.snackBar.open('Generating report...', 'Dismiss', { duration: 5000 });
    this.isLoading = true;

    this.reportService.downloadReport(downloadRequest).subscribe({
      next: (data: Blob) => {
        this.isLoading = false;
        this.reportService.triggerFileDownload(data, `report_data_${new Date().toISOString().slice(0, 10)}.csv`);
        this.snackBar.open('Report download successful!', 'Dismiss', { duration: 3000 });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Download failed:', error);
      }
    });
  }
}