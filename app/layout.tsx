import type { Metadata } from "next";
import { Archivo, Caveat } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--ff-archivo",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--ff-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PlugStays",
    template: "%s · PlugStays",
  },
  description:
    "Les informations de charge des hôtels au même endroit : puissance, connecteur, nombre de points, accès à la place, avec la date de dernière mise à jour.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
