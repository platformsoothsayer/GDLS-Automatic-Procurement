/**
 * Formatting helpers. Fixed locale so server and client render identically and
 * no hydration mismatch can appear mid demonstration.
 */

const LOCALE = "en-GB"

export const int = (n: number) => new Intl.NumberFormat(LOCALE).format(Math.round(n))

export const money = (n: number, fractionDigits = 0) =>
  // en-US, because en-GB renders USD as "US$".
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n)

export const compactMoney = (n: number) =>
  n >= 1_000_000 ? `${money(n / 1_000_000, 1)}M` : n >= 1_000 ? `${money(n / 1_000, 0)}K` : money(n, 0)

export const pct = (n: number, fractionDigits = 1) => `${n.toFixed(fractionDigits)}%`

export const shortDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${d} ${months[Number(m) - 1]} ${y}`
}
