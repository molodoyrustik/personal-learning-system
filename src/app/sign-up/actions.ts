"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  // Email confirmation is required — no session yet
  if (data.user && !data.session) {
    redirect("/sign-in?info=Check+your+email+to+confirm+your+account+before+signing+in");
  }

  redirect("/courses");
}
