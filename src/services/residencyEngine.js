// src/services/residencyEngine.js — STRICT-MODE FULL VERSION

const COUNTRY_MAP = {
  "1":   { zone: "us",     sovereignty: "us", region: "us" },      // US + NANP
  "44":  { zone: "eu",     sovereignty: "uk", region: "eu" },      // UK
  "33":  { zone: "eu",     sovereignty: "fr", region: "eu" },      // France
  "49":  { zone: "eu",     sovereignty: "de", region: "eu" },      // Germany
  "34":  { zone: "eu",     sovereignty: "es", region: "eu" },      // Spain
  "39":  { zone: "eu",     sovereignty: "it", region: "eu" },      // Italy
  "31":  { zone: "eu",     sovereignty: "nl", region: "eu" },      // Netherlands
  "32":  { zone: "eu",     sovereignty: "be", region: "eu" },      // Belgium
  "46":  { zone: "eu",     sovereignty: "se", region: "eu" },      // Sweden
  "47":  { zone: "eu",     sovereignty: "no", region: "eu" },      // Norway
  "41":  { zone: "eu",     sovereignty: "ch", region: "eu" },      // Switzerland

  "61":  { zone: "apac",   sovereignty: "au", region: "apac" },    // Australia
  "64":  { zone: "apac",   sovereignty: "nz", region: "apac" },    // New Zealand
  "81":  { zone: "apac",   sovereignty: "jp", region: "apac" },    // Japan
  "82":  { zone: "apac",   sovereignty: "kr", region: "apac" },    // South Korea
  "65":  { zone: "apac",   sovereignty: "sg", region: "apac" },    // Singapore

  "55":  { zone: "latam",  sovereignty: "br", region: "latam" },   // Brazil
  "52":  { zone: "latam",  sovereignty: "mx", region: "latam" },   // Mexico
  "57":  { zone: "latam",  sovereignty: "co", region: "latam" },   // Colombia
  "54":  { zone: "latam",  sovereignty: "ar", region: "latam" },   // Argentina
  "56":  { zone: "latam",  sovereignty: "cl", region: "latam" },   // Chile

  "971": { zone: "me",     sovereignty: "ae", region: "me" },      // UAE
  "966": { zone: "me",     sovereignty: "sa", region: "me" },      // Saudi Arabia
  "90":  { zone: "me",     sovereignty: "tr", region: "me" },      // Turkey

  "27":  { zone: "africa", sovereignty: "za", region: "africa" },  // South Africa
  "234": { zone: "africa", sovereignty: "ng", region: "africa" },  // Nigeria
  "254": { zone: "africa", sovereignty: "ke", region: "africa" }   // Kenya
};

function normalizeNumber(num) {
  if (!num) return "";
  return num.replace(/\D/g, "");
}

function parseCountryCode(number) {
  const cleaned = normalizeNumber(number);
  const candidates = [
    cleaned.slice(0, 3),
    cleaned.slice(0, 2),
    cleaned.slice(0, 1)
  ];
  return candidates.find((c) => COUNTRY_MAP[c]) || "1"; // fallback US
}

module.exports = {
  resolveInboundResidency({ from }) {
    const cc = parseCountryCode(from);
    return COUNTRY_MAP[cc];
  },

  resolveOutboundResidency({ to }) {
    const cc = parseCountryCode(to);
    return COUNTRY_MAP[cc];
  }
};
