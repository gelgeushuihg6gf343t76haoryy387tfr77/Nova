export const countryCurrencyMap = {
  Myanmar: "MMK",
  "United States": "USD",
  "United Kingdom": "GBP",
  Singapore: "SGD",
  Thailand: "THB",
  India: "INR",
  Japan: "JPY",
  China: "CNY",
  "South Korea": "KRW",
  Vietnam: "VND",
  Philippines: "PHP",
  Malaysia: "MYR",
  Indonesia: "IDR",
  Europe: "EUR",
  Australia: "AUD",
  Canada: "CAD",
  Switzerland: "CHF",
  Sweden: "SEK",
  Norway: "NOK",
  Denmark: "DKK",
  "New Zealand": "NZD",
  "Hong Kong": "HKD",
  Taiwan: "TWD",
  "United Arab Emirates": "AED",
  "Saudi Arabia": "SAR",
  Brazil: "BRL",
  Mexico: "MXN",
  Nigeria: "NGN",
  Kenya: "KES",
  Egypt: "EGP",
  Bangladesh: "BDT",
  Pakistan: "PKR",
  Nepal: "NPR",
  "Sri Lanka": "LKR",
  Cambodia: "KHR",
  Laos: "LAK",
};

export const currencySymbolMap = {
  USD: "$",
  MMK: "Ks",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  INR: "₹",
  THB: "฿",
  SGD: "S$",
  CNY: "¥",
  KRW: "₩",
  VND: "₫",
  PHP: "₱",
  MYR: "RM",
  IDR: "Rp",
  AUD: "A$",
  CAD: "C$",
  CHF: "Fr",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  NZD: "NZ$",
  HKD: "HK$",
  TWD: "NT$",
  AED: "د.إ",
  SAR: "﷼",
  BRL: "R$",
  MXN: "MX$",
  NGN: "₦",
  KES: "KSh",
  EGP: "£E",
  BDT: "৳",
  PKR: "₨",
  NPR: "रू",
  LKR: "රු",
  KHR: "៛",
  LAK: "₭",
};

export function formatCurrencyLabel(currencyCode) {
  if (!currencyCode) return "";
  const symbol = currencySymbolMap[currencyCode] || currencyCode;
  return `${currencyCode} (${symbol})`;
}

const CURRENCY_REGEX = /\(([A-Z]{3})\)\s*$/;

export function extractCurrencyCode(text) {
  if (!text) return null;
  const match = String(text).match(CURRENCY_REGEX);
  return match?.[1] || null;
}

export function appendCurrencySuffix(text, currencyCode) {
  const normalized = (text || "").trim();
  if (!currencyCode) return normalized || null;
  if (extractCurrencyCode(normalized)) return normalized || null;
  if (!normalized) return `(${currencyCode})`;
  return `${normalized} (${currencyCode})`;
}

export function formatMoneyFromCents(amountCents, currencyCode) {
  const value = Number(amountCents || 0) / 100;
  const symbol = currencySymbolMap[currencyCode] || currencyCode || "$";
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (symbol === "$") return `$${formatted}`;
  return `${symbol} ${formatted}`;
}

export function formatConvertedAmount(originalAmountCents, originalCurrency, convertedAmountCents, businessCurrency) {
  const original = formatMoneyFromCents(originalAmountCents, originalCurrency);
  if (!convertedAmountCents || originalCurrency === businessCurrency) {
    return original;
  }
  const converted = formatMoneyFromCents(convertedAmountCents, businessCurrency);
  return `${original} (≈ ${converted})`;
}
