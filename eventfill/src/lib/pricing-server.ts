import "server-only";
import { cookies, headers } from "next/headers";
import { CURRENCY_COOKIE, detectCurrency, type Currency } from "./pricing";

/** The currency to show this visitor: their saved choice, else a guess from their location. */
export async function getVisitorCurrency(): Promise<Currency> {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return detectCurrency(h, c.get(CURRENCY_COOKIE)?.value);
}
