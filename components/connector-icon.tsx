/** Type 2 dessiné sur mesure, repris du canvas de design. */
export function Type2Icon({ size = 26, color = "#0E9E7E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-label="Type 2" role="img">
      <circle cx="17" cy="17" r="14.5" stroke={color} strokeWidth="1.4" />
      <circle cx="11.4" cy="11" r="3.1" stroke={color} strokeWidth="1.4" />
      <circle cx="22.6" cy="11" r="3.1" stroke={color} strokeWidth="1.4" />
      <circle cx="9.6" cy="19.4" r="2.1" stroke={color} strokeWidth="1.4" />
      <circle cx="17" cy="19.4" r="2.1" stroke={color} strokeWidth="1.4" />
      <circle cx="24.4" cy="19.4" r="2.1" stroke={color} strokeWidth="1.4" />
      <circle cx="13.3" cy="25.6" r="2.1" stroke={color} strokeWidth="1.4" />
      <circle cx="20.7" cy="25.6" r="2.1" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

/** CCS2 : la tête Type 2 plus les deux broches de puissance continue. */
export function Ccs2Icon({ size = 26, color = "#0E9E7E" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-label="CCS2" role="img">
      <path
        d="M3.4 13.6a13.6 13.6 0 0 1 27.2 0c0 3.9-1.9 6.4-4.4 7.6H7.8c-2.5-1.2-4.4-3.7-4.4-7.6Z"
        stroke={color}
        strokeWidth="1.4"
      />
      <circle cx="11.6" cy="10.4" r="2.8" stroke={color} strokeWidth="1.4" />
      <circle cx="22.4" cy="10.4" r="2.8" stroke={color} strokeWidth="1.4" />
      <circle cx="10.2" cy="17.4" r="1.9" stroke={color} strokeWidth="1.4" />
      <circle cx="17" cy="17.4" r="1.9" stroke={color} strokeWidth="1.4" />
      <circle cx="23.8" cy="17.4" r="1.9" stroke={color} strokeWidth="1.4" />
      <circle cx="12.4" cy="27" r="4.1" stroke={color} strokeWidth="1.4" />
      <circle cx="21.6" cy="27" r="4.1" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

export function ConnectorIcon({ conn, size = 26 }: { conn: string; size?: number }) {
  const c = (conn || "").toLowerCase();
  if (c.includes("ccs") || c.includes("combo")) return <Ccs2Icon size={size} />;
  return <Type2Icon size={size} />;
}
