import { getAccessToken, AuthConfig } from "./auth.js";

const API_BASE_URL = "https://api.searchads.apple.com/api/v5";

export interface ApiClientConfig {
  auth: AuthConfig;
  orgId: string;
}

export interface ApiError {
  messageCode: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    totalResults: number;
    startIndex: number;
    itemsPerPage: number;
  };
  error?: ApiError[] | null;
}

export interface Selector {
  conditions?: Array<{
    field: string;
    operator: "EQUALS" | "IN" | "LESS_THAN" | "GREATER_THAN" | "STARTSWITH" | "CONTAINS_ANY" | "CONTAINS_ALL";
    values: string[];
  }>;
  fields?: string[];
  orderBy?: Array<{
    field: string;
    sortOrder: "ASCENDING" | "DESCENDING";
  }>;
  pagination?: {
    offset: number;
    limit: number;
  };
}

export class AppleAdsClient {
  private config: ApiClientConfig;
  
  constructor(config: ApiClientConfig) {
    this.config = config;
  }
  
  /**
   * Get the authorization headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const accessToken = await getAccessToken(this.config.auth);
    return {
      "Authorization": `Bearer ${accessToken}`,
      "X-AP-Context": `orgId=${this.config.orgId}`,
      "Content-Type": "application/json",
    };
  }
  
  /**
   * Make a GET request to the API
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const headers = await this.getHeaders();
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Make a PUT request to the API
   */
  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Make a DELETE request to the API
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });
    
    return this.handleResponse<T>(response);
  }
  
  /**
   * Handle API response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const text = await response.text();
    
    if (!text) {
      // Some endpoints return empty response on success
      return { data: null as T };
    }
    
    let json: ApiResponse<T>;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text}`);
    }
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (json.error) {
        if (Array.isArray(json.error)) {
          errorMessage = json.error.map(e => `${e.messageCode}: ${e.message}${e.field ? ` (field: ${e.field})` : ''}`).join("; ");
        } else if (typeof json.error === 'object') {
          const err = json.error as { messageCode?: string; message?: string };
          errorMessage = `${err.messageCode || 'ERROR'}: ${err.message || JSON.stringify(json.error)}`;
        } else {
          errorMessage = String(json.error);
        }
      } else {
        // Include raw response for debugging if no error field
        errorMessage += ` - Response: ${text}`;
      }
      throw new Error(errorMessage);
    }
    
    return json;
  }
  
  // ============================================
  // Account & Discovery Methods
  // ============================================
  
  /**
   * Get User ACL - returns organizations and roles
   */
  async getUserAcl(): Promise<ApiResponse<Array<{
    orgId: number;
    orgName: string;
    currency: string;
    paymentModel: string;
    roleNames: string[];
  }>>> {
    // ACL endpoint doesn't require orgId in header
    const accessToken = await getAccessToken(this.config.auth);
    const response = await fetch(`${API_BASE_URL}/acls`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return this.handleResponse(response);
  }
  
  /**
   * Search for apps to promote
   */
  async searchApps(query: string, options?: {
    limit?: number;
    returnOwnedApps?: boolean;
  }): Promise<ApiResponse<Array<{
    adamId: number;
    appName: string;
    developerName: string;
    countryCodes: string[];
  }>>> {
    const params: Record<string, string> = { query };
    if (options?.limit) params.limit = options.limit.toString();
    if (options?.returnOwnedApps !== undefined) {
      params.returnOwnedApps = options.returnOwnedApps.toString();
    }
    return this.get("/search/apps", params);
  }
  
  /**
   * Search for geo locations
   */
  async searchGeo(query: string, options?: {
    entity?: "Country" | "AdminArea" | "Locality";
    countryCode?: string;
    limit?: number;
  }): Promise<ApiResponse<Array<{
    id: string;
    entity: string;
    displayName: string;
  }>>> {
    const params: Record<string, string> = { query };
    if (options?.entity) params.entity = options.entity;
    if (options?.countryCode) params.countryCode = options.countryCode;
    if (options?.limit) params.limit = options.limit.toString();
    return this.get("/search/geo", params);
  }
  
  // ============================================
  // Campaign Methods
  // ============================================
  
  /**
   * Create a campaign
   */
  async createCampaign(campaign: {
    name: string;
    adamId: number;
    countriesOrRegions: string[];
    budgetAmount: { amount: string; currency: string };
    dailyBudgetAmount?: { amount: string; currency: string };
    adChannelType?: string;
    supplySources?: string[];
  }): Promise<ApiResponse<{ id: number }>> {
    const payload = {
      ...campaign,
      adChannelType: campaign.adChannelType || "SEARCH",
      supplySources: campaign.supplySources || ["APPSTORE_SEARCH_RESULTS"],
    };
    return this.post("/campaigns", payload);
  }
  
  /**
   * Get campaigns
   */
  async getCampaigns(campaignId?: number): Promise<ApiResponse<unknown>> {
    const endpoint = campaignId ? `/campaigns/${campaignId}` : "/campaigns";
    return this.get(endpoint);
  }
  
  /**
   * Find campaigns with selector
   */
  async findCampaigns(selector?: Selector): Promise<ApiResponse<unknown[]>> {
    return this.post("/campaigns/find", selector || {});
  }
  
  /**
   * Update a campaign
   */
  async updateCampaign(campaignId: number, updates: {
    name?: string;
    budgetAmount?: { amount: string; currency: string };
    dailyBudgetAmount?: { amount: string; currency: string };
    countriesOrRegions?: string[];
    status?: "ENABLED" | "PAUSED";
    clearGeoTargetingOnCountryOrRegionChange?: boolean;
  }): Promise<ApiResponse<unknown>> {
    const { clearGeoTargetingOnCountryOrRegionChange, ...campaign } = updates;
    const payload = {
      campaign,
      clearGeoTargetingOnCountryOrRegionChange: clearGeoTargetingOnCountryOrRegionChange ?? false,
    };
    return this.put(`/campaigns/${campaignId}`, payload);
  }
  
  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: number): Promise<ApiResponse<unknown>> {
    return this.delete(`/campaigns/${campaignId}`);
  }
  
  // ============================================
  // Ad Group Methods
  // ============================================
  
  /**
   * Create an ad group
   */
  async createAdGroup(campaignId: number, adGroup: {
    name: string;
    defaultCpcBid: { amount: string; currency: string };
    startTime: string;
    endTime?: string;
    cpaGoal?: { amount: string; currency: string };
    automatedKeywordsOptIn?: boolean;
    targetingDimensions?: {
      age?: { included: Array<{ minAge: number; maxAge?: number }> };
      gender?: { included: string[] };
      deviceClass?: { included: string[] };
      daypart?: { userTime: { included: number[] } };
      adminArea?: { included: string[] };
      locality?: { included: string[] };
      appDownloaders?: { included: number[]; excluded: number[] };
    };
    status?: "ENABLED" | "PAUSED";
  }): Promise<ApiResponse<{ id: number }>> {
    return this.post(`/campaigns/${campaignId}/adgroups`, adGroup);
  }
  
  /**
   * Get ad groups
   */
  async getAdGroups(campaignId: number, adGroupId?: number): Promise<ApiResponse<unknown>> {
    const endpoint = adGroupId
      ? `/campaigns/${campaignId}/adgroups/${adGroupId}`
      : `/campaigns/${campaignId}/adgroups`;
    return this.get(endpoint);
  }
  
  /**
   * Find ad groups with selector
   */
  async findAdGroups(campaignId: number, selector?: Selector): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/adgroups/find`, selector || {});
  }
  
  /**
   * Update an ad group
   */
  async updateAdGroup(campaignId: number, adGroupId: number, updates: {
    name?: string;
    defaultCpcBid?: { amount: string; currency: string };
    cpaGoal?: { amount: string; currency: string };
    startTime?: string;
    endTime?: string;
    automatedKeywordsOptIn?: boolean;
    targetingDimensions?: {
      age?: { included: Array<{ minAge: number; maxAge?: number }> } | null;
      gender?: { included: string[] } | null;
      deviceClass?: { included: string[] } | null;
      daypart?: { userTime: { included: number[] } } | null;
      country?: { included: string[] } | null;
      adminArea?: { included: string[] } | null;
      locality?: { included: string[] } | null;
      appDownloaders?: { included: number[]; excluded: number[] } | null;
    };
    status?: "ENABLED" | "PAUSED";
  }): Promise<ApiResponse<unknown>> {
    return this.put(`/campaigns/${campaignId}/adgroups/${adGroupId}`, updates);
  }
  
  /**
   * Delete an ad group
   */
  async deleteAdGroup(campaignId: number, adGroupId: number): Promise<ApiResponse<unknown>> {
    return this.delete(`/campaigns/${campaignId}/adgroups/${adGroupId}`);
  }
  
  // ============================================
  // Targeting Keywords Methods
  // ============================================
  
  /**
   * Create targeting keywords
   */
  async createTargetingKeywords(campaignId: number, adGroupId: number, keywords: Array<{
    text: string;
    matchType: "BROAD" | "EXACT";
    bidAmount?: { amount: string; currency: string };
    status?: "ACTIVE" | "PAUSED";
  }>): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/adgroups/${adGroupId}/targetingkeywords/bulk`, keywords);
  }
  
  /**
   * Get targeting keywords
   */
  async getTargetingKeywords(campaignId: number, adGroupId: number, keywordId?: number): Promise<ApiResponse<unknown>> {
    const endpoint = keywordId
      ? `/campaigns/${campaignId}/adgroups/${adGroupId}/targetingkeywords/${keywordId}`
      : `/campaigns/${campaignId}/adgroups/${adGroupId}/targetingkeywords`;
    return this.get(endpoint);
  }
  
  /**
   * Find targeting keywords with selector
   */
  async findTargetingKeywords(campaignId: number, selector?: Selector): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/adgroups/targetingkeywords/find`, selector || {});
  }
  
  /**
   * Update targeting keywords
   */
  async updateTargetingKeywords(campaignId: number, adGroupId: number, keywords: Array<{
    id: number;
    bidAmount?: { amount: string; currency: string };
    status?: "ACTIVE" | "PAUSED";
  }>): Promise<ApiResponse<unknown[]>> {
    return this.put(`/campaigns/${campaignId}/adgroups/${adGroupId}/targetingkeywords/bulk`, keywords);
  }
  
  // ============================================
  // Campaign Negative Keywords Methods
  // ============================================
  
  /**
   * Create campaign negative keywords
   */
  async createCampaignNegativeKeywords(campaignId: number, keywords: Array<{
    text: string;
    matchType: "BROAD" | "EXACT";
  }>): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/negativekeywords/bulk`, keywords);
  }
  
  /**
   * Get campaign negative keywords
   */
  async getCampaignNegativeKeywords(campaignId: number, keywordId?: number): Promise<ApiResponse<unknown>> {
    const endpoint = keywordId
      ? `/campaigns/${campaignId}/negativekeywords/${keywordId}`
      : `/campaigns/${campaignId}/negativekeywords`;
    return this.get(endpoint);
  }
  
  /**
   * Find campaign negative keywords with selector
   */
  async findCampaignNegativeKeywords(campaignId: number, selector?: Selector): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/negativekeywords/find`, selector || {});
  }
  
  /**
   * Update campaign negative keywords
   */
  async updateCampaignNegativeKeywords(campaignId: number, keywords: Array<{
    id: number;
    status: "ACTIVE" | "PAUSED";
  }>): Promise<ApiResponse<unknown[]>> {
    return this.put(`/campaigns/${campaignId}/negativekeywords/bulk`, keywords);
  }
  
  /**
   * Delete campaign negative keywords
   */
  async deleteCampaignNegativeKeywords(campaignId: number, keywordIds: number[]): Promise<ApiResponse<unknown>> {
    return this.post(`/campaigns/${campaignId}/negativekeywords/delete/bulk`, keywordIds);
  }
  
  // ============================================
  // Ad Group Negative Keywords Methods
  // ============================================
  
  /**
   * Create ad group negative keywords
   */
  async createAdGroupNegativeKeywords(campaignId: number, adGroupId: number, keywords: Array<{
    text: string;
    matchType: "BROAD" | "EXACT";
  }>): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/adgroups/${adGroupId}/negativekeywords/bulk`, keywords);
  }
  
  /**
   * Get ad group negative keywords
   */
  async getAdGroupNegativeKeywords(campaignId: number, adGroupId: number, keywordId?: number): Promise<ApiResponse<unknown>> {
    const endpoint = keywordId
      ? `/campaigns/${campaignId}/adgroups/${adGroupId}/negativekeywords/${keywordId}`
      : `/campaigns/${campaignId}/adgroups/${adGroupId}/negativekeywords`;
    return this.get(endpoint);
  }
  
  /**
   * Find ad group negative keywords with selector
   */
  async findAdGroupNegativeKeywords(campaignId: number, adGroupId: number, selector?: Selector): Promise<ApiResponse<unknown[]>> {
    return this.post(`/campaigns/${campaignId}/adgroups/${adGroupId}/negativekeywords/find`, selector || {});
  }
  
  /**
   * Update ad group negative keywords
   */
  async updateAdGroupNegativeKeywords(campaignId: number, adGroupId: number, keywords: Array<{
    id: number;
    status: "ACTIVE" | "PAUSED";
  }>): Promise<ApiResponse<unknown[]>> {
    return this.put(`/campaigns/${campaignId}/adgroups/${adGroupId}/negativekeywords/bulk`, keywords);
  }
  
  /**
   * Delete ad group negative keywords
   */
  async deleteAdGroupNegativeKeywords(campaignId: number, adGroupId: number, keywordIds: number[]): Promise<ApiResponse<unknown>> {
    return this.post(`/campaigns/${campaignId}/adgroups/${adGroupId}/negativekeywords/delete/bulk`, keywordIds);
  }
  
  // ============================================
  // Reporting Methods
  // ============================================
  
  /**
   * Get campaign level reports
   */
  async getCampaignReports(params: {
    startTime: string;
    endTime: string;
    selector?: Selector;
    groupBy?: string[];
    timeZone?: string;
    granularity?: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
    returnRowTotals?: boolean;
    returnGrandTotals?: boolean;
    returnRecordsWithNoMetrics?: boolean;
  }): Promise<ApiResponse<unknown>> {
    return this.post("/reports/campaigns", params);
  }
  
  /**
   * Get ad group level reports
   */
  async getAdGroupReports(campaignId: number, params: {
    startTime: string;
    endTime: string;
    selector?: Selector;
    groupBy?: string[];
    timeZone?: string;
    granularity?: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
    returnRowTotals?: boolean;
    returnGrandTotals?: boolean;
    returnRecordsWithNoMetrics?: boolean;
  }): Promise<ApiResponse<unknown>> {
    return this.post(`/reports/campaigns/${campaignId}/adgroups`, params);
  }
  
  /**
   * Get keyword level reports
   */
  async getKeywordReports(campaignId: number, params: {
    startTime: string;
    endTime: string;
    selector?: Selector;
    groupBy?: string[];
    timeZone?: string;
    granularity?: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
    returnRowTotals?: boolean;
    returnGrandTotals?: boolean;
    returnRecordsWithNoMetrics?: boolean;
  }): Promise<ApiResponse<unknown>> {
    return this.post(`/reports/campaigns/${campaignId}/keywords`, params);
  }
  
  /**
   * Get search terms level reports
   */
  async getSearchTermReports(campaignId: number, params: {
    startTime: string;
    endTime: string;
    selector?: Selector;
    groupBy?: string[];
    timeZone?: string;
    granularity?: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
    returnRowTotals?: boolean;
    returnGrandTotals?: boolean;
    returnRecordsWithNoMetrics?: boolean;
  }): Promise<ApiResponse<unknown>> {
    return this.post(`/reports/campaigns/${campaignId}/searchterms`, params);
  }
}

/**
 * Create a client instance from environment variables
 */
export function createClientFromEnv(): AppleAdsClient {
  const clientId = process.env.APPLE_ADS_CLIENT_ID;
  const teamId = process.env.APPLE_ADS_TEAM_ID;
  const keyId = process.env.APPLE_ADS_KEY_ID;
  const privateKeyPath = process.env.APPLE_ADS_PRIVATE_KEY_PATH;
  const orgId = process.env.APPLE_ADS_ORG_ID;
  
  if (!clientId || !teamId || !keyId || !privateKeyPath || !orgId) {
    throw new Error(
      "Missing required environment variables. Please set: " +
      "APPLE_ADS_CLIENT_ID, APPLE_ADS_TEAM_ID, APPLE_ADS_KEY_ID, " +
      "APPLE_ADS_PRIVATE_KEY_PATH, APPLE_ADS_ORG_ID"
    );
  }
  
  return new AppleAdsClient({
    auth: { clientId, teamId, keyId, privateKeyPath },
    orgId,
  });
}
