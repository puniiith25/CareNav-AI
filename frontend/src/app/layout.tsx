import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/lib/auth-context";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareNav AI — Patient Healthcare Navigator",
  description: "Understand your health. Find the right care. Navigate your healthcare journey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#f3efe6] text-[#15232b]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
