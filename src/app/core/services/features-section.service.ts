import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { FeaturesSection, FeatureItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FeaturesSectionService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<FeaturesSection> {
    return this.api.get<FeaturesSection>('/features-section');
  }

  update(
    eyebrow: string,
    title: string,
    description: string,
    image: string,
    features: FeatureItem[],
    visible: boolean,
  ): Observable<FeaturesSection> {
    return this.api.put<FeaturesSection>('/features-section', {
      eyebrow,
      title,
      description,
      image,
      features,
      visible,
    });
  }
}
