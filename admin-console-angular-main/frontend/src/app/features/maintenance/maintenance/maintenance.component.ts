import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'; 
import { MatTooltipModule } from '@angular/material/tooltip';

import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component'; 
import { ImageBannerComponent } from '../../../shared/components/image-banner/image-banner.component';
import { MaintenanceService } from '../../../core/services/maintenance.service'; 
import { ServerService } from '../../../core/services/servers.service'; 
import { DisplayMaintenanceItem, MaintenanceCreateRequest, MaintenanceListResponse } from '../../../shared/models/maintenance.model';
 
@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatIconModule, MatSnackBarModule,
    MatDialogModule, MatCheckboxModule, MatTooltipModule,
    ImageBannerComponent, ConfirmDialogComponent
  ],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  providers: [DatePipe]
})
export class MaintenanceComponent implements OnInit {

  serverGroups: string[] = [];
  filterOptions: string[] = [];
  availableServers: string[] = [];
  isOtherGroupSelected: boolean = false;
  readonly OTHER_GROUP_OPTION = 'Other';

  selectedGroupFilters: string[] = [];
  
  isAdding: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;
  currentMaintenanceId: number | null = null;
  
  maintenanceForm!: FormGroup; 

  dataSource = new MatTableDataSource<DisplayMaintenanceItem>([]); 
  displayedColumns: string[] = ['server_group_display', 'start_datetime', 'end_datetime', 'status', 'actions']; 
  totalRows = 0;
  currentPage = 1; 
  currentPageSize = 10;
  currentSortBy = 'start_datetime';
  currentSortDir: 'desc' = 'desc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
 
  constructor(
    private fb: FormBuilder, 
    private dialog: MatDialog, 
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,
    private maintenanceService: MaintenanceService,
    private serverService: ServerService 
  ) { }
 
  ngOnInit(): void {
    this.initForm(); 
    this.setupGroupControlListener();
    this.loadServerGroups();
    this.loadMaintenances();
  }
 
  initForm(): void {
    this.maintenanceForm = this.fb.group({
      serverGroup: ['', Validators.required], 
      servers: [[], Validators.required], 
      otherServer: [''], 
      comments: [''], 
      startDate: [null, Validators.required],
      startTime: ['', Validators.required],
      endDate: [null, Validators.required],
      endTime: ['', Validators.required],
    });
  }

  setupGroupControlListener(): void {
      if (!this.maintenanceForm) return;

      this.maintenanceForm.get('serverGroup')?.valueChanges
          .subscribe((selectedGroup: string) => {
              this.isOtherGroupSelected = selectedGroup === this.OTHER_GROUP_OPTION;
              
              if (!this.isOtherGroupSelected) {
                  this.loadServersByGroup(selectedGroup);
                  this.maintenanceForm.get('otherServer')?.setValue('');
                  this.maintenanceForm.get('otherServer')?.disable();
                  this.maintenanceForm.get('servers')?.enable();
                  this.maintenanceForm.get('servers')?.setValidators(Validators.required);

              } else {
                  this.availableServers = [];
                  this.maintenanceForm.get('servers')?.setValue([]);
                  this.maintenanceForm.get('servers')?.disable();
                  this.maintenanceForm.get('otherServer')?.enable();
                  this.maintenanceForm.get('otherServer')?.setValidators(Validators.required);
              }
              this.maintenanceForm.get('servers')?.updateValueAndValidity();
              this.maintenanceForm.get('otherServer')?.updateValueAndValidity();
          });
  }

  loadServerGroups(): void {
      this.serverService.getUniqueServerGroups().subscribe({
          next: (groups) => { 
            this.serverGroups = [...groups, this.OTHER_GROUP_OPTION]; 
            this.filterOptions = [...groups];
          },
          error: (err) => { 
            this.serverGroups = [this.OTHER_GROUP_OPTION]; 
            // this.filterOptions = [this.OTHER_GROUP_OPTION];
          }
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadMaintenances();
  }

  removeFilter(group: string): void {
    const index = this.selectedGroupFilters.indexOf(group);
    if (index >= 0) {
      this.selectedGroupFilters.splice(index, 1);
      this.selectedGroupFilters = [...this.selectedGroupFilters];
    }
  }

  clearAllFilters(): void {
    this.selectedGroupFilters = [];
    this.onFilterChange();
  }

  toggleSelectAllFilters(event: MatCheckboxChange): void {
      if (event.checked) {
          this.selectedGroupFilters = [...this.filterOptions];
      } else {
          this.selectedGroupFilters = [];
      }
      this.onFilterChange();
  }

  get isAllFiltersSelected(): boolean {
      return this.selectedGroupFilters.length === this.filterOptions.length && this.filterOptions.length > 0;
  }

  get isPartialFiltersSelected(): boolean {
      return this.selectedGroupFilters.length > 0 && this.selectedGroupFilters.length < this.filterOptions.length;
  }

  loadServersByGroup(groupName: string): void {
      if (!groupName) return;
      this.serverService.getServersByGroup(groupName).subscribe({
          next: (servers) => {
              this.availableServers = servers;
              if (!this.isEditing || (this.isEditing && this.maintenanceForm.get('serverGroup')?.dirty)) {
                 this.maintenanceForm.get('servers')?.setValue(servers);
              }
          },
          error: (err) => { this.availableServers = []; }
      });
  }

  toggleSelectAll(event: MatCheckboxChange): void {
      if (event.checked) {
          this.maintenanceForm.get('servers')?.setValue([...this.availableServers]);
      } else {
          this.maintenanceForm.get('servers')?.setValue([]);
      }
  }

  get isAllSelected(): boolean {
      const selected = this.maintenanceForm.get('servers')?.value || [];
      return selected.length === this.availableServers.length && this.availableServers.length > 0;
  }

  get isPartiallySelected(): boolean {
      const selected = this.maintenanceForm.get('servers')?.value || [];
      return selected.length > 0 && selected.length < this.availableServers.length;
  }

  private getTimeString(date: Date): string {
    if (!date) return '00:00'; 
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
 
  private combineDateTime(datePart: Date | null | undefined, timePart: string | null | undefined): Date | null {
    if (!datePart || !timePart) return null;
    const [hours, minutes] = timePart.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return new Date(Date.UTC(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hours, minutes, 0));
  }

  startAddMaintenance(): void {
    this.isAdding = true;
    this.isEditing = false;
    this.maintenanceForm.reset();
    this.initForm(); 
    this.setupGroupControlListener(); 
    this.maintenanceForm.get('serverGroup')?.setValue(this.serverGroups.length > 0 ? this.serverGroups[0] : '');
  }
 
  cancelAdd(): void {
    this.isAdding = false;
    this.maintenanceForm.reset();
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.currentMaintenanceId = null;
    this.maintenanceForm.reset();
  }
  
  loadMaintenances(): void {
    this.isLoading = true;
    this.maintenanceService.getMaintenances(
      this.currentPage,
      this.currentPageSize,
      this.currentSortBy,
      this.currentSortDir as 'asc' | 'desc',
      this.selectedGroupFilters // Pass filters
    ).subscribe({
      next: (response: MaintenanceListResponse) => {
        const displayData: DisplayMaintenanceItem[] = response.items.map(item => ({
            ...item,
            start_datetime: new Date(item.start_datetime + (item.start_datetime.endsWith('Z') ? '' : 'Z')),
            end_datetime: new Date(item.end_datetime + (item.end_datetime.endsWith('Z') ? '' : 'Z')),
        }));
        this.dataSource.data = displayData;
        this.totalRows = response.total_rows;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.dataSource.data = [];
        this.totalRows = 0;
      }
    });
  }
  
  startEditMaintenance(item: DisplayMaintenanceItem): void {
      this.isEditing = true;
      this.isAdding = false;
      this.currentMaintenanceId = item.id;
      
      const startDateVisual = new Date(item.start_datetime.getUTCFullYear(), item.start_datetime.getUTCMonth(), item.start_datetime.getUTCDate());
      const endDateVisual = new Date(item.end_datetime.getUTCFullYear(), item.end_datetime.getUTCMonth(), item.end_datetime.getUTCDate());

      if (item.server_group !== this.OTHER_GROUP_OPTION) {
          this.loadServersByGroup(item.server_group); 
      } else {
          this.availableServers = [];
      }
      
      this.maintenanceForm.patchValue({
          serverGroup: item.server_group,
          servers: item.server_name ? [item.server_name] : [],
          otherServer: item.other_server,
          comments: item.comments,
          startDate: startDateVisual,
          startTime: this.getTimeString(item.start_datetime), 
          endDate: endDateVisual,
          endTime: this.getTimeString(item.end_datetime),   
      });
      
      this.isOtherGroupSelected = item.server_group === this.OTHER_GROUP_OPTION;
      
      if (this.isOtherGroupSelected) {
          this.maintenanceForm.get('servers')?.disable();
          this.maintenanceForm.get('otherServer')?.enable();
      } else {
          this.maintenanceForm.get('servers')?.enable();
          this.maintenanceForm.get('otherServer')?.disable();
      }
  }
 
  saveMaintenance(): void {
    if (this.maintenanceForm.invalid) {
        this.snackBar.open('Please fill all required fields correctly.', 'Dismiss', { duration: 3000 });
        this.maintenanceForm.markAllAsTouched();
        return;
    }
    
    this.isLoading = true;
    const rawData = this.maintenanceForm.getRawValue();
    
    const startDateTime = this.combineDateTime(rawData.startDate, rawData.startTime);
    const endDateTime = this.combineDateTime(rawData.endDate, rawData.endTime);
 
    if (!startDateTime || !endDateTime) {
        this.isLoading = false;
        return;
    }
 
    const requestBody: MaintenanceCreateRequest = {
        comments: rawData.comments || null,
        server_group: rawData.serverGroup,
        servers: rawData.servers || [],
        other_server: this.isOtherGroupSelected ? rawData.otherServer : null,
        start_datetime: startDateTime.toISOString(), 
        end_datetime: endDateTime.toISOString(),
    };
    
    if (this.isOtherGroupSelected) {
        requestBody.servers = [];
    }
 
    const operation = this.isEditing
        ? this.maintenanceService.updateMaintenance(this.currentMaintenanceId!, requestBody as any) 
        : this.maintenanceService.createMaintenance(requestBody);
 
    operation.subscribe({
        next: () => {
            this.snackBar.open(`Maintenance ${this.isEditing ? 'updated' : 'created'} successfully!`, 'Dismiss', { duration: 3000 });
            this.isLoading = false;
            this.isAdding = false;
            this.isEditing = false;
            this.currentMaintenanceId = null;
            this.maintenanceForm.reset();
            this.availableServers = [];
            this.loadMaintenances();
        },
        error: (err) => {
            this.isLoading = false;
            this.snackBar.open(`Save failed: ${err.error?.detail || 'Server error'}`, 'Dismiss', { duration: 5000 });
        }
    });
  }

  openDeleteDialog(item: DisplayMaintenanceItem): void {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
              title: 'Confirm Deletion',
              message: `Are you sure you want to delete maintenance for ${item.server_name || item.other_server}?`,
              confirmButtonText: 'Delete',
              cancelButtonText: 'Cancel',
              confirmButtonColor: 'warn'
          }
      });
      dialogRef.afterClosed().subscribe(result => {
          if (result) this.deleteMaintenance(item.id);
      });
  }

  deleteMaintenance(id: number): void {
      this.isLoading = true;
      this.maintenanceService.deleteMaintenance(id).subscribe({
          next: () => {
             this.snackBar.open('Maintenance deleted successfully!', 'Dismiss', { duration: 3000 });
             this.loadMaintenances();
          },
          error: (err) => { this.isLoading = false; }
      });
  }
  
  handlePageChange(event: PageEvent): void {
      this.currentPage = event.pageIndex + 1; 
      this.currentPageSize = event.pageSize;
      this.loadMaintenances();
  }
 
  resetForm(): void {
      this.maintenanceForm.reset();
      this.initForm(); 
      this.maintenanceForm.get('serverGroup')?.setValue(this.serverGroups.length > 0 ? this.serverGroups[0] : '');
  }
}