import { withRetry, columnLetter, normalizeHeaders } from "./sheets/core";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_LOCATIONS,
  DEFAULT_ROLES,
  SHEET_SCHEMA,
  TAB_NAMES,
  TabName,
} from "./sheets/schema";
import {
  getSheetsClient,
  getSpreadsheetId,
  invalidateCache,
  isGoogleSheetsConfigured,
  matchTitle,
  quoteTitle,
  runExclusive,
} from "./sheets/table";

export interface UpgradeResult {
  success: boolean;
  message: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  createdTabs: string[];
  verifiedTabs: string[];
  allTabs: string[];
}

export interface SheetStatus {
  configured: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  tabs: {
    name: string;
    actualTitle: string | null;
    exists: boolean;
    rowCount: number;
    missingColumns: string[];
  }[];
  isFullyUpgraded: boolean;
}

const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

async function readMeta() {
  const res = await withRetry(() =>
    getSheetsClient().spreadsheets.get({
      spreadsheetId: getSpreadsheetId(),
      fields: "properties.title,sheets.properties",
    })
  );
  return {
    spreadsheetTitle: res.data.properties?.title || "Google Sheet",
    sheets: res.data.sheets ?? [],
    titles: (res.data.sheets ?? []).map((s) => s.properties?.title ?? ""),
  };
}

export async function getSpreadsheetStatus(): Promise<SheetStatus> {
  if (!isGoogleSheetsConfigured()) {
    return {
      configured: false,
      spreadsheetId: null,
      spreadsheetTitle: null,
      spreadsheetUrl: null,
      tabs: TAB_NAMES.map((name) => ({
        name,
        actualTitle: null,
        exists: false,
        rowCount: 0,
        missingColumns: [...SHEET_SCHEMA[name]],
      })),
      isFullyUpgraded: false,
    };
  }

  const spreadsheetId = getSpreadsheetId();
  const { spreadsheetTitle, titles } = await readMeta();
  const matched = TAB_NAMES.map((name) => ({ name, actual: matchTitle(titles, name) }));
  const present = matched.filter((t) => t.actual);

  const res = present.length
    ? await withRetry(() =>
        getSheetsClient().spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: present.map((t) => quoteTitle(t.actual!)),
        })
      )
    : null;
  const valuesByTab = new Map<TabName, unknown[][]>(
    present.map((t, i) => [t.name, res?.data.valueRanges?.[i]?.values ?? []])
  );

  const tabs = matched.map(({ name, actual }) => {
    const values = valuesByTab.get(name) ?? [];
    const headers = normalizeHeaders(values[0]);
    return {
      name,
      actualTitle: actual ?? null,
      exists: Boolean(actual),
      rowCount: Math.max(values.length - 1, 0),
      missingColumns: SHEET_SCHEMA[name].filter((column) => !headers.includes(column)),
    };
  });

  return {
    configured: true,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl: sheetUrl(spreadsheetId),
    tabs,
    isFullyUpgraded: tabs.every((t) => t.exists && t.missingColumns.length === 0),
  };
}

export function upgradeSpreadsheetStructure(): Promise<UpgradeResult> {
  return runExclusive(async () => {
    invalidateCache();
    const spreadsheetId = getSpreadsheetId();
    const sheets = getSheetsClient();
    const { spreadsheetTitle, sheets: metaSheets, titles } = await readMeta();

    const createdTabs: string[] = [];
    const verifiedTabs: string[] = [];
    const addRequests: { addSheet: { properties: { title: string } } }[] = [];

    for (const tab of TAB_NAMES) {
      if (!matchTitle(titles, tab)) {
        addRequests.push({ addSheet: { properties: { title: tab } } });
        createdTabs.push(tab);
      } else {
        verifiedTabs.push(tab);
      }
    }

    if (addRequests.length > 0) {
      await withRetry(() =>
        sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: addRequests },
        })
      );
    }

    const { titles: currentTitles } = await readMeta();

    // Check headers and append missing columns
    for (const tab of TAB_NAMES) {
      const actualTitle = matchTitle(currentTitles, tab)!;
      const res = await withRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${quoteTitle(actualTitle)}!1:1`,
        })
      );
      const headers = normalizeHeaders(res.data.values?.[0]);
      const missing = SHEET_SCHEMA[tab].filter((c) => !headers.includes(c));

      if (headers.length === 0) {
        // Fresh tab: write complete schema row
        await withRetry(() =>
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${quoteTitle(actualTitle)}!A1`,
            valueInputOption: "RAW",
            requestBody: { values: [[...SHEET_SCHEMA[tab]]] },
          })
        );

        // Seed default records for fresh tabs
        if (tab === "Asset_Categories") {
          await withRetry(() =>
            sheets.spreadsheets.values.append({
              spreadsheetId,
              range: `${quoteTitle(actualTitle)}!A2`,
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              requestBody: { values: DEFAULT_CATEGORIES },
            })
          );
        } else if (tab === "Asset_Locations") {
          await withRetry(() =>
            sheets.spreadsheets.values.append({
              spreadsheetId,
              range: `${quoteTitle(actualTitle)}!A2`,
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              requestBody: { values: DEFAULT_LOCATIONS },
            })
          );
        } else if (tab === "Roles") {
          await withRetry(() =>
            sheets.spreadsheets.values.append({
              spreadsheetId,
              range: `${quoteTitle(actualTitle)}!A2`,
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              requestBody: { values: DEFAULT_ROLES },
            })
          );
        }
      } else if (missing.length > 0) {
        // Existing tab with missing columns: append to the end of row 1
        const nextColIndex = headers.length;
        const startLetter = columnLetter(nextColIndex);
        await withRetry(() =>
          sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${quoteTitle(actualTitle)}!${startLetter}1`,
            valueInputOption: "RAW",
            requestBody: { values: [missing] },
          })
        );
      }
    }

    return {
      success: true,
      message: "Spreadsheet upgraded successfully.",
      spreadsheetId,
      spreadsheetTitle,
      spreadsheetUrl: sheetUrl(spreadsheetId),
      createdTabs,
      verifiedTabs,
      allTabs: TAB_NAMES,
    };
  });
}

