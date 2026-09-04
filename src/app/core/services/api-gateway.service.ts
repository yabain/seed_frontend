import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const REQUEST_OPTIONS = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class ApiGatewayService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, {
      ...REQUEST_OPTIONS,
      params: this.buildParams(params),
    });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body ?? {}, REQUEST_OPTIONS);
  }

  /**
   * POST avec réponse en texte brut (ex. aperçu HTML), envoie le cookie
   * d'authentification (`withCredentials`).
   */
  postText(path: string, body?: unknown): Observable<string> {
    return this.http.post(`${this.baseUrl}${path}`, body ?? {}, {
      ...REQUEST_OPTIONS,
      responseType: 'text',
    });
  }

  /**
   * POST multipart/form-data (ex. upload de pièce jointe), envoie le cookie
   * d'authentification (`withCredentials`).
   */
  postForm<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, formData, REQUEST_OPTIONS);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body ?? {}, REQUEST_OPTIONS);
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body ?? {}, REQUEST_OPTIONS);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`, REQUEST_OPTIONS);
  }

  /**
   * GET renvoyant un binaire brut (ex. téléchargement de fichier Excel),
   * envoie le cookie d'authentification (`withCredentials`).
   */
  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, {
      ...REQUEST_OPTIONS,
      responseType: 'blob',
    });
  }

  private buildParams(
    params?: Record<string, string | number | boolean | undefined>,
  ): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}