import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map, Observable } from 'rxjs';
import { UsersService } from '../../../../core/services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import type { AdminUser, UserRole } from '../../../../core/models/models';

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilisateur',
  consultant: 'Consultant',
  admin: 'Administrateur',
  superadmin: 'Super admin',
};

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: '../../resources-management/resource-form/resource-form.component.scss',
})
export class UserFormComponent implements OnInit {
  readonly roleOptions: UserRole[] = ['user', 'consultant', 'admin', 'superadmin'];
  readonly roleLabels = ROLE_LABELS;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly currentUser = signal<AdminUser | null>(null);

  readonly form = {
    name: '',
    email: '',
    phone: '',
    role: 'user' as UserRole,
    isActive: true,
    notifyContact: true,
    password: '',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly usersService: UsersService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.load(id);
    }
  }

  get isEdit(): boolean {
    return this.editingId() !== null;
  }

  get status(): 'active' | 'inactive' {
    return this.form.isActive ? 'active' : 'inactive';
  }

  setStatus(status: 'active' | 'inactive'): void {
    this.form.isActive = status === 'active';
  }

  toggleNotifyContact(): void {
    this.form.notifyContact = !this.form.notifyContact;
  }

  private load(id: string): void {
    this.loading.set(true);
    this.usersService.getUser(id).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.form.name = user.name;
        this.form.email = user.email;
        this.form.phone = user.phone ?? '';
        this.form.role = user.role;
        this.form.isActive = user.isActive;
        this.form.notifyContact = user.notifyContact;
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Compte introuvable.');
        void this.router.navigate(['/admin/users']);
      },
    });
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.toastService.warning('Le nom est obligatoire.');
      return;
    }
    if (!this.isEdit && !this.form.password) {
      this.toastService.warning('Le mot de passe est obligatoire à la création.');
      return;
    }
    this.saving.set(true);

    if (this.isEdit) {
      const payload = {
        name: this.form.name.trim(),
        phone: this.form.phone.trim() || undefined,
        role: this.form.role,
        isActive: this.form.isActive,
        notifyContact: this.form.notifyContact,
      };
      const requests: Observable<null>[] = [
        this.usersService.updateUser(this.editingId()!, payload).pipe(map(() => null)),
      ];
      if (this.form.password) {
        requests.push(
          this.usersService.changePassword(this.editingId()!, this.form.password).pipe(map(() => null)),
        );
      }
      forkJoin(requests).subscribe({
        next: () => void this.afterSave(),
        error: (err) => this.fail(err),
      });
      return;
    }

    this.usersService
      .createUser({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim() || undefined,
        password: this.form.password,
        role: this.form.role,
        isActive: this.form.isActive,
        notifyContact: this.form.notifyContact,
        siteUrl: environment.siteUrl,
      })
      .subscribe({
        next: () => void this.afterSave(),
        error: (err) => this.fail(err),
      });
  }

  private afterSave(): void {
    this.toastService.success(
      this.isEdit ? 'Compte mis à jour.' : 'Compte créé avec succès.',
    );
    void this.router.navigate(['/admin/users']);
  }

  private fail(err: { details?: string[]; message?: string }): void {
    this.saving.set(false);
    this.toastService.error(
      err.details?.join(' ') || err.message || 'Erreur lors de l’enregistrement.',
    );
  }

  cancel(): void {
    void this.router.navigate(['/admin/users']);
  }
}
