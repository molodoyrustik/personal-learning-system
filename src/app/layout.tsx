import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { createClient } from "@/shared/lib/supabase/server";
import { AppTopNav } from "@/shared/ui/AppTopNav";
import { Providers } from "./providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Personal Learning System",
  description: "Personal learning system for vocabulary and knowledge",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppTopNav isAuthenticated={!!user} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
