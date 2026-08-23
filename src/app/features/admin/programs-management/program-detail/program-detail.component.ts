import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProgramsService } from '../../../../core/services/programs.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import type { Program } from '../../../../core/models/models';

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './program-detail.component.html',
  styleUrls: ['../../content-detail.scss'],
})
export class ProgramDetailComponent implements OnInit {
  readonly loading = signal(true);
  readonly program = signal<Program | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly programsService: ProgramsService,
    private readonly toastService: ToastService,
    protected readonly authService: AuthService,
  ) {}

  get isAdmin(): boolean {
    return ['admin', 'superadmin'].includes(this.authService.admin()?.role ?? '');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/admin/programs']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.programsService.getOne(id).subscribe({
      next: (program) => {
        this.program.set(program);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Programme introuvable.');
        void this.router.navigate(['/admin/programs']);
      },
    });
  }

  back(): void {
    void this.router.navigate(['/admin/programs']);
  }
}
