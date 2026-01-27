import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MP Board Class 12 - Copy Checking Form | Arivihan",
  description: "Submit your answer sheets for MP Board Class 12 copy checking. Upload model paper answers or your own question paper responses.",
  keywords: ["MP Board", "Class 12", "Copy Checking", "Arivihan", "Model Paper", "Answer Sheet"],
  authors: [{ name: "Arivihan Technologies" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
