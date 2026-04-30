import type { Metadata } from "next";
import { Cairo, JetBrains_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const fontSans = Cairo({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  display: "swap",
});
/** يُحاول المتصفح رسمه أولاً للأرقام والأحرف اللاتينية، ثم ينتقل لـ Cairo للعربية. */
const fontFigures = Montserrat({
  variable: "--font-figures",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});
const fontMono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NebulaPlay — ألعاب وبطاقات وإكسسوارات",
  description: "تسوق ألعاب بلايستيشن وإكسسوارات وبطاقات رقمية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontFigures.variable} ${fontMono.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
