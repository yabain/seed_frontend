export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
}

export interface AdminProfile extends Admin {
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: Admin;
}

export interface RequiresTwoFactorResponse {
  requiresTwoFactor: boolean;
  email: string;
  message: string;
}

export interface TwoFactorVerifyResponse {
  accessToken: string;
  admin: Admin;
}

export interface SendTwoFactorCodeResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type TrafficRange = '24h' | '7d' | '30d' | '12m';

export type NewsStatus = 'draft' | 'published';

export interface NewsCategory {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface News {
  _id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  image?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  status: NewsStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Resource {
  _id: string;
  title: string;
  category?: string;
  description?: string;
  fileUrl?: string;
  previewImage?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isPublished?: boolean;
  createdAt: string;
}

export interface Program {
  _id: string;
  title: string;
  excerpt?: string;
  description?: string;
  visual?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}

export interface Partner {
  _id: string;
  name: string;
  logo?: string;
  website?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  ip?: string;
  createdAt: string;
}

export type UserRole = 'user' | 'consultant' | 'admin' | 'superadmin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  notifyContact: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ContactMessagesResult extends Paginated<ContactMessage> {
  unreadCount: number;
}

export interface SiteSocial {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export interface BannerSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface BannerFigure {
  value: string;
  label: string;
}

export interface Banner {
  _id?: string;
  slides: BannerSlide[];
  fixedText?: string;
  rotatingPhrases?: string[];
  rotatingImage?: string;
  rotatingVisible?: boolean;
  figures?: BannerFigure[];
  pageBackgroundImage?: string;
  authBackgroundImage?: string;
}

export interface FeatureItem {
  icon?: string;
  name: string;
  details: string;
}

export interface FeaturesSection {
  _id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string;
  features: FeatureItem[];
  visible?: boolean;
}

export interface CountryItem {
  image?: string;
  title: string;
  subtitle?: string;
}

export interface CountriesSection {
  _id?: string;
  title?: string;
  backgroundImage?: string;
  countries: CountryItem[];
  visible?: boolean;
}

export interface VideoHighlightSection {
  _id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonLink?: string;
  videoUrl?: string;
  visible?: boolean;
}

export interface SiteAbout {
  _id?: string;
  mission: string;
  vision: string;
  values: string[];
}

export interface SiteSegments {
  news: boolean;
  resources: boolean;
  programs: boolean;
  partners: boolean;
  events: boolean;
}

export interface LandingSectionText {
  eyebrow?: string;
  title?: string;
  description?: string;
}

export interface LandingSections {
  events?: LandingSectionText;
  news?: LandingSectionText;
  programs?: LandingSectionText;
  partners?: LandingSectionText;
  resources?: LandingSectionText;
}

export interface SiteConfig {
  _id: string;
  orgName: string;
  tagline: string;
  description?: string;
  logo?: string;
  favicon?: string;
  ogImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  primaryColor?: string;
  secondaryColor?: string;
  social?: SiteSocial;
  segments?: SiteSegments;
  landingSections?: LandingSections;
}

export interface StatsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  todayPageViews: number;
  todayVisitors: number;
}

export interface DailyStat {
  date: string;
  pageViews: number;
  visits: number;
}

export interface TopPage {
  path: string;
  count: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  consultants: number;
  users: number;
}

export interface UsersListMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UsersListResult {
  data: AdminUser[];
  meta: UsersListMeta;
  stats: UserStats;
}

export interface UserLogEntry {
  id: string;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface UserLogsResult {
  data: UserLogEntry[];
  meta: UsersListMeta;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceLabel?: string;
  metadata?: Record<string, unknown>;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogsResult {
  data: AuditLogEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
  };
}

export type EventStatus = 'soon' | 'currently' | 'ended';

export interface EventPanelist {
  photo?: string;
  name: string;
  title?: string;
}

export interface EventSocialLinks {
  facebook?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
}

export interface SeedEvent {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  location?: string;
  program?: string;
  socialLinks?: EventSocialLinks;
  phone1?: string;
  phone2?: string;
  email?: string;
  panelists?: EventPanelist[];
  registrationLink?: string;
  isVisibleOnLanding: boolean;
  createdAt: string;
  updatedAt?: string;
}
