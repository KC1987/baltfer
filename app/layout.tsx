import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bauhaus = localFont({
  src: [
    {
      path: "./res/Bauhaus/BauhausRegular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./res/Bauhaus/BauhausBold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-bauhaus",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baltfer - Transfer Booking Service",
  description: "Book reliable transfer services with Baltfer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bauhaus.variable} antialiased`}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
