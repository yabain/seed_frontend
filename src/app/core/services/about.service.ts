import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { SiteAbout } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AboutService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<SiteAbout> {
    return this.api.get<SiteAbout>('/about');
  }

  update(data: Partial<SiteAbout>): Observable<SiteAbout> {
    return this.api.put<SiteAbout>('/about', data);
  }
}