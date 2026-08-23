import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../../../core/services/contact.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { ContactMessage } from '../../../../core/models/models';

@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-detail.component.html',
  styleUrl: './message-detail.component.scss',
})
export class MessageDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly message = signal<ContactMessage | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly contactService: ContactService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/messages']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.contactService.getMessage(id).subscribe({
      next: (message) => {
        this.message.set(message);
        this.loading.set(false);
        if (!message.isRead) {
          this.markRead(true);
        }
      },
      error: () => {
        this.toastService.error('Message introuvable.');
        this.loading.set(false);
      },
    });
  }

  markRead(isRead: boolean): void {
    const current = this.message();
    if (!current || current.isRead === isRead) return;

    this.contactService.markRead(current._id, isRead).subscribe({
      next: () => this.message.set({ ...current, isRead }),
      error: () => this.toastService.error('Erreur lors de la mise à jour.'),
    });
  }

  remove(): void {
    const current = this.message();
    if (!current) return;
    if (!window.confirm(`Supprimer le message « ${current.subject} » ?`)) {
      return;
    }
    this.contactService.remove(current._id).subscribe({
      next: () => {
        this.toastService.success('Message supprimé.');
        void this.router.navigate(['/admin/messages']);
      },
      error: () => this.toastService.error('Erreur lors de la suppression.'),
    });
  }

  back(): void {
    void this.router.navigate(['/admin/messages']);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
