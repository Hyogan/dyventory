"use server";

import { revalidateTag } from "next/cache";
import { authFetch } from "@/lib/auth";
import type { User, ApiResponse } from "@/types";

export type ProfileFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function updateProfile(data: {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  password_confirmation?: string;
}): Promise<ProfileFormState> {
  try {
    await authFetch<ApiResponse<{ user: User }>>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidateTag("me", "seconds");
    return { success: true };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "data" in error) {
      const apiError = error as {
        status: number;
        data?: { errors?: Record<string, string[]>; message?: string };
      };
      return {
        success: false,
        message: apiError.data?.message ?? "An error occurred.",
        errors: apiError.data?.errors,
      };
    }
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}
