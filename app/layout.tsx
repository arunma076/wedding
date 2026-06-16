import type { Metadata } from "next";
import { Playfair_Display, Outfit, Great_Vibes, Noto_Serif_Malayalam } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
});

const notoSerialMal = Noto_Serif_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-mal",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "മംഗല്യം · Arun & Ashwati",
  description:
    "Join us to celebrate the wedding of Arun and Ashwati. 5 July 2026 at Guruvayoor Temple, Kerala.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${greatVibes.variable} ${notoSerialMal.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
