export type DashboardRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  partnerRequests: boolean;
  newPlotAlerts: boolean;
  marketingEmails: boolean;
  loginAlerts: boolean;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'super_admin' | 'user' | 'customer' | 'admin';
  isActive: boolean;
  dashboardRequestStatus?: DashboardRequestStatus;
  dashboardRequestDocument?: string;
  dashboardRequestNote?: string;
  dashboardRequestReviewedAt?: string;
  status?: 'active' | 'inactive';
  totalBookings?: number;
  joinedAt?: string;
  phone?: string;
  companyName?: string;
  designation?: string;
  preferredLocale?: 'en' | 'mr';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  avatar?: string;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
}

export interface ProfileStats {
  totalLayouts: number;
  totalPlots: number;
  soldPlots: number;
  totalPartners: number;
}

export interface ProfileActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface UserListResponse {
  users: User[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface LoginHistoryEntry {
  id: string;
  userId: string | null;
  username: string;
  userName: string | null;
  userEmail: string | null;
  loginTime: string;
  logoutTime: string | null;
  sessionDuration: number | null;
  sessionDurationFormatted: string | null;
  loginStatus: 'success' | 'failed';
  failureReason: string | null;
  ipAddress: string | null;
  browser: string | null;
  device: string | null;
  createdAt: string;
}

export interface LoginHistoryListResponse {
  entries: LoginHistoryEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface UserDetailResponse {
  user: User;
  bookings: Booking[];
}

export interface UserLayoutsResponse {
  user: { id: string; name: string; email: string; role: string };
  owned: UserLayoutItem[];
  partner: UserLayoutItem[];
}

export interface UserLayoutItem {
  id: string;
  name: string;
  location: string;
  status: string;
  plotCount: number;
  ownerId?: string | null;
  partnerId?: string;
  addedAt?: string;
}

export interface ActivityLogEntry {
  id: string;
  type: string;
  message: string;
  user: { id: string; name: string; email: string } | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogResponse {
  activities: ActivityLogEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface TransferOwnershipResponse {
  layout: {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    previousOwnerName: string | null;
  };
}

export interface PlotStats {
  total: number;
  available: number;
  booked: number;
  sold: number;
  reserved?: number;
  underConstruction?: number;
  constructionCompleted?: number;
}

export type PropertyGisType = 'layout' | 'plot' | 'farm' | 'land' | 'bungalow' | 'row_house';

export type AreaUnit = 'sqft' | 'sqm' | 'acre' | 'hectare' | 'plots';

export interface PropertyArea {
  value: number;
  unit: AreaUnit | string;
  display?: string;
}

export interface PropertyGisFields {
  propertyType?: PropertyGisType;
  propertyName?: string;
  propertyNumber?: string;
  area?: PropertyArea;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Layout extends PropertyGisFields {
  _id: string;
  name: string;
  nameMr?: string;
  description: string;
  location: string;
  locationMr?: string;
  coordinates?: { lat?: number; lng?: number };
  imageUrl: string;
  images?: string[];
  totalPlots: number;
  status: 'active' | 'inactive';
  createdBy?: string;
  ownerId?: string;
  isOwner?: boolean;
  isPartner?: boolean;
  canManagePlots?: boolean;
  canManageDocuments?: boolean;
  partnerCount?: number;
  ownerName?: string;
  ownerEmail?: string;
  availablePlots?: number;
  startingPrice?: number | null;
  price?: number | null;
  plotStats?: PlotStats;
  plots?: Plot[];
  contactUser?: PropertyContactUser | null;
  contactAssignment?: PropertyContactAssignmentMeta | null;
  mapCoordinates?: { lat: number; lng: number } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LayoutPartnerUser {
  _id: string;
  name: string;
  email: string;
  role: User['role'];
}

export interface LayoutPartner {
  _id: string;
  layoutId?: string;
  user: LayoutPartnerUser;
  addedBy?: LayoutPartnerUser;
  addedAt?: string;
}

export interface LayoutPartnersResponse {
  ownerId: string;
  isOwner: boolean;
  partners: LayoutPartner[];
}

export interface Plot extends PropertyGisFields {
  _id: string;
  layoutId: string | Layout;
  plotNumber: string;
  size: string;
  price: number | null;
  facing?: 'North' | 'South' | 'East' | 'West';
  status: 'available' | 'booked' | 'sold' | 'reserved';
  constructionStatus?: 'empty_plot' | 'under_construction' | 'construction_completed';
  coordinates: { x: number; y: number };
  mapCoordinates?: { lat: number; lng: number } | null;
  description: string;
}

export interface PropertyContactUser {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  companyName?: string;
  avatar?: string;
  designation?: string;
}

export interface PropertyContactAssignmentMeta {
  assignedUserId: string;
  updatedAt?: string;
}

export type PropertyContactEntityType =
  | 'layout'
  | 'plot'
  | 'farm'
  | 'land'
  | 'bungalow'
  | 'row_house';

export interface PropertyContactHistoryEntry {
  _id: string;
  entityType: PropertyContactEntityType;
  entityId: string;
  action: 'assigned' | 'updated' | 'removed';
  note?: string;
  createdAt: string;
  assignedUserId?: PropertyContactUser | null;
  previousUserId?: PropertyContactUser | null;
  performedBy?: { _id: string; name: string; email: string };
}

export interface Booking {
  _id: string;
  plotId?: string;
  layoutId?: string;
  userId?: string;
  plot: Plot;
  layout: Layout;
  user?: User;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

export interface Content {
  _id: string;
  section: 'homepage' | 'about' | 'contact' | 'footer';
  title: string;
  subtitle: string;
  body: string;
  heroImage: string;
  metadata: Record<string, unknown>;
}

export interface Notification {
  _id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'booking' | 'approval' | 'rejection' | 'info' | 'error';
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface RecentBooking {
  id: string;
  userName: string;
  plotNumber: string;
  layoutName: string;
  status: string;
  date: string;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  date: string;
}

export interface MonthlyBooking {
  month: string;
  year: number;
  monthNumber: number;
  count: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalLayouts: number;
  totalPlots: number;
  availablePlots: number;
  bookedPlots: number;
  soldPlots: number;
  reservedPlots: number;
  underConstructionPlots: number;
  constructionCompletedPlots: number;
  recentBookings: RecentBooking[];
  recentUsers: RecentUser[];
  monthlyBookings: MonthlyBooking[];
}

export interface StartupDashboardSummary {
  totalLayouts: number;
  totalPlots: number;
  totalFarms: number;
  totalLands: number;
  totalRowHouses: number;
  totalBungalows: number;
}

export interface StartupLayoutActivity {
  id: string;
  name: string;
  location: string;
  status: string;
  date: string;
}

export interface StartupPlotActivity {
  id: string;
  plotNumber: string;
  status: string;
  price: number | null;
  layoutId: string;
  layoutName: string;
  date: string;
}

export interface StartupDashboardData {
  summary: StartupDashboardSummary;
  recentActivity: {
    recentlyUpdatedLayouts: StartupLayoutActivity[];
    recentlyBookedSoldPlots: StartupPlotActivity[];
    recentlyAddedLayouts: StartupLayoutActivity[];
  };
}

export type DashboardSearchEntityType =
  | 'layout'
  | 'plot'
  | 'farm'
  | 'land'
  | 'bungalow'
  | 'row_house';

export interface DashboardSearchResult {
  id: string;
  type: DashboardSearchEntityType;
  title: string;
  subtitle: string;
  layoutId: string;
  layoutName: string;
  status: string;
  date: string;
}

export interface DashboardSearchResponse {
  results: DashboardSearchResult[];
  pagination: LayoutListPagination;
}

export interface LayoutListPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ManagedLayoutsResponse {
  layouts: Layout[];
  pagination: LayoutListPagination;
}

export interface LayoutCustomer {
  bookingId: string;
  bookingStatus: 'pending' | 'approved' | 'rejected';
  plotId: string;
  plotNumber: string;
  plotStatus: string;
  plotPrice: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  bookedAt: string;
}

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card' | 'other';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface PaymentRecord {
  _id: string;
  receiptNumber: string;
  bookingId: string;
  layoutId: string;
  plotId: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNumber: string;
  remarks: string;
  status: PaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recordedBy: string;
  recordedByUser?: { _id: string; name: string; email?: string } | null;
  layout?: { name: string; location?: string; nameMr?: string; locationMr?: string };
  plot?: { plotNumber: string; price?: number; size?: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  bookingId: string;
  plotPrice: number;
  totalPaid: number;
  balanceDue: number;
  paymentCount: number;
  plotNumber?: string;
  customerName?: string;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  summary: PaymentSummary;
}

export interface PaymentsListResponse {
  payments: PaymentRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface BillingProfile {
  _id: string;
  userId: string;
  companyName: string;
  gstNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  logoUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type EstimateDiscountType = 'none' | 'percent' | 'fixed';

export interface EstimateLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface EstimateIssuer {
  companyName?: string;
  gstNumber?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bankAccountName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  logoUrl?: string;
}

export interface EstimateRecord {
  _id: string;
  estimateNumber: string;
  layoutId: string;
  bookingId?: string | null;
  plotId?: string | null;
  propertyId?: string | null;
  entityType?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  propertyLabel: string;
  propertyDetails: string;
  lineItems: EstimateLineItem[];
  subtotal: number;
  discountType: EstimateDiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil?: string | null;
  status: EstimateStatus;
  notes: string;
  terms: string;
  issuer: EstimateIssuer;
  createdBy: string;
  createdByUser?: { _id: string; name: string; email?: string } | null;
  layout?: { name: string; location?: string };
  plot?: { plotNumber: string; price?: number; size?: string };
  createdAt: string;
  updatedAt: string;
}

export interface EstimatesListResponse {
  estimates: EstimateRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type BuyerCategory =
  | 'plot_buyer'
  | 'farm_buyer'
  | 'land_buyer'
  | 'row_house_buyer'
  | 'bungalow_buyer';

export type CustomerStatus = 'active' | 'archived';
export type CustomerKycStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export interface CustomerAssignment {
  _id?: string;
  entityType: 'plot' | 'farm' | 'land' | 'bungalow' | 'row_house';
  layoutId: string;
  plotId?: string | null;
  propertyId?: string | null;
  bookingId?: string | null;
  label: string;
  price: number | null;
  dealStatus: string;
  assignedAt?: string;
}

export interface CustomerRecord {
  _id: string;
  userId?: string | null;
  buyerCategory: BuyerCategory;
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  kycStatus: CustomerKycStatus;
  pan: string;
  aadhaarLast4: string;
  gstNumber: string;
  kycNotes: string;
  status: CustomerStatus;
  archivedAt?: string | null;
  archiveReason?: string;
  primaryLayoutId: string;
  assignments: CustomerAssignment[];
  notes: string;
  tags: string[];
  source: string;
  layout?: { name: string; location?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDocumentRecord {
  _id: string;
  customerId: string;
  layoutId: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface CustomerDetailResponse {
  customer: CustomerRecord;
  bookings: Array<{
    _id: string;
    status: string;
    customerName: string;
    plotId?: { plotNumber?: string; price?: number };
    layoutId?: { name?: string };
    createdAt: string;
  }>;
  payments: PaymentRecord[];
  documents: CustomerDocumentRecord[];
}

export interface CustomersListResponse {
  customers: CustomerRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export type SitePhotoEntityType = 'layout' | 'plot' | 'farm' | 'land' | 'bungalow' | 'row_house';
export type SitePhotoSource = 'camera' | 'gallery' | 'upload';

export interface SitePhotoRecord {
  _id: string;
  entityType: SitePhotoEntityType;
  entityId: string;
  layoutId?: string | null;
  imageUrl: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string | null;
  caption: string;
  source: SitePhotoSource;
  uploadedBy: string;
  uploadedByUser?: { _id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type ExternalLinkEntityType = SitePhotoEntityType;

export type ExternalLinkCategory =
  | '7_12_extract'
  | 'measurement_map'
  | 'google_maps'
  | 'google_drive'
  | 'other_documents'
  | 'custom';

export interface ExternalLinkRecord {
  _id: string;
  entityType: ExternalLinkEntityType;
  entityId: string;
  layoutId?: string | null;
  title: string;
  url: string;
  category: ExternalLinkCategory;
  categoryLabel?: string;
  description: string;
  sortOrder: number;
  createdBy: string;
  createdByUser?: { _id: string; name: string } | null;
  updatedBy?: string | null;
  updatedByUser?: { _id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutLinkedProperty {
  _id: string;
  name: string;
  propertyNumber: string;
  propertyType: PropertyType;
  area: PropertyArea;
  price: number | null;
  status: PropertyStatus;
  description?: string;
}

export interface LayoutAdminDetail extends Layout {
  plots: Plot[];
  linkedProperties: LayoutLinkedProperty[];
  partners: LayoutPartner[];
  customers: LayoutCustomer[];
  documentsSummary: {
    fileCount: number;
    folderCount: number;
  };
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  canManageContact?: boolean;
  canManagePayments?: boolean;
  canManageEstimates?: boolean;
  canManageSitePhotos?: boolean;
  canManageExternalLinks?: boolean;
  canManagePricing?: boolean;
  contactHistory?: PropertyContactHistoryEntry[];
}

export type PricingEntityType = PropertyType;

export type PriceUpdateReason =
  | 'market_value'
  | 'location'
  | 'customer_requirements'
  | 'manual';

export interface PriceHistoryEntry {
  _id: string;
  entityType: PricingEntityType;
  entityId: string;
  entityName: string;
  layoutId?: string | null;
  previousPrice: number | null;
  newPrice: number | null;
  updateReason: PriceUpdateReason;
  notes?: string;
  updatedBy?: { _id: string; name: string; email?: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PublicStats {
  totalLayouts: number;
  totalPlots: number;
  availablePlots: number;
  happyCustomers: number;
  completedBookings: number;
}

export interface Activity {
  _id: string;
  type: string;
  message: string;
  user?: User;
  createdAt: string;
}

export type PropertyType =
  | 'layout'
  | 'plot'
  | 'farm'
  | 'land'
  | 'bungalow'
  | 'row_house';

export type PropertyStatus =
  | 'available'
  | 'booked'
  | 'sold'
  | 'reserved'
  | 'active'
  | 'inactive';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface MapProperty {
  id: string;
  name: string;
  propertyNumber: string;
  propertyType: PropertyType;
  area: PropertyArea;
  price: number | null;
  status: PropertyStatus;
  constructionStatus?: 'empty_plot' | 'under_construction' | 'construction_completed';
  latitude: number;
  longitude: number;
  boundary: LatLngPoint[] | null;
  parentPropertyId: string | null;
  linkedLayoutId?: string | null;
  linkedPlotId?: string | null;
  address?: string | null;
  contactUser?: PropertyContactUser | null;
}

export interface MapPropertiesResponse {
  properties: MapProperty[];
  total: number;
}

export interface Property extends MapProperty {
  _id: string;
  description: string;
  isActive: boolean;
  boundaryPath: LatLngPoint[] | null;
  linkedLayoutId?: string | null;
  linkedPlotId?: string | null;
  createdBy?: string | { _id: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyListResponse {
  properties: Property[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PropertyMeta {
  propertyTypes: PropertyType[];
  statuses: PropertyStatus[];
  areaUnits: AreaUnit[];
}
