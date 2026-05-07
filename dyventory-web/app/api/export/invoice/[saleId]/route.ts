import { type NextRequest } from "next/server";
import { proxyExport } from "../../_proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> },
) {
  const { saleId } = await params;
  return proxyExport(request, `/sales/${saleId}/invoice`);
}
