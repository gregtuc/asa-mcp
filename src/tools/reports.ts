import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Shared Report Schema Components
// ============================================

const reportSelectorSchema = z.object({
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH", "CONTAINS_ANY", "CONTAINS_ALL"]),
    values: z.array(z.string()),
  })).optional(),
  orderBy: z.object({
    field: z.string(),
    sortOrder: z.enum(["ASCENDING", "DESCENDING"]),
  }).optional(),
  limit: z.number().optional().default(1000),
  offset: z.number().optional().default(0),
}).optional();

const baseReportSchema = z.object({
  startTime: z.string().describe("Start date (yyyy-mm-dd)"),
  endTime: z.string().describe("End date (yyyy-mm-dd)"),
  selector: reportSelectorSchema,
  groupBy: z.array(z.string()).optional()
    .describe("Group results by dimension (e.g., countryOrRegion, deviceClass, ageRange, gender)"),
  timeZone: z.enum(["ORTZ", "UTC"]).optional().default("ORTZ")
    .describe("Time zone (ORTZ = org time zone, UTC)"),
  granularity: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY"]).optional()
    .describe("Time granularity for report data"),
  returnRowTotals: z.boolean().optional().default(false)
    .describe("Include row totals"),
  returnGrandTotals: z.boolean().optional().default(false)
    .describe("Include grand totals"),
  returnRecordsWithNoMetrics: z.boolean().optional().default(false)
    .describe("Include records with no metrics"),
});

// ============================================
// Tool Schemas
// ============================================

export const getCampaignReportsSchema = baseReportSchema;

export const getAdGroupReportsSchema = baseReportSchema.extend({
  campaignId: z.number().describe("Campaign ID"),
});

export const getKeywordReportsSchema = baseReportSchema.extend({
  campaignId: z.number().describe("Campaign ID"),
});

export const getSearchTermReportsSchema = baseReportSchema.extend({
  campaignId: z.number().describe("Campaign ID"),
});

// ============================================
// Tool Definitions
// ============================================

export const reportToolDefinitions = [
  {
    name: "get_campaign_reports",
    description: "Get campaign-level performance reports with metrics like impressions, taps, installs, spend, CPA, and CPT. Can group by country, device, age, gender.",
    inputSchema: {
      type: "object" as const,
      properties: {
        startTime: { type: "string", description: "Start date (yyyy-mm-dd)" },
        endTime: { type: "string", description: "End date (yyyy-mm-dd)" },
        selector: {
          type: "object",
          description: "Optional filter and pagination settings",
          properties: {
            conditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  operator: { type: "string", enum: ["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH", "CONTAINS_ANY", "CONTAINS_ALL"] },
                  values: { type: "array", items: { type: "string" } },
                },
                required: ["field", "operator", "values"],
              },
            },
            orderBy: {
              type: "object",
              properties: {
                field: { type: "string" },
                sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
              },
            },
            limit: { type: "number" },
            offset: { type: "number" },
          },
        },
        groupBy: { 
          type: "array", 
          items: { type: "string" },
          description: "Group by dimensions: countryOrRegion, deviceClass, ageRange, gender, adminArea, locality" 
        },
        timeZone: { type: "string", enum: ["ORTZ", "UTC"], description: "Time zone" },
        granularity: { 
          type: "string", 
          enum: ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"],
          description: "Time granularity" 
        },
        returnRowTotals: { type: "boolean", description: "Include row totals" },
        returnGrandTotals: { type: "boolean", description: "Include grand totals" },
        returnRecordsWithNoMetrics: { type: "boolean", description: "Include zero-metric records" },
      },
      required: ["startTime", "endTime"],
    },
  },
  {
    name: "get_adgroup_reports",
    description: "Get ad group-level performance reports for a campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        startTime: { type: "string", description: "Start date (yyyy-mm-dd)" },
        endTime: { type: "string", description: "End date (yyyy-mm-dd)" },
        selector: {
          type: "object",
          description: "Optional filter and pagination settings",
          properties: {
            conditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  operator: { type: "string", enum: ["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH"] },
                  values: { type: "array", items: { type: "string" } },
                },
                required: ["field", "operator", "values"],
              },
            },
            orderBy: {
              type: "object",
              properties: {
                field: { type: "string" },
                sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
              },
            },
            limit: { type: "number" },
            offset: { type: "number" },
          },
        },
        groupBy: { 
          type: "array", 
          items: { type: "string" },
          description: "Group by dimensions" 
        },
        timeZone: { type: "string", enum: ["ORTZ", "UTC"] },
        granularity: { type: "string", enum: ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"] },
        returnRowTotals: { type: "boolean" },
        returnGrandTotals: { type: "boolean" },
        returnRecordsWithNoMetrics: { type: "boolean" },
      },
      required: ["campaignId", "startTime", "endTime"],
    },
  },
  {
    name: "get_keyword_reports",
    description: "Get keyword-level performance reports for a campaign. Shows performance metrics per targeting keyword.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        startTime: { type: "string", description: "Start date (yyyy-mm-dd)" },
        endTime: { type: "string", description: "End date (yyyy-mm-dd)" },
        selector: {
          type: "object",
          description: "Optional filter and pagination settings",
          properties: {
            conditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  operator: { type: "string", enum: ["EQUALS", "IN", "STARTSWITH"] },
                  values: { type: "array", items: { type: "string" } },
                },
                required: ["field", "operator", "values"],
              },
            },
            orderBy: {
              type: "object",
              properties: {
                field: { type: "string" },
                sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
              },
            },
            limit: { type: "number" },
            offset: { type: "number" },
          },
        },
        timeZone: { type: "string", enum: ["ORTZ", "UTC"] },
        granularity: { type: "string", enum: ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"] },
        returnRowTotals: { type: "boolean" },
        returnGrandTotals: { type: "boolean" },
        returnRecordsWithNoMetrics: { type: "boolean" },
      },
      required: ["campaignId", "startTime", "endTime"],
    },
  },
  {
    name: "get_searchterm_reports",
    description: "Get search term-level reports showing what users actually searched for. Useful for discovering new keywords and identifying negative keyword opportunities.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        startTime: { type: "string", description: "Start date (yyyy-mm-dd)" },
        endTime: { type: "string", description: "End date (yyyy-mm-dd)" },
        selector: {
          type: "object",
          description: "Optional filter and pagination settings",
          properties: {
            conditions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  operator: { type: "string", enum: ["EQUALS", "IN", "STARTSWITH"] },
                  values: { type: "array", items: { type: "string" } },
                },
                required: ["field", "operator", "values"],
              },
            },
            orderBy: {
              type: "object",
              properties: {
                field: { type: "string" },
                sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
              },
            },
            limit: { type: "number" },
            offset: { type: "number" },
          },
        },
        timeZone: { type: "string", enum: ["ORTZ", "UTC"] },
        granularity: { type: "string", enum: ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"] },
        returnRowTotals: { type: "boolean" },
        returnGrandTotals: { type: "boolean" },
        returnRecordsWithNoMetrics: { type: "boolean" },
      },
      required: ["campaignId", "startTime", "endTime"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

function buildReportParams(args: z.infer<typeof baseReportSchema>) {
  // selector is REQUIRED by the API - only include defined fields
  const selector: Record<string, unknown> = {
    pagination: { 
      offset: args.selector?.offset ?? 0, 
      limit: args.selector?.limit ?? 1000 
    },
    // orderBy is required - default to descending by impressions
    orderBy: args.selector?.orderBy 
      ? [args.selector.orderBy] 
      : [{ field: "impressions", sortOrder: "DESCENDING" }],
  };
  
  if (args.selector?.conditions) {
    selector.conditions = args.selector.conditions;
  }

  // Per Apple docs:
  // - If no granularity, returnRowTotals must be true
  // - If granularity is specified, returnGrandTotals must be false
  let returnRowTotals = args.returnRowTotals ?? false;
  let returnGrandTotals = args.returnGrandTotals ?? false;
  
  if (!args.granularity) {
    // No granularity: returnRowTotals must be true
    returnRowTotals = true;
  } else {
    // With granularity: returnGrandTotals must be false
    returnGrandTotals = false;
  }

  const params: Record<string, unknown> = {
    startTime: args.startTime,
    endTime: args.endTime,
    selector,
    returnRowTotals,
    returnGrandTotals,
    returnRecordsWithNoMetrics: args.returnRecordsWithNoMetrics ?? false,
  };
  
  // Only include optional fields if defined
  if (args.groupBy) params.groupBy = args.groupBy;
  if (args.timeZone) params.timeZone = args.timeZone;
  if (args.granularity) params.granularity = args.granularity;

  return params;
}

export async function handleGetCampaignReports(
  client: AppleAdsClient,
  args: z.infer<typeof getCampaignReportsSchema>
): Promise<string> {
  const params = buildReportParams(args) as Parameters<typeof client.getCampaignReports>[0];
  const result = await client.getCampaignReports(params);
  return JSON.stringify(result, null, 2);
}

export async function handleGetAdGroupReports(
  client: AppleAdsClient,
  args: z.infer<typeof getAdGroupReportsSchema>
): Promise<string> {
  const params = buildReportParams(args) as Parameters<typeof client.getAdGroupReports>[1];
  const result = await client.getAdGroupReports(args.campaignId, params);
  return JSON.stringify(result, null, 2);
}

export async function handleGetKeywordReports(
  client: AppleAdsClient,
  args: z.infer<typeof getKeywordReportsSchema>
): Promise<string> {
  const params = buildReportParams(args) as Parameters<typeof client.getKeywordReports>[1];
  const result = await client.getKeywordReports(args.campaignId, params);
  return JSON.stringify(result, null, 2);
}

export async function handleGetSearchTermReports(
  client: AppleAdsClient,
  args: z.infer<typeof getSearchTermReportsSchema>
): Promise<string> {
  const params = buildReportParams(args) as Parameters<typeof client.getSearchTermReports>[1];
  const result = await client.getSearchTermReports(args.campaignId, params);
  return JSON.stringify(result, null, 2);
}
