"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { AUTH_COOKIE, COOKIE_NAME } from "@/lib/auth";
import type { AuthSession, LoginFormState } from "@/types/auth";
import { z } from "zod";
const LoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .min(1, "Email is required."),

  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  // 1. Client-side-style schema validation (runs server-side)
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors as LoginFormState["error"],
    };
  }

  // 2. Call Laravel auth endpoint
  let session: AuthSession;

  try {
    const res = await apiFetch<{ data: AuthSession }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    session = res.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isUnauthorized) {
        return {
          error: { _form: ["Invalid email or password. Please try again."] },
        };
      }

      if (error.isValidation) {
        return {
          error: error.validationErrors as LoginFormState["error"],
        };
      }

      if (error.status === 429) {
        return {
          error: {
            _form: [
              "Too many login attempts. Please wait a moment and try again.",
            ],
          },
        };
      }
    }
    console.log(error);

    return {
      error: { _form: ["An unexpected error occurred. Please try again."] },
    };
  }

  //   function getFieldErrors(error: z.ZodError) {
  //     const tree = z.treeifyError(error);

  //     return {
  //       email: tree.properties?.email?.errors,
  //       password: tree.properties?.password?.errors,
  //     };
  //   }

  // 3. Store token in httpOnly cookie — never exposed to client JavaScript
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  // 4. Redirect to dashboard — redirect() throws, so it must be outside try/catch
  redirect("/en/dashboard");
}
