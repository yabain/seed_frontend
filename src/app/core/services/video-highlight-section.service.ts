import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { VideoHighlightSection } from '../models/models';

@Injectable({ providedIn: 'root' })
export class VideoHighlightSectionService {
  constructor(private readonly api: ApiGatewayService) {}
  getPublic(): Observable<VideoHighlightSection> { return this.api.get<VideoHighlightSection>('/video-highlight-section'); }
  update(data: VideoHighlightSection): Observable<VideoHighlightSection> { return this.api.put<VideoHighlightSection>('/video-highlight-section', data); }
}
