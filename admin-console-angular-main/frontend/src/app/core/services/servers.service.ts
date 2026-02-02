import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Define TS models for Server data
interface ServerGroupNameListResponse {
    groups: string[];
}

interface ServerComputername {
    computername: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServerService {
  private apiUrl = `${environment.apiUrl}/servers`;

  constructor(private http: HttpClient) { }

  /**
   * Fetches a list of all unique server group names.
   * @returns Observable<string[]>
   */
  getUniqueServerGroups(): Observable<string[]> {
    return this.http.get<ServerGroupNameListResponse>(`${this.apiUrl}/groups`).pipe(
      map(response => response.groups)
    );
  }

  /**
   * Fetches a list of computer names for a specific server group.
   * @param groupName The name of the group.
   * @returns Observable<string[]>
   */
  getServersByGroup(groupName: string): Observable<string[]> {
    return this.http.get<ServerComputername[]>(`${this.apiUrl}/by_group`, { 
      params: { group_name: groupName } 
    }).pipe(
      map(response => response.map(item => item.computername))
    );
  }
}