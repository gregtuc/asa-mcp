# Apple Search Ads MCP Server

A Model Context Protocol (MCP) server for the Apple Search Ads Campaign Management API. This server enables AI assistants (like Claude in Cursor) to manage your Apple Search Ads campaigns, ad groups, keywords, and reports programmatically.

## Features

- **Full Campaign Management**: Create, read, update, and delete campaigns
- **Ad Group Management**: Configure ad groups with targeting dimensions (age, gender, device, location, daypart)
- **Keyword Management**: Manage targeting keywords and negative keywords at campaign and ad group levels
- **Reporting**: Generate performance reports at campaign, ad group, keyword, and search term levels
- **OAuth 2.0 Authentication**: Secure JWT-based authentication with automatic token refresh

## Prerequisites

- An [Apple Search Ads](https://searchads.apple.com) account (you need an app in the App Store to advertise)
- Node.js 18+ **OR** Docker
- OpenSSL (for generating keys)

## Quick Start

### Option A: Run with Node.js

```bash
git clone https://github.com/yourusername/asa-mcp.git
cd asa-mcp
npm install
npm run build
```

### Option B: Run with Docker

```bash
git clone https://github.com/yourusername/asa-mcp.git
cd asa-mcp
npm install
npm run build
docker compose up --build
```

## Setup Guide

### Step 1: Create an API User in Apple Search Ads

Apple Search Ads requires a **separate API user** (not your main admin account) to access the API.

1. Sign in to [Apple Search Ads](https://searchads.apple.com) with your admin account
2. Go to **Account Settings** (click your name in the top right) > **User Management**
3. Click **Invite Users**
4. Fill in the new user details:
   - **Email**: Use a different email address (can be a `+` alias like `you+api@gmail.com`)
   - **First/Last Name**: Can be anything (e.g., "API User")
   - **Role**: Check **API Account Manager**
5. Click **Invite**

### Step 2: Generate Your API Keys

Run these commands to generate your private and public keys:

```bash
# Generate private key (keep this secret!)
openssl ecparam -genkey -name prime256v1 -noout -out private-key.pem

# Extract public key (this gets uploaded to Apple)
openssl ec -in private-key.pem -pubout -out public-key.pem

# Display public key to copy
cat public-key.pem
```

### Step 3: Upload Public Key to Apple Search Ads

1. Open an **incognito/private browser window** (important!)
2. Sign in to [Apple Search Ads](https://searchads.apple.com) with your **new API user** (not admin)
3. Go to **Account Settings** > **API**
4. Paste the entire contents of `public-key.pem` including:
   ```
   -----BEGIN PUBLIC KEY-----
   MFkw...(your key)...
   -----END PUBLIC KEY-----
   ```
5. Click **Save**
6. **Copy and save** the three values Apple shows you:
   - `clientId` (starts with `SEARCHADS.`)
   - `teamId` (starts with `SEARCHADS.`)
   - `keyId` (a UUID)

### Step 4: Find Your Organization ID

Your `orgId` is in the URL when logged into Apple Search Ads:
```
https://app-ads.apple.com/cm/app/123456789/...
                              ↑↑↑↑↑↑↑↑↑
                              This is your orgId
```

### Step 5: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
APPLE_ADS_CLIENT_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ADS_TEAM_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ADS_KEY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_ADS_PRIVATE_KEY_PATH=/absolute/path/to/private-key.pem
APPLE_ADS_ORG_ID=123456789
```

**Important**: Use the absolute path to your private key file.

### Step 6: Configure Cursor

Add to your Cursor MCP settings file:

**macOS**: `~/.cursor/mcp.json`
**Windows**: `%APPDATA%\Cursor\mcp.json`

#### Using Node.js directly:

```json
{
  "mcpServers": {
    "apple-search-ads": {
      "command": "node",
      "args": ["/path/to/asa-mcp/dist/index.js"],
      "env": {
        "APPLE_ADS_CLIENT_ID": "SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "APPLE_ADS_TEAM_ID": "SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "APPLE_ADS_KEY_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "APPLE_ADS_PRIVATE_KEY_PATH": "/path/to/private-key.pem",
        "APPLE_ADS_ORG_ID": "123456789"
      }
    }
  }
}
```

#### Using Docker:

```json
{
  "mcpServers": {
    "apple-search-ads": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "APPLE_ADS_CLIENT_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "-e", "APPLE_ADS_TEAM_ID=SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "-e", "APPLE_ADS_KEY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "-e", "APPLE_ADS_ORG_ID=123456789",
        "-e", "APPLE_ADS_PRIVATE_KEY_PATH=/keys/private-key.pem",
        "-v", "/path/to/private-key.pem:/keys/private-key.pem:ro",
        "asa-mcp-apple-search-ads-mcp"
      ]
    }
  }
}
```

### Step 7: Restart Cursor

Restart Cursor completely for the MCP server to load.

---

## Available Tools

### Account & Discovery

| Tool | Description |
|------|-------------|
| `get_user_acl` | Get organizations and roles the API has access to |
| `search_apps` | Search for iOS apps to promote (returns adamId) |
| `search_geo` | Search for targetable geographic locations |

### Campaigns

| Tool | Description |
|------|-------------|
| `create_campaign` | Create a new campaign |
| `get_campaigns` | Get all campaigns or a specific campaign |
| `find_campaigns` | Search campaigns with filter conditions |
| `update_campaign` | Update campaign settings |
| `delete_campaign` | Delete a campaign |

### Ad Groups

| Tool | Description |
|------|-------------|
| `create_adgroup` | Create an ad group with targeting dimensions |
| `get_adgroups` | Get ad groups in a campaign |
| `find_adgroups` | Search ad groups with filters |
| `update_adgroup` | Update ad group settings and targeting |
| `delete_adgroup` | Delete an ad group |

### Targeting Keywords

| Tool | Description |
|------|-------------|
| `create_targeting_keywords` | Add keywords to an ad group |
| `get_targeting_keywords` | Get keywords for an ad group |
| `find_targeting_keywords` | Search keywords across ad groups |
| `update_targeting_keywords` | Update keyword bids and status |

### Negative Keywords (Campaign Level)

| Tool | Description |
|------|-------------|
| `create_campaign_negative_keywords` | Add negative keywords to campaign |
| `get_campaign_negative_keywords` | Get campaign negative keywords |
| `update_campaign_negative_keywords` | Update negative keyword status |
| `delete_campaign_negative_keywords` | Delete campaign negative keywords |

### Negative Keywords (Ad Group Level)

| Tool | Description |
|------|-------------|
| `create_adgroup_negative_keywords` | Add negative keywords to ad group |
| `get_adgroup_negative_keywords` | Get ad group negative keywords |
| `update_adgroup_negative_keywords` | Update negative keyword status |
| `delete_adgroup_negative_keywords` | Delete ad group negative keywords |

### Reports

| Tool | Description |
|------|-------------|
| `get_campaign_reports` | Campaign-level performance reports |
| `get_adgroup_reports` | Ad group-level performance reports |
| `get_keyword_reports` | Keyword-level performance reports |
| `get_searchterm_reports` | Search term reports |

---

## Usage Examples

Once configured, you can ask Claude in Cursor to manage your campaigns:

### Get Campaign Performance
> "Show me how my campaigns performed last week"

### Create a Campaign
> "Create a new campaign for my app (adamId: 123456789) targeting US and Canada with a $1000 budget"

### Add Keywords
> "Add these keywords to my campaign: fitness app, workout tracker, exercise planner"

### Pause Underperforming Keywords
> "Find keywords with CTR below 1% and pause them"

### Get Search Term Insights
> "Show me the search terms report for my campaign to find new keyword opportunities"

---

## Troubleshooting

### "API credentials not configured"
- Make sure all 5 environment variables are set
- Check that `APPLE_ADS_PRIVATE_KEY_PATH` is an absolute path
- Restart Cursor after changing the MCP config

### "Failed to fetch access token"
- Verify your private key matches the public key you uploaded
- Check that `clientId`, `teamId`, and `keyId` are correct
- Make sure the API user invitation was accepted

### "Forbidden" or permission errors
- Verify your API user has "API Account Manager" role
- Check that `orgId` is correct (from the URL)
- Try `get_user_acl` to see what orgs you have access to

### "Invalid public key" when uploading
- Make sure you're copying the entire key including `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----`
- Try using Safari if other browsers give errors
- Disable ad blockers

---

## Docker Commands Reference

```bash
# Build the image
npm run build
docker compose build

# Run with docker compose (uses .env file)
docker compose up

# Run directly with docker
docker run -it --rm \
  -e APPLE_ADS_CLIENT_ID=SEARCHADS.xxx \
  -e APPLE_ADS_TEAM_ID=SEARCHADS.xxx \
  -e APPLE_ADS_KEY_ID=xxx \
  -e APPLE_ADS_ORG_ID=123456789 \
  -e APPLE_ADS_PRIVATE_KEY_PATH=/keys/private-key.pem \
  -v $(pwd)/private-key.pem:/keys/private-key.pem:ro \
  asa-mcp-apple-search-ads-mcp

# Stop containers
docker compose down
```

---

## API Reference

This MCP server implements the [Apple Search Ads Campaign Management API](https://developer.apple.com/documentation/apple_ads).

- [Campaign Management API Overview](https://ads.apple.com/app-store/help/campaigns/0022-use-the-campaign-management-api)
- [Apple Developer Documentation](https://developer.apple.com/documentation/apple_ads)

---

## Security Notes

- **Never commit** your `.env` file or `private-key.pem` to git
- The `.gitignore` is configured to exclude these files
- Keep your private key secure - if compromised, regenerate both keys and re-upload

---

## License

MIT
