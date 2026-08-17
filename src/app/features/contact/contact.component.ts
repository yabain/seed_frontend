import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  readonly siteConfig = this.siteConfigService.config;
  readonly submitting = signal(false);
  readonly submitted = signal(false);

  readonly phoneCodes = [
    { code: '+225', label: 'Côte d’Ivoire' },
    { code: '+33', label: 'France' },
    { code: '+221', label: 'Sénégal' },
    { code: '+228', label: 'Togo' },
    { code: '+229', label: 'Bénin' },
    { code: '+226', label: 'Burkina Faso' },
    { code: '+237', label: 'Cameroun' },
    { code: '+233', label: 'Ghana' },
    { code: '+224', label: 'Guinée' },
    { code: '+1', label: 'États-Unis / Canada' },
    { code: '+44', label: 'Royaume-Uni' },
    { code: '+49', label: 'Allemagne' },
  ];

  readonly contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneCode: ['+225', Validators.required],
    phone: ['', [Validators.pattern(/^\d{6,13}$/)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly contactService: ContactService,
    private readonly siteConfigService: SiteConfigService,
    private readonly toastService: ToastService,
  ) {}

  submit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.contactForm.value as {
      name: string;
      email: string;
      phoneCode: string;
      phone: string;
      subject: string;
      message: string;
    };

    const payload = {
      name: raw.name,
      email: raw.email,
      subject: raw.subject,
      message: raw.message,
      phone: raw.phone ? `${raw.phoneCode}${raw.phone}` : undefined,
    };

    this.contactService.sendMessage(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.toastService.success('Votre message a bien été envoyé. Nous vous répondrons rapidement.');
        this.contactForm.reset({ phoneCode: '+225' });
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.error('Une erreur est survenue lors de l’envoi. Veuillez réessayer.');
      },
    });
  }

  messageFor(controlName: string): string {
    const c = this.contactForm.get(controlName);
    if (!c || !c.touched) {
      return '';
    }
    if (c.hasError('required')) {
      return 'Ce champ est obligatoire.';
    }
    if (c.hasError('email')) {
      return 'Veuillez saisir une adresse e-mail valide.';
    }
    if (c.hasError('pattern')) {
      return 'Numéro invalide — saisissez uniquement des chiffres (ex : 0700000000).';
    }
    if (c.hasError('minlength')) {
      return `Minimum ${c.errors?.['minlength']?.requiredLength} caractères.`;
    }
    if (c.hasError('maxlength')) {
      return `Maximum ${c.errors?.['maxlength']?.requiredLength} caractères.`;
    }
    return '';
  }
}