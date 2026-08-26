import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { CountriesSection, CountryItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CountriesSectionService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<CountriesSection> {
    return this.api.get<CountriesSection>('/countries-section');
  }

  update(
    title: string,
    backgroundImage: string,
    countries: CountryItem[],
    visible: boolean,
  ): Observable<CountriesSection> {
    return this.api.put<CountriesSection>('/countries-section', {
      title,
      backgroundImage,
      countries,
      visible,
    });
  }
}