import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiGatewayService } from './api-gateway.service';
import type { Team, TeamMember, TeamSection } from '../models/models';

export interface TeamMemberListParams {
  search?: string;
  sectionId?: string;
  page?: number;
  limit?: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface TeamMemberListResult {
  data: TeamMember[];
  pagination: Pagination;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private readonly api: ApiGatewayService) {}

  getPublic(): Observable<Team> {
    return this.api.get<Team>('/team');
  }

  update(data: Partial<Team>): Observable<Team> {
    return this.api.put<Team>('/team', data);
  }

  remove(): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>('/team');
  }

  /* ============== Sections ============== */

  listSections(): Observable<TeamSection[]> {
    return this.api.get<TeamSection[]>('/team/sections');
  }

  createSection(data: Partial<TeamSection>): Observable<TeamSection> {
    return this.api.post<TeamSection>('/team/sections', data);
  }

  updateSection(
    id: string,
    data: Partial<TeamSection>,
  ): Observable<TeamSection> {
    return this.api.patch<TeamSection>(`/team/sections/${id}`, data);
  }

  removeSection(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/team/sections/${id}`);
  }

  /* ============== Membres ============== */

  listMembers(params: TeamMemberListParams = {}): Observable<TeamMemberListResult> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.sectionId) query.set('sectionId', params.sectionId);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.api.get<TeamMemberListResult>(
      qs ? `/team/members?${qs}` : '/team/members',
    );
  }

  getMember(id: string): Observable<TeamMember> {
    return this.api.get<TeamMember>(`/team/members/${id}`);
  }

  createMember(data: Partial<TeamMember>): Observable<TeamMember> {
    return this.api.post<TeamMember>('/team/members', data);
  }

  updateMember(
    id: string,
    data: Partial<TeamMember>,
  ): Observable<TeamMember> {
    return this.api.patch<TeamMember>(`/team/members/${id}`, data);
  }

  removeMember(id: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/team/members/${id}`);
  }
}