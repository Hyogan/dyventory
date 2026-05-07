import { type NextRequest } from "next/server";
import { proxyExport } from "../../_proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  return proxyExport(request, `/products/${productId}/label-sheet`);
}
