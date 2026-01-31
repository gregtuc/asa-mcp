// ============================================
// Money / Amount Types
// ============================================

export interface Money {
  amount: string;
  currency: string;
}

// ============================================
// Campaign Types
// ============================================

export interface Campaign {
  id: number;
  orgId: number;
  name: string;
  adamId: number;
  adChannelType: "SEARCH";
  supplySources: string[];
  budgetAmount: Money;
  dailyBudgetAmount?: Money;
  countriesOrRegions: string[];
  status: "ENABLED" | "PAUSED";
  servingStatus: "RUNNING" | "NOT_RUNNING";
  servingStateReasons?: string[];
  displayStatus: "RUNNING" | "ON_HOLD" | "PAUSED" | "DELETED";
  deleted: boolean;
  modificationTime: string;
  startTime?: string;
  endTime?: string;
  paymentModel?: "LOC" | "PAYG";
}

export interface CampaignCreate {
  name: string;
  adamId: number;
  countriesOrRegions: string[];
  budgetAmount: Money;
  dailyBudgetAmount?: Money;
  adChannelType?: "SEARCH";
  supplySources?: string[];
}

export interface CampaignUpdate {
  name?: string;
  budgetAmount?: Money;
  dailyBudgetAmount?: Money;
  countriesOrRegions?: string[];
  status?: "ENABLED" | "PAUSED";
}

// ============================================
// Ad Group Types
// ============================================

export interface TargetingDimensions {
  age?: {
    included: Array<{ minAge: number; maxAge?: number }>;
  } | null;
  gender?: {
    included: ("M" | "F")[];
  } | null;
  deviceClass?: {
    included: ("IPHONE" | "IPAD")[];
  } | null;
  daypart?: {
    userTime: {
      included: number[]; // 0-167 representing hours of the week
    };
  } | null;
  country?: {
    included: string[];
  } | null;
  adminArea?: {
    included: string[]; // e.g., "US|CA"
  } | null;
  locality?: {
    included: string[]; // e.g., "US|CA|Cupertino"
  } | null;
  appDownloaders?: {
    included: number[];
    excluded: number[];
  } | null;
}

export interface AdGroup {
  id: number;
  campaignId: number;
  orgId: number;
  name: string;
  defaultCpcBid: Money;
  cpaGoal?: Money;
  startTime: string;
  endTime?: string;
  automatedKeywordsOptIn: boolean;
  targetingDimensions?: TargetingDimensions;
  status: "ENABLED" | "PAUSED";
  servingStatus: "RUNNING" | "NOT_RUNNING";
  servingStateReasons?: string[];
  displayStatus: "RUNNING" | "ON_HOLD" | "PAUSED" | "DELETED";
  deleted: boolean;
  modificationTime: string;
}

export interface AdGroupCreate {
  name: string;
  defaultCpcBid: Money;
  startTime: string;
  endTime?: string;
  cpaGoal?: Money;
  automatedKeywordsOptIn?: boolean;
  targetingDimensions?: TargetingDimensions;
  status?: "ENABLED" | "PAUSED";
}

export interface AdGroupUpdate {
  name?: string;
  defaultCpcBid?: Money;
  cpaGoal?: Money;
  startTime?: string;
  endTime?: string;
  automatedKeywordsOptIn?: boolean;
  targetingDimensions?: TargetingDimensions;
  status?: "ENABLED" | "PAUSED";
}

// ============================================
// Keyword Types
// ============================================

export interface Keyword {
  id: number;
  adGroupId: number;
  text: string;
  matchType: "BROAD" | "EXACT";
  bidAmount?: Money;
  status: "ACTIVE" | "PAUSED";
  deleted: boolean;
  modificationTime: string;
}

export interface KeywordCreate {
  text: string;
  matchType: "BROAD" | "EXACT";
  bidAmount?: Money;
  status?: "ACTIVE" | "PAUSED";
}

export interface KeywordUpdate {
  id: number;
  bidAmount?: Money;
  status?: "ACTIVE" | "PAUSED";
}

// ============================================
// Negative Keyword Types
// ============================================

export interface NegativeKeyword {
  id: number;
  campaignId?: number;
  adGroupId?: number;
  text: string;
  matchType: "BROAD" | "EXACT";
  status: "ACTIVE" | "PAUSED";
  deleted: boolean;
  modificationTime: string;
}

export interface NegativeKeywordCreate {
  text: string;
  matchType: "BROAD" | "EXACT";
}

export interface NegativeKeywordUpdate {
  id: number;
  status: "ACTIVE" | "PAUSED";
}

// ============================================
// Selector / Query Types
// ============================================

export type ConditionOperator = 
  | "EQUALS"
  | "IN"
  | "LESS_THAN"
  | "GREATER_THAN"
  | "STARTSWITH"
  | "CONTAINS_ANY"
  | "CONTAINS_ALL";

export interface Condition {
  field: string;
  operator: ConditionOperator;
  values: string[];
}

export interface OrderBy {
  field: string;
  sortOrder: "ASCENDING" | "DESCENDING";
}

export interface Pagination {
  offset: number;
  limit: number;
}

export interface Selector {
  conditions?: Condition[];
  fields?: string[];
  orderBy?: OrderBy[];
  pagination?: Pagination;
}

// ============================================
// Report Types
// ============================================

export interface ReportingRequest {
  startTime: string; // yyyy-mm-dd
  endTime: string; // yyyy-mm-dd
  selector?: Selector;
  groupBy?: string[];
  timeZone?: "ORTZ" | "UTC";
  granularity?: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
  returnRowTotals?: boolean;
  returnGrandTotals?: boolean;
  returnRecordsWithNoMetrics?: boolean;
}

export interface SpendRow {
  avgCPA: Money;
  avgCPT: Money;
  conversionRate: number;
  impressions: number;
  installs: number;
  latOnInstalls: number;
  latOffInstalls: number;
  localSpend: Money;
  newDownloads: number;
  redownloads: number;
  taps: number;
  ttr: number;
}

export interface ExtendedSpendRow extends SpendRow {
  date: string;
}

// ============================================
// User ACL Types
// ============================================

export interface UserAcl {
  orgId: number;
  orgName: string;
  currency: string;
  paymentModel: "LOC" | "PAYG" | "";
  roleNames: string[];
}

// ============================================
// App Search Types
// ============================================

export interface AppInfo {
  adamId: number;
  appName: string;
  developerName: string;
  countryOrRegionCodes: string[];
}

// ============================================
// Geo Search Types
// ============================================

export interface GeoLocation {
  id: string;
  entity: "Country" | "AdminArea" | "Locality";
  displayName: string;
}
