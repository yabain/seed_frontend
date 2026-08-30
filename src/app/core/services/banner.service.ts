import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { Banner, BannerFigure, BannerSlide } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BannerService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<Banner> {
    return this.api.get<Banner>('/banner');
  }

  update(
    slides: BannerSlide[],
    fixedText: string,
    rotatingPhrases: string[],
    rotatingImage: string,
    rotatingVisible: boolean,
    figures: BannerFigure[],
    authBackgroundImage: string,
  ): Observable<Banner> {
    return this.api.put<Banner>('/banner', {
      slides,
      fixedText,
      rotatingPhrases,
      rotatingImage,
      rotatingVisible,
      figures,
      authBackgroundImage,
    });
  }
}
