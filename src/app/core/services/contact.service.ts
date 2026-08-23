import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { ContactMessage, ContactMessagesResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private readonly api: ApiGatewayService) {}

  sendMessage(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Observable<ContactMessage> {
    return this.api.post<ContactMessage>('/contact', data);
  }

  // Back-office
  getMessages(
    query: { page?: number; limit?: number; read?: string; search?: string } = {},
  ): Observable<ContactMessagesResult> {
    return this.api.get<ContactMessagesResult>('/contact', query);
  }

  getMessage(id: string): Observable<ContactMessage> {
    return this.api.get<ContactMessage>(`/contact/${id}`);
  }

  markRead(id: string, isRead: boolean): Observable<ContactMessage> {
    return this.api.patch<ContactMessage>(`/contact/${id}/read`, { isRead });
  }

  remove(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/contact/${id}`);
  }
}