import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageBackgroundService } from '../../core/services/page-background.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './legal.component.scss',
})
export class PrivacyPolicyComponent {
  private readonly pageBackgroundService = inject(PageBackgroundService);
  readonly pageBackground = this.pageBackgroundService.background;

  constructor() {
    this.pageBackgroundService.load();
  }
}