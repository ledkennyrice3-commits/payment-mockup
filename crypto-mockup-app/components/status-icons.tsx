export type SignalLevel = "none" | "low" | "medium" | "full";

function signalLevelToBars(level: SignalLevel): number {
  if (level === "full") return 4;
  if (level === "medium") return 3;
  if (level === "low") return 1;
  return 0;
}

/** Dual-SIM status bar: ascending primary bars + equal short secondary pills */
export function DualSimSignalIcon({
  signal,
  cellular,
}: {
  signal: SignalLevel;
  cellular: SignalLevel;
}) {
  const primaryBars = signalLevelToBars(signal);
  const secondaryBars = signalLevelToBars(cellular);

  if (primaryBars === 0 && secondaryBars === 0) return null;

  return (
    <div className="flex h-4 items-center space-x-0.5 text-[#EAECEF]">
      <svg
        viewBox="0 0 18 14"
        className="h-[14px] w-[18px] fill-current"
        aria-hidden
      >
        <rect
          x="0"
          y="3"
          width="2.5"
          height="4"
          rx="1.2"
          style={{ opacity: primaryBars >= 1 ? 1 : 0.3 }}
        />
        <rect
          x="4.5"
          y="2"
          width="2.5"
          height="5"
          rx="1.2"
          style={{ opacity: primaryBars >= 2 ? 1 : 0.3 }}
        />
        <rect
          x="9"
          y="1"
          width="2.5"
          height="6"
          rx="1.2"
          style={{ opacity: primaryBars >= 3 ? 1 : 0.3 }}
        />
        <rect
          x="13.5"
          y="0"
          width="2.5"
          height="7"
          rx="1.2"
          style={{ opacity: primaryBars >= 4 ? 1 : 0.3 }}
        />
        <rect
          x="0"
          y="8.5"
          width="2.5"
          height="4"
          rx="1.2"
          style={{ opacity: secondaryBars >= 1 ? 1 : 0.3 }}
        />
        <rect
          x="4.5"
          y="8.5"
          width="2.5"
          height="4"
          rx="1.2"
          style={{ opacity: secondaryBars >= 2 ? 1 : 0.3 }}
        />
        <rect
          x="9"
          y="8.5"
          width="2.5"
          height="4"
          rx="1.2"
          style={{ opacity: secondaryBars >= 3 ? 1 : 0.3 }}
        />
        <rect
          x="13.5"
          y="8.5"
          width="2.5"
          height="4"
          rx="1.2"
          style={{ opacity: secondaryBars >= 4 ? 1 : 0.3 }}
        />
      </svg>
    </div>
  );
}

/** Wi-Fi — pizza-slice base + 2 concentric arcs (shared center) */
export function WifiIcon({ level }: { level: SignalLevel }) {
  if (level === "none") return null;

  const tiers = level === "low" ? 1 : level === "medium" ? 2 : 3;

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-current text-[#EAECEF]"
      aria-hidden
    >
      <path
        d="M 12 19 L 8.2 15 A 5 5 0 0 1 15.8 15 Z"
        style={{ opacity: tiers >= 1 ? 1 : 0.3 }}
      />
      <path
        d="M 6 12 A 8.5 8.5 0 0 1 18 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ opacity: tiers >= 2 ? 1 : 0.3 }}
      />
      <path
        d="M 3.2 7.8 A 12 12 0 0 1 20.8 7.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ opacity: tiers >= 3 ? 1 : 0.3 }}
      />
    </svg>
  );
}

export function BatteryIcon({
  level,
  charging,
}: {
  level: number;
  charging: boolean;
}) {
  const fill = Math.max(0, Math.min(100, level));
  const maxFill = 15.2;
  const fillWidth = Math.max(fill > 0 ? 2.4 : 0, (maxFill * fill) / 100);

  return (
    <svg
      width="27"
      height="12"
      viewBox="0 0 27 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="0.75"
        y="0.75"
        width="22.5"
        height="10.5"
        rx="3.1"
        stroke="#6B6D6E"
        strokeWidth="1.5"
      />
      <rect
        x="2.4"
        y="2.4"
        width={fillWidth}
        height="7.2"
        rx="1.6"
        fill={charging ? "#FCD535" : "#EAECEF"}
      />
      <path
        d="M24.2 3.85C25.35 4.15 26.05 4.9 26.05 6C26.05 7.1 25.35 7.85 24.2 8.15V3.85Z"
        fill="#6B6D6E"
      />
    </svg>
  );
}
