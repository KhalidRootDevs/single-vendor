/**
 * SKU format: {ABBR}-{YYYYMMDD}-{RAND4}
 *
 * ABBR = first letter of each word (max 4), uppercase
 * e.g. "Premium T-Shirt Blue" → "PTB"
 *      "Wireless Headphones"  → "WH"
 *
 * Variant SKU: {BASE_SKU}-{ATTR_ABBREV}
 * e.g. base "PTB-20240427-A3K9" + {color:"Red",size:"L"} → "PTB-20240427-A3K9-RED-L"
 */

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function rand(n: number): string {
  return Array.from(
    { length: n },
    () => ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)]
  ).join('');
}

function dateStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function nameAbbr(name: string): string {
  const initials = name
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w.replace(/[^A-Z0-9]/g, '').charAt(0))
    .filter(Boolean)
    .join('');
  return initials.padEnd(2, 'X'); // minimum 2 chars
}

function attrAbbr(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
}

export function generateBaseSku(productName: string): string {
  const abbr = nameAbbr(productName);
  return `${abbr}-${dateStamp()}-${rand(4)}`;
}

export function generateVariantSku(
  baseSku: string,
  attributes: Record<string, string>
): string {
  const suffix = Object.values(attributes)
    .map(attrAbbr)
    .filter(Boolean)
    .join('-');
  return suffix ? `${baseSku}-${suffix}` : `${baseSku}-${rand(3)}`;
}
