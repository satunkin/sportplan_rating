import { load } from "cheerio";
import * as XLSX from "xlsx";

const REQUEST_HEADERS = {
  "user-agent": "Codex Protocol Importer/1.0",
};

function normalizeSourceUrl(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function inferRaceResultEventId(url) {
  const pathnameParts = new URL(url).pathname.split("/").filter(Boolean);
  return pathnameParts.find((part) => /^\d+$/.test(part)) ?? null;
}

function parseRaceResultHash(url) {
  const hash = decodeURIComponent(new URL(url).hash ?? "");
  const match = hash.match(/^#?([^_]+)_([A-Z0-9]+)$/i);

  if (!match) {
    return {
      contestId: null,
      listId: null,
    };
  }

  return {
    contestId: match[1],
    listId: match[2],
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function parseIntegerValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  if (!/^\d+$/.test(text)) {
    return null;
  }

  return Number.parseInt(text, 10);
}

function parseRuncMetadata(html) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);

  return {
    eventName: titleMatch ? titleMatch[1].trim() : null,
  };
}

function parseRuncPageRows(html) {
  const $ = load(html);
  const rows = [];

  $(".results-races-mobile-list__item").each((_, element) => {
    const item = $(element);
    const name = item
      .find(".results-races-mobile-list__item-name")
      .text()
      .replace(/\u00a0/g, " ")
      .trim();

    const meta = item
      .find(".results-races-mobile-list__item-date")
      .text()
      .replace(/\u00a0/g, " ")
      .trim();

    const bibLabel = item
      .find(".results-races-mobile-list__item-number")
      .text()
      .trim();

    const values = item
      .find(".results-races-mobile-list__props-item-value")
      .map((__, node) => $(node).text().trim())
      .get();

    const placeText = values[0] ?? "";
    const paceText = values[1] ?? null;
    const resultText = values[2] ?? "";
    const overallPlace = parseIntegerValue(placeText);
    const bibMatch = bibLabel.match(/(\d+)/);
    const [country, ageGroupRaw] = meta.includes(", ")
      ? meta.split(", ", 2)
      : [null, meta || null];

    rows.push({
      athleteNameRaw: name,
      ageGroupRaw,
      bibNumber: bibMatch ? bibMatch[1] : null,
      country,
      finishTimeRaw: resultText,
      paceRaw: paceText,
      placeOverall: overallPlace,
      placeStatusRaw: overallPlace === null ? placeText || null : null,
      statusRaw: overallPlace === null ? resultText || placeText || null : null,
      source: "runc.run-html",
    });
  });

  const pages = $(".js-go-to-page[data-page]")
    .map((_, element) => parseIntegerValue($(element).attr("data-page")))
    .get()
    .filter(Boolean);

  return {
    rows,
    totalPages: Math.max(1, ...pages, 1),
  };
}

function buildRuncPageUrl(sourceUrl, page, pageSize = 1000) {
  const normalized = ensureTrailingSlash(normalizeSourceUrl(sourceUrl));

  if (page <= 1) {
    return `${normalized}page_size/${pageSize}/`;
  }

  return `${normalized}page/${page}/page_size/${pageSize}/`;
}

async function fetchRuncRunProtocol(params) {
  const firstPageHtml = await fetchText(buildRuncPageUrl(params.sourceUrl, 1));
  const firstPage = parseRuncPageRows(firstPageHtml);
  const pages = [firstPage.rows];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const pageHtml = await fetchText(buildRuncPageUrl(params.sourceUrl, page));
    pages.push(parseRuncPageRows(pageHtml).rows);
  }

  const rows = pages.flat();
  const meta = parseRuncMetadata(firstPageHtml);

  return {
    organizer: "runc.run",
    sourceUrl: params.sourceUrl,
    eventName: params.eventName || meta.eventName || "runc.run event",
    eventDate: params.eventDate,
    location: params.location || null,
    distanceLabel: params.distanceLabel,
    rowCount: rows.length,
    extractedAt: new Date().toISOString(),
    rows,
  };
}

function extractFirstHref(html) {
  const match = String(html ?? "").match(/href="([^"]+)"/i);
  return match ? match[1] : null;
}

function parseRaceResultWorkbook(buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: false,
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
    raw: false,
  });

  const header = matrix[0] ?? [];
  const columnIndex = {
    place: header.indexOf("Place"),
    bib: header.indexOf("Bib"),
    name: header.indexOf("Name"),
    club: header.indexOf("Club"),
    swim: header.indexOf("Swim"),
    t1: header.indexOf("T1"),
    bike: header.indexOf("Bike"),
    t2: header.indexOf("T2"),
    run: header.indexOf("Run"),
    agRank: header.indexOf("AG Rank"),
    time: header.indexOf("Time"),
  };

  let currentGroup = null;
  const rows = [];

  for (const row of matrix.slice(1)) {
    const place = row[columnIndex.place];
    const name = row[columnIndex.name];
    const total = row[columnIndex.time];

    if (place && !name && !total) {
      currentGroup = String(place).trim();
      continue;
    }

    if (!place || !name || !total) {
      continue;
    }

    const placeText = String(place).trim();
    const overallPlace = parseIntegerValue(placeText.replace(/\./g, ""));
    const ageRankText = String(row[columnIndex.agRank] ?? "").trim();
    const ageRankMatch = ageRankText.match(/^\s*(\d+)\./);

    rows.push({
      athleteNameRaw: String(name).trim(),
      ageGroupRaw: currentGroup,
      bibNumber:
        row[columnIndex.bib] === null || row[columnIndex.bib] === undefined
          ? null
          : String(row[columnIndex.bib]).trim(),
      clubRaw:
        row[columnIndex.club] === null || row[columnIndex.club] === undefined
          ? null
          : String(row[columnIndex.club]).trim(),
      finishTimeRaw: String(total).trim(),
      genderRaw: currentGroup ? String(currentGroup).split(" ")[0] : null,
      placeAgeGroup: ageRankMatch ? Number.parseInt(ageRankMatch[1], 10) : null,
      placeOverall: overallPlace,
      source: "raceresult-xlsx",
      statusRaw: overallPlace === null ? placeText : null,
      swimRaw:
        row[columnIndex.swim] === null || row[columnIndex.swim] === undefined
          ? null
          : String(row[columnIndex.swim]).trim(),
      t1Raw:
        row[columnIndex.t1] === null || row[columnIndex.t1] === undefined
          ? null
          : String(row[columnIndex.t1]).trim(),
      bikeRaw:
        row[columnIndex.bike] === null || row[columnIndex.bike] === undefined
          ? null
          : String(row[columnIndex.bike]).trim(),
      t2Raw:
        row[columnIndex.t2] === null || row[columnIndex.t2] === undefined
          ? null
          : String(row[columnIndex.t2]).trim(),
      runRaw:
        row[columnIndex.run] === null || row[columnIndex.run] === undefined
          ? null
          : String(row[columnIndex.run]).trim(),
    });
  }

  return rows;
}

async function fetchRaceResultProtocol(params) {
  const eventId = inferRaceResultEventId(params.sourceUrl);

  if (!eventId) {
    throw new Error(`Cannot infer RaceResult event id from ${params.sourceUrl}`);
  }

  const source = new URL(params.sourceUrl);
  const { listId, contestId } = parseRaceResultHash(params.sourceUrl);
  const configUrl = `${source.origin}/${eventId}/results/config?lang=ru`;
  const config = await fetchJson(configUrl);
  const selectedList =
    config?.TabConfig?.Lists?.find((item) => item.ID === listId) ??
    config?.TabConfig?.Lists?.find((item) => item.Contest === contestId) ??
    config?.TabConfig?.Lists?.[0];

  const infoText = config?.TabConfig?.InfoText ?? "";
  const xlsxHref = extractFirstHref(infoText);

  if (!xlsxHref) {
    throw new Error(`RaceResult config has no XLSX link for ${params.sourceUrl}`);
  }

  const xlsxUrl = new URL(xlsxHref, source.origin).toString();
  const buffer = await fetchBuffer(xlsxUrl);
  const rows = parseRaceResultWorkbook(buffer);

  return {
    organizer: "raceresult",
    sourceUrl: params.sourceUrl,
    eventName: params.eventName || config?.eventname || "RaceResult event",
    eventDate: params.eventDate,
    location: params.location || null,
    distanceLabel:
      params.distanceLabel || selectedList?.ShowAs || selectedList?.Name || "",
    rowCount: rows.length,
    extractedAt: new Date().toISOString(),
    rows,
    sourceLinks: {
      xlsx: xlsxUrl,
      pdf: selectedList
        ? `${source.origin}/${eventId}/results/pdf?name=${encodeURIComponent(
            selectedList.Name,
          )}&contest=${selectedList.Contest}&lang=ru`
        : null,
    },
  };
}

export function resolveProtocolParser(sourceUrl) {
  const normalized = normalizeSourceUrl(sourceUrl);

  if (normalized.includes("results.runc.run/")) {
    return {
      organizer: "runc.run",
      parse: fetchRuncRunProtocol,
    };
  }

  if (normalized.includes("raceresult.com/")) {
    return {
      organizer: "raceresult",
      parse: fetchRaceResultProtocol,
    };
  }

  return null;
}

export async function fetchNormalizedProtocolFromSource(params) {
  const parser = resolveProtocolParser(params.sourceUrl);

  if (!parser) {
    return null;
  }

  return parser.parse({
    sourceUrl: params.sourceUrl,
    eventName: params.eventName,
    eventDate: params.eventDate,
    location: params.location,
    distanceLabel: params.distanceLabel,
  });
}
