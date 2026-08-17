import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export interface ErrorMessage {
  message: string;
  details?: string[];
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
          if (!req.url.includes('/admin/auth/login')) {
            window.location.href = '/admin/login';
          }
        }
        return throwError(() => this.toErrorMessage(error));
      }),
    );
  }

  private toErrorMessage(error: HttpErrorResponse): ErrorMessage {
    const serverMessage = error.error?.message;
    const details: string[] = [];

    if (Array.isArray(serverMessage)) {
      details.push(...serverMessage.map((m) => Object.values(m).join(' ')));
    } else if (typeof serverMessage === 'string') {
      details.push(serverMessage);
    }

    const statusMessages: Record<number, string> = {
      400: 'Requête invalide',
      401: 'Session expirée. Veuillez vous reconnecter.',
      403: 'Accès refusé',
      404: 'Ressource introuvable',
      409: 'Conflit de données',
      500: 'Erreur interne du serveur',
    };

    return {
      message: statusMessages[error.status] ?? 'Une erreur réseau est survenue',
      details,
    };
  }
}