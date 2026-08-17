import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MailService } from '../../../core/services/mail.service';
import { ToastService } from '../../../core/services/toast.service';
import type { SmtpConfig, EmailItem, EmailMeta, EmailStat } from '../../../core/services/mail.service';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './email-settings.component.html',
  styleUrl: './email-settings.component.scss',
})
export class EmailSettingsComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly sending = signal(false);
  readonly edition = signal(false);
  readonly smtpExpanded = signal(false);
  readonly gettingOutput = signal(false);
  readonly gettingStats = signal(false);

  smtp: SmtpConfig = {
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    smtpEncryption: 'SSL/TLS',
    status: true,
    emailForAlert: '',
  };

  readonly testEmail = { to: '', subject: 'Test email', message: 'This is the body of test email' };

  readonly emailList = signal<EmailItem[]>([]);
  readonly emailMeta = signal<EmailMeta | null>(null);
  readonly emailPage = signal(1);
  readonly emailKeyword = signal('');

  readonly stats = signal<EmailStat[]>([]);
  readonly totalSuccess = signal(0);
  readonly totalFailed = signal(0);

  readonly encryptionOptions = ['SSL/TLS', 'STARTTLS'];

  toggleSmtp(): void {
    const next = !this.smtpExpanded();
    this.smtpExpanded.set(next);
    if (!next) {
      this.edition.set(false);
    }
  }

  readonly chartOptions: any = {
    chart: {
      type: 'bar',
      height: 320,
      toolbar: { show: false },
    },
    colors: ['#16a34a', '#dc2626'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [],
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: {
      title: { text: 'E-mails' },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
    },
  };

  chartSeries: any[] = [];

  constructor(
    private readonly mailService: MailService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadSmtp();
    this.loadOutputMails();
    this.loadStats();
  }

  loadSmtp(): void {
    this.loading.set(true);
    this.mailService.getSmtpData().subscribe({
      next: (data) => {
        this.smtp = { ...data };
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de charger la configuration SMTP.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.saving.set(true);

    this.mailService.updateSmtp(this.smtp).subscribe({
      next: () => {
        this.saving.set(false);
        this.edition.set(false);
        this.toastService.success('Configuration SMTP enregistrée.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de l\'enregistrement.',
        );
      },
    });
  }

  resetSmtp(): void {
    this.mailService.resetSmtp().subscribe({
      next: (data) => {
        this.smtp = { ...data };
        this.edition.set(false);
        this.toastService.success('Configuration SMTP réinitialisée.');
      },
      error: (err) => {
        this.toastService.error(
          err.details?.join(' ') || err.message || 'Erreur lors de la réinitialisation.',
        );
      },
    });
  }

  sendTest(): void {
    this.sending.set(true);
    this.mailService.sendTestMail(this.testEmail.to, this.testEmail.subject, this.testEmail.message).subscribe({
      next: () => {
        this.sending.set(false);
        this.toastService.success('E-mail de test envoyé avec succès.');
        this.loadOutputMails();
        this.loadStats();
      },
      error: (err) => {
        this.sending.set(false);
        this.toastService.error(
          err.details?.join(' ') || err.message || "Échec de l'envoi du e-mail de test.",
        );
      },
    });
  }

  loadOutputMails(): void {
    this.gettingOutput.set(true);
    this.mailService.getOutputMails(this.emailPage(), this.emailKeyword() || undefined).subscribe({
      next: (result) => {
        this.emailList.set(result.data);
        this.emailMeta.set(result.meta);
        this.gettingOutput.set(false);
      },
      error: () => {
        this.gettingOutput.set(false);
      },
    });
  }

  loadStats(): void {
    this.gettingStats.set(true);
    this.mailService.getStatistics().subscribe({
      next: (data) => {
        this.stats.set(data);
        const success = data.reduce((sum, item) => sum + item.success, 0);
        const failed = data.reduce((sum, item) => sum + item.failed, 0);
        this.totalSuccess.set(success);
        this.totalFailed.set(failed);

        this.chartOptions.xaxis = {
          ...this.chartOptions.xaxis,
          categories: data.map((item) => item.month),
        };
        this.chartSeries = [
          { name: 'Envoyés', data: data.map((item) => item.success) },
          { name: 'Échoués', data: data.map((item) => item.failed) },
        ];
        this.gettingStats.set(false);
      },
      error: () => {
        this.gettingStats.set(false);
      },
    });
  }

  previousEmailPage(): void {
    if (this.emailMeta() && this.emailPage() > 1) {
      this.emailPage.update((p) => p - 1);
      this.loadOutputMails();
    }
  }

  nextEmailPage(): void {
    if (this.emailMeta() && this.emailMeta()!.hasNextPage) {
      this.emailPage.update((p) => p + 1);
      this.loadOutputMails();
    }
  }

  onEmailSearch(value: string): void {
    this.emailKeyword.set(value);
    this.emailPage.set(1);
    this.loadOutputMails();
  }

  getFirst60Chars(text: string): string {
    if (!text) return '';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Envoyé' : 'Échoué';
  }
}
