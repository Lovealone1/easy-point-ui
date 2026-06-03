import { redirect } from "next/navigation"

/**
 * /supply-stocks-entries is now unified inside /supply-stocks (Lotes tab).
 * Redirect permanently so any saved bookmark or old link still works.
 */
export default function SupplyStocksEntriesPage() {
  redirect("/supply-stocks")
}
