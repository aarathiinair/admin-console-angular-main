import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { Trigger } from '../../../shared/models/trigger.model';
import { TriggerService } from '../../../core/services/trigger.service';
import { AddTriggerDialogComponent } from '../add-trigger-dialog/add-trigger-dialog.component';

@Component({
  selector: 'app-trigger-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './trigger-list.component.html',
  styleUrls: ['./trigger-list.component.scss']
})
export class TriggerListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'trigger_name', 
    'category', 
    'priority', 
    'actionable', 
    'team', 
    'department', 
    'recommended_action', 
    'responsible_persons', 
    'actions'
  ];
  
  dataSource = new MatTableDataSource<Trigger>([]);
  isLoading: boolean = false;

  filterCategory: string = '';
  filterPriority: string = '';
  filterActionable: string = '';
  filterTeam: string = '';

  categoryOptions: string[] = [];
  priorityOptions = ['P1', 'P2', 'P3', 'Informational'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private triggerService: TriggerService
  ) {
    this.dataSource.filterPredicate = (data: Trigger, filter: string): boolean => {
      const search = JSON.parse(filter);
      const categoryMatch = !search.category || data.category === search.category;
      const priorityMatch = !search.priority || data.priority === search.priority;
      const actionableMatch = !search.actionable || data.actionable === search.actionable;
      const teamMatch = !search.team || 
        data.team?.toLowerCase().includes(search.team.toLowerCase()) ||
        data.trigger_name?.toLowerCase().includes(search.team.toLowerCase());

      return categoryMatch && priorityMatch && actionableMatch && teamMatch;
    };
  }

  ngOnInit(): void {
    this.loadTriggers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadTriggers(): void {
    this.isLoading = true;
    this.triggerService.getTriggers().subscribe({
      next: (data: Trigger[]) => {
        this.dataSource.data = data;
        this.categoryOptions = [...new Set(data.map(t => t.category))].filter(Boolean).sort();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load triggers:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const filterValue = {
      category: this.filterCategory || null,
      priority: this.filterPriority || null,
      actionable: this.filterActionable || null,
      team: this.filterTeam || null
    };
    this.dataSource.filter = JSON.stringify(filterValue);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openTriggerDialog(trigger?: Trigger): void {
    const dialogRef = this.dialog.open(AddTriggerDialogComponent, {
      width: '850px',
      data: {
        currentTrigger: trigger,
        existingTriggers: this.dataSource.data
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        if (result.isEdit && trigger?.id) {
          // UPDATE EXISTING
          this.triggerService.updateTrigger(trigger.id, result.newTrigger).subscribe({
            next: () => this.loadTriggers(),
            error: (err) => {
              console.error('Update failed:', err);
              this.isLoading = false;
            }
          });
        } else {
          // CREATE NEW
          this.triggerService.createTrigger(result.newTrigger).subscribe({
            next: () => this.loadTriggers(),
            error: (err) => {
              console.error('Creation failed:', err);
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  deleteTrigger(id: number): void {
    if (confirm('Are you sure you want to delete this trigger?')) {
      this.isLoading = true;
      this.triggerService.deleteTrigger(id).subscribe({
        next: () => this.loadTriggers(),
        error: (err) => {
          console.error('Delete failed:', err);
          this.isLoading = false;
        }
      });
    }
  }
}