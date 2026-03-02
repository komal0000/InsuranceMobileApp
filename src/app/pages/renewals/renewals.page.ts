import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
  IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
  IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
  IonIcon, IonSpinner, IonCard, IonCardContent, IonButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, refreshOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { ApiResponse, PaginatedData } from '../../interfaces/api-response.interface';
import { Renewal } from '../../interfaces/renewal.interface';

@Component({
  selector: 'app-renewals',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonBadge, IonSearchbar,
    IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent,
    IonInfiniteScroll, IonInfiniteScrollContent, IonFab, IonFabButton,
    IonIcon, IonSpinner, IonCard, IonCardContent, IonButton, IonButtons
  ],
  templateUrl: './renewals.page.html',
  styleUrls: ['./renewals.page.scss'],
})
export class RenewalsPage implements OnInit {
  renewals: Renewal[] = [];
  search = '';
  statusFilter = '';
  page = 1;
  lastPage = 1;
  loading = false;

  constructor(private api: ApiService, private router: Router) {
    addIcons({ searchOutline, refreshOutline });
  }

  ngOnInit() { this.loadRenewals(); }

  loadRenewals() {
    this.loading = true;
    const params: any = { page: this.page };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.search) params.search = this.search;
    this.api.get<ApiResponse<PaginatedData<Renewal>>>('/renewals', params).subscribe({
      next: (res) => {
        this.renewals = this.page === 1 ? res.data.data : [...this.renewals, ...res.data.data];
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.page = 1; this.loadRenewals(); }
  onFilterChange() { this.page = 1; this.loadRenewals(); }

  refresh(event: any) {
    this.page = 1;
    this.api.get<ApiResponse<PaginatedData<Renewal>>>('/renewals', {
      page: 1, status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => { this.renewals = res.data.data; this.lastPage = res.data.last_page; event.target.complete(); },
      error: () => event.target.complete(),
    });
  }

  loadMore(event: any) {
    this.page++;
    this.api.get<ApiResponse<PaginatedData<Renewal>>>('/renewals', {
      page: this.page, status: this.statusFilter, search: this.search
    }).subscribe({
      next: (res) => { this.renewals = [...this.renewals, ...res.data.data]; event.target.complete(); },
      error: () => event.target.complete(),
    });
  }

  viewDetail(renewal: Renewal) { this.router.navigateByUrl(`/renewal-detail/${renewal.id}`); }
  goToSearch() { this.router.navigateByUrl('/renewal-search'); }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      draft: 'medium', pending: 'warning', pending_verification: 'warning',
      verified: 'tertiary', approved: 'success', rejected: 'danger',
    };
    return map[status] || 'medium';
  }

  formatStatus(s: string): string {
    return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
