import type { Metadata } from "next";
import { Special_Gothic_Expanded_One, Rethink_Sans } from "next/font/google";
import { Agentation } from "agentation";
import "./globals.css";

const specialGothic = Special_Gothic_Expanded_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-gothic",
  adjustFontFallback: false,
});

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  variable: "--font-rethink-sans",
});

export const metadata: Metadata = {
  title: "SlimTrippin",
  description: "A desktop-first trip timeline planner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${specialGothic.variable} ${rethinkSans.variable}`}>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
