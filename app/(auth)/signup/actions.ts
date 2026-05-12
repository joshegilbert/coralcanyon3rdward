"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type SignupFormState = { error?: string; message?: string };

export async function signUp(
  _prev: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createClient(await cookies());
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
      },
    },
  });

  if (error) return { error: error.message };

  return {
    message:
      "Account created. Check your email to confirm, then sign in. An adult leader will set your role.",
  };
}
