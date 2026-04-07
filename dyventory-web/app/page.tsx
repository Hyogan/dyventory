import { redirect } from "next/navigation";

/**
 * Root page — immediately redirects to the default locale.
 *
 * From here, proxy.ts takes over:
 *   - If the user has a valid token → /en/dashboard renders
 *   - If not → proxy.ts redirects to /en/login
 *
 * This page itself never renders any UI.
 */
export default function RootPage() {
  // redirect("/en/dashboard");
  return (
    <>
      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aspernatur quo
      impedit qui dignissimos rerum ad libero iste ipsum totam laudantium.
    </>
  );
}
