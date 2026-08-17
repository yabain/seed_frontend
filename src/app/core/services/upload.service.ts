import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';

export interface UploadResult {
  url: string;
  path: string;
  fileName?: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private readonly api: ApiGatewayService) {}

  uploadImage(form: FormData): Observable<UploadResult> {
    return this.api.post<UploadResult>('/admin/upload', form);
  }
}