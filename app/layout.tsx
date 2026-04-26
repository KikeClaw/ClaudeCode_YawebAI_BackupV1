import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque, Inconsolata } from "next/font/google";
import "./globals.css";

// Body font — same as Rukia's --main-family
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Title font — same as Rukia's .title class
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Decor/eyebrow font — same as Rukia's .decor class
const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "yaweb.ai — Webs para negocios locales",
  description: "Creamos webs profesionales para comercios locales con IA. Desde 99€/año.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${dmSans.variable} ${bricolage.variable} ${inconsolata.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
