import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApparelFlow ERP",
  description: "Production Batch Verification and Sewing Queue ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}