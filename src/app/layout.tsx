import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AppTopNav isAuthenticated={!!user} />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
