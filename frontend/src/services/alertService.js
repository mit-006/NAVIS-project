const IMD_CAP_RSS_URL = 'https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml';
const IMD_CAP_BASE = 'https://cap-sources.s3.amazonaws.com/in-imd-en';

const ASSAM_KEYWORDS = [
  'assam', 'kamrup', 'guwahati', 'goalpara', 'nagaon', 'morigaon',
  'darrang', 'sonitpur', 'lakhimpur', 'dhemaji', 'barpeta',
  'bhogaonikhow', 'nalbari', 'bongaigaon', 'chirang', 'kamrup rural',
  'dispur', 'north guwahati', 'south kamrup', 'east kamrup', 'west kamrup',
];

const ASSAM_SUBDIVISIONS = [
  'assam & meghalaya', 'assam and meghalaya', 'assam',
];

const CAP_NS = 'urn:oasis:names:tc:emergency:cap:1.2';

let alertCache = null;
let alertTimestamp = null;
let alertPromise = null;
const ALERT_TTL = 10 * 60 * 1000;
let abortController = null;

function parseXML(text) {
  const parser = new DOMParser();
  return parser.parseFromString(text, 'text/xml');
}

function xmlGetText(node, tag) {
  const el = node.getElementsByTagNameNS(CAP_NS, tag)[0]
    || node.getElementsByTagName(tag)[0];
  return el ? el.textContent.trim() : '';
}

function parseCAPAlert(itemNode) {
  const infoNodes = itemNode.getElementsByTagNameNS(CAP_NS, 'info');
  if (infoNodes.length === 0) return null;

  const alerts = [];
  for (let i = 0; i < infoNodes.length; i++) {
    const info = infoNodes[i];
    const category = xmlGetText(info, 'category');
    if (category !== 'Met') continue;

    const areaNodes = info.getElementsByTagNameNS(CAP_NS, 'area');
    const areas = [];
    for (let j = 0; j < areaNodes.length; j++) {
      const areaDesc = xmlGetText(areaNodes[j], 'areaDesc');
      const polygon = xmlGetText(areaNodes[j], 'polygon');
      areas.push({ areaDesc, polygon });
    }

    alerts.push({
      identifier: xmlGetText(itemNode, 'identifier'),
      sender: xmlGetText(itemNode, 'sender'),
      sent: xmlGetText(itemNode, 'sent'),
      status: xmlGetText(itemNode, 'status'),
      msgType: xmlGetText(itemNode, 'msgType'),
      event: xmlGetText(info, 'event'),
      responseType: xmlGetText(info, 'responseType'),
      urgency: xmlGetText(info, 'urgency'),
      severity: xmlGetText(info, 'severity'),
      certainty: xmlGetText(info, 'certainty'),
      onset: xmlGetText(info, 'onset'),
      expires: xmlGetText(info, 'expires'),
      senderName: xmlGetText(info, 'senderName'),
      headline: xmlGetText(info, 'headline'),
      description: xmlGetText(info, 'description'),
      instruction: xmlGetText(info, 'instruction'),
      areas,
    });
  }

  return alerts.length > 0 ? {
    identifier: xmlGetText(itemNode, 'identifier'),
    sent: xmlGetText(itemNode, 'sent'),
    alerts,
  } : null;
}

function isRelevantToAssam(alert) {
  if (!alert || !alert.alerts) return false;

  for (const info of alert.alerts) {
    for (const area of info.areas) {
      const desc = (area.areaDesc || '').toLowerCase();
      if (ASSAM_KEYWORDS.some(kw => desc.includes(kw))) return true;
      if (ASSAM_SUBDIVISIONS.some(sd => desc.includes(sd))) return true;

      if (area.polygon) {
        try {
          const coords = area.polygon.trim().split(/\s+/).map(pair => {
            const [lat, lng] = pair.split(',').map(Number);
            return { lat, lng };
          });
          const inAssam = coords.some(c =>
            c.lat >= 24.5 && c.lat <= 28.5 && c.lng >= 89.5 && c.lng <= 96.5
          );
          if (inAssam) return true;
        } catch {}
      }
    }

    const text = [
      info.headline, info.description, info.event, info.instruction,
    ].join(' ').toLowerCase();
    if (ASSAM_KEYWORDS.some(kw => text.includes(kw))) return true;
  }

  return false;
}

function parseSeverity(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'extreme': return { level: 5, label: 'Extreme', color: '#E11D48' };
    case 'severe': return { level: 4, label: 'Severe', color: '#F0B01A' };
    case 'moderate': return { level: 3, label: 'Moderate', color: '#F0B01A' };
    case 'minor': return { level: 2, label: 'Minor', color: '#3b82f6' };
    case 'unknown':
    default: return { level: 1, label: 'Unknown', color: '#71717a' };
  }
}

function parseUrgency(urgency) {
  switch ((urgency || '').toLowerCase()) {
    case 'immediate': return 4;
    case 'expected': return 3;
    case 'future': return 2;
    case 'past': return 1;
    default: return 0;
  }
}

export async function fetchIMDCapAlerts() {
  if (alertCache && alertTimestamp && (Date.now() - alertTimestamp < ALERT_TTL)) {
    return alertCache;
  }

  if (alertPromise) return alertPromise;

  alertPromise = (async () => {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    try {
      const res = await fetch(IMD_CAP_RSS_URL, { signal: abortController.signal });
      if (!res.ok) throw new Error(`CAP RSS error: ${res.status}`);

      const text = await res.text();
      const doc = parseXML(text);
      const items = doc.querySelectorAll('item');

      const allAlerts = [];
      const seenIdentifiers = new Set();

      for (const item of items) {
        const link = item.querySelector('link')?.textContent || '';
        const linkMatch = link.match(/in-imd-en\/(.+?)\.xml/);
        if (!linkMatch) continue;

        const identifier = linkMatch[1];
        if (seenIdentifiers.has(identifier)) continue;
        seenIdentifiers.add(identifier);

        try {
          const capRes = await fetch(`${IMD_CAP_BASE}/${identifier}.xml`, {
            signal: abortController.signal,
          });
          if (!capRes.ok) continue;

          const capText = await capRes.text();
          const capDoc = parseXML(capText);
          const alertNode = capDoc.querySelector('alert') ||
            capDoc.getElementsByTagNameNS(CAP_NS, 'alert')[0];
          if (!alertNode) continue;

          const parsed = parseCAPAlert(alertNode);
          if (parsed && isRelevantToAssam(parsed)) {
            allAlerts.push(parsed);
          }
        } catch {}
      }

      alertCache = allAlerts;
      alertTimestamp = Date.now();
      return allAlerts;
    } catch (err) {
      if (err.name === 'AbortError') return alertCache || [];
      console.warn('IMD CAP alert fetch failed:', err);
      return alertCache || [];
    } finally {
      alertPromise = null;
    }
  })();

  return alertPromise;
}

export function getActiveAssamAlerts(alerts) {
  const now = Date.now();
  return (alerts || []).filter(alert => {
    for (const info of alert.alerts) {
      if (info.expires) {
        try {
          const expiry = new Date(info.expires).getTime();
          if (expiry > now) return true;
        } catch {}
      }
      if (info.onset) {
        try {
          const onset = new Date(info.onset).getTime();
          if (onset <= now + 24 * 60 * 60 * 1000) return true;
        } catch {}
      }
    }
    return true;
  });
}

export function getAlertSummary(alerts) {
  const active = getActiveAssamAlerts(alerts);
  if (active.length === 0) return null;

  let maxSeverityLevel = 0;
  let maxSeverity = null;
  const events = [];

  for (const alert of active) {
    for (const info of alert.alerts) {
      const sev = parseSeverity(info.severity);
      const urg = parseUrgency(info.urgency);
      const score = sev.level * urg;

      if (score > maxSeverityLevel) {
        maxSeverityLevel = score;
        maxSeverity = { ...sev, urgency: info.urgency, certainty: info.certainty };
      }
      if (info.event && !events.includes(info.event)) {
        events.push(info.event);
      }
    }
  }

  return {
    count: active.length,
    maxSeverity,
    events,
    alerts: active,
    hasActiveAlerts: active.length > 0,
  };
}

export function formatAlertTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return isoString;
  }
}

export function clearAlertCache() {
  alertCache = null;
  alertTimestamp = null;
}
