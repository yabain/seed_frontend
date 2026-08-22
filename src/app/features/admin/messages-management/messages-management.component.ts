import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ContactMessagesResult } from '../../../core/models/models';

@Component({
  selector: 'app-messages-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages-management.component.html',
  styleUrl: '../management.scss',
})
export class MessagesManagementComponent implements OnInit {
  readonly result = signal<ContactMessagesResult | null>(null);
  readonly loading = signal(true);
  readonly selected = signal<string | null>(null);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly searchQuery = signal('');

  private searchTimer: any;

  constructor(
    private readonly contactService: ContactService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.contactService
      .getMessages({ page: this.page(), limit: this.limit(), search: this.searchQuery() })
      .subscribe({
        next: (data) => this.result.set(data),
        error: () => this.toastService.error('Impossible de charger les messages.'),
        complete: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchQuery.set(value);
    this.page.set(1);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  totalPages(): number {
    const data = this.result();
    if (!data) {
      return 1;
    }
    return Math.max(1, Math.ceil(data.total / data.limit));
  }

  hasPrev(): boolean {
    return this.page() > 1;
  }

  hasNext(): boolean {
    return this.page() < this.totalPages();
  }

  previousPage(): void {
    if (this.hasPrev()) {
      this.page.update((p) => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update((p) => p + 1);
      this.load();
    }
  }

  onLimitChange(value: string): void {
    this.limit.set(parseInt(value, 10));
    this.page.set(1);
    this.load();
  }

  toggleDetails(id: string): void {
    this.selected.set(this.selected() === id ? null : id);
  }

  markRead(message: { _id: string; isRead: boolean }): void {
    this.contactService.markRead(message._id, !message.isRead).subscribe({
      next: () => {
        const data = this.result();
        if (!data) {
          return;
        }
        const updated = data.items.map((item) =>
          item._id === message._id ? { ...item, isRead: !message.isRead } : item,
        );
        this.result.set({
          ...data,
          items: updated,
          unreadCount: data.unreadCount + (message.isRead ? 1 : -1),
        });
      },
      error: () => this.toastService.error('Erreur lors de la mise à jour.'),
    });
  }

  remove(message: { _id: string; subject: string }): void {
    if (!window.confirm(`Supprimer le message « ${message.subject} » ?`)) {
      return;
    }
    this.contactService.remove(message._id).subscribe({
      next: () => {
        this.load();
        this.toastService.success('Message supprimé.');
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}