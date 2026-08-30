import type { Metadata } from "next";
import { Archivo, Caveat } from "next/font/google";
import Script from "next/script";
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
      <body>
        {children}
        {/* Stay22 « let me allez » : monétise les liens Booking de la page. */}
        <Script id="stay22-lma" strategy="afterInteractive">
          {`(function (s, t, a, y, twenty, two) {
            s.Stay22 = s.Stay22 || {};
            s.Stay22.params = { lmaID: '${process.env.NEXT_PUBLIC_STAY22_LMA_ID ?? ""}' };
            twenty = t.createElement(a);
            two = t.getElementsByTagName(a)[0];
            twenty.async = 1;
            twenty.src = y;
            two.parentNode.insertBefore(twenty, two);
          })(window, document, 'script', 'https://scripts.stay22.com/letmeallez.js');`}
        </Script>
      </body>
    </html>
  );
}
