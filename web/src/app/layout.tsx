import type { Metadata } from "next";

import { SiteFooter } from "@/app/site-footer";
import { SiteHeader } from "@/app/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportPlan rating",
  description: "Seasonal rating for amateur endurance athletes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
