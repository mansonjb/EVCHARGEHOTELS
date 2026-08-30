import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "90px 26px", textAlign: "center" }}>
      <h1 style={{ fontWeight: 800, fontSize: 44, letterSpacing: "-0.04em", margin: 0 }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: 16, color: "#3A4160", lineHeight: 1.6, marginTop: 14 }}>
        Cette page n&apos;existe pas ou n&apos;existe plus. Les étapes ouvertes sont listées sur
        l&apos;accueil.
      </p>
      <Link
        href="/fr"
        style={{
          display: "inline-block",
          marginTop: 24,
          background: "#141B34",
          color: "#FFFFFF",
          padding: "14px 26px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
