import { Geist, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonte de destaque pros títulos — condensada, tom "documento oficial /
// central de despacho", usada em vez da serifada anterior.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "AprovaFácil · Estudos GCM Limeira",
  description:
    "Tracker de estudos gamificado pra preparação do concurso GCM Limeira — calendário, edital, TAF, simulados e ranking entre amigos.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      style={{ colorScheme: "dark" }}
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#14171A]">{children}</body>
    </html>
  );
}
