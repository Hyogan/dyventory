import { type NextRequest } from "next/server";
import { proxyExport } from "../_proxy";

export async function GET(request: NextRequest) {
  return proxyExport(request, "/reports/export/stock-forecast");
}
