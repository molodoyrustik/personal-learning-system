"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/login?error=Invalid+credentials");
  }

  redirect("/lists");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
