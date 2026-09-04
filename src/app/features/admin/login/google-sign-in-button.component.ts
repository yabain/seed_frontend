import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-sign-in-button.component.html',
  styleUrl: './google-sign-in-button.component.scss',
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  @Output() readonly credential = new EventEmitter<string>();
  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef<HTMLDivElement>;

  error = '';
  private static scriptLoading: Promise<void> | null = null;

  constructor(private readonly zone: NgZone) {}

  ngAfterViewInit(): void {
    if (!environment.googleClientId) {
      this.error = 'Connexion Google non configurée';
      return;
    }
    this.loadGoogleScript()
      .then(() => this.renderButton())
      .catch(() => {
        this.error = 'Connexion Google indisponible';
      });
  }

  private renderButton(): void {
    if (!window.google?.accounts?.id) {
      this.error = 'Connexion Google indisponible';
      return;
    }

    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential?: string }) => {
        const value = response?.credential ?? '';
        if (!value) return;
        this.zone.run(() => this.credential.emit(value));
      },
    });

    window.google.accounts.id.renderButton(this.googleButton.nativeElement, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: this.googleButton.nativeElement.offsetWidth || 320,
    });
  }

  private loadGoogleScript(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (GoogleSignInButtonComponent.scriptLoading) {
      return GoogleSignInButtonComponent.scriptLoading;
    }

    GoogleSignInButtonComponent.scriptLoading = new Promise<void>(
      (resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://accounts.google.com/gsi/client"]',
        );
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject());
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      },
    );

    return GoogleSignInButtonComponent.scriptLoading;
  }
}
