import { useId, useLayoutEffect, useRef, useState } from "react";
import type { SignalLevel } from "@/components/status-icons";
import { cn } from "@/lib/cn";

export type CellularType = "4G" | "5G" | "LTE";

type IPhoneStatusBarProps = {
  time?: string;
  textColor?: string;
  clockClassName?: string;
  signal?: SignalLevel;
  wifi?: SignalLevel;
  cellularType?: CellularType;
  batteryLevel?: number;
  showBatteryPercent?: boolean;
  charging?: boolean;
};

const DEFAULT_CLOCK_CLASS =
  "font-[family-name:var(--font-sf-pro),ui-sans-serif,system-ui,sans-serif] text-[15px] font-semibold tracking-[-0.3px] leading-none tabular-nums";

function signalLevelToBars(level: SignalLevel): number {
  if (level === "full") return 4;
  if (level === "medium") return 3;
  if (level === "low") return 1;
  return 0;
}

function wifiLevelToTiers(level: SignalLevel): number {
  if (level === "full") return 3;
  if (level === "medium") return 2;
  if (level === "low") return 1;
  return 0;
}

function StatusBarBattery({
  level,
  showPercent,
  charging = false,
}: {
  level: number;
  showPercent: boolean;
  charging?: boolean;
}) {
  const rawId = useId();
  const clipId = `battery-clip-${rawId.replace(/:/g, "")}`;
  const fill = Math.max(0, Math.min(100, level));
  const percentLabel = Math.round(fill);
  const trackColor = "#878789";
  const activeFill = charging ? "#FCD535" : "#FFFFFF";
  const textRef = useRef<SVGTextElement>(null);
  const [boltX, setBoltX] = useState(17.1);

  useLayoutEffect(() => {
    if (!showPercent || !charging || !textRef.current) return;
    const textWidth = textRef.current.getBBox().width;
    // 3.0 (start) + textWidth + 0.5 (snug gap) + 2.8 (bolt tip offset)
    setBoltX(3.0 + textWidth + 0.5 + 2.8);
  }, [percentLabel, charging, showPercent]);

  if (showPercent) {
    const bodyW = 23;
    const fillWidth = Math.min(bodyW, Math.max(0, (bodyW * fill) / 100));

    return (
      <svg
        width="25"
        height="12"
        viewBox="0 0 25 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block select-none align-middle"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={bodyW} height="12" rx="4" />
          </clipPath>
        </defs>

        <rect
          x="0"
          y="0"
          width={bodyW}
          height="12"
          rx="4"
          fill={trackColor}
        />

        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y="0"
            width={fillWidth}
            height="12"
            fill={activeFill}
          />
        </g>

        <rect
          x={bodyW + 1}
          y="4"
          width="1"
          height="4"
          rx="0.5"
          fill={trackColor}
        />

        <g className="select-none pointer-events-none">
          {charging ? (
            <g transform="translate(0, 6)">
              <text
                ref={textRef}
                x="3.0"
                y="0"
                textAnchor="start"
                dominantBaseline="central"
                fill="#000000"
                style={{
                  fontFamily:
                    'var(--font-sf-pro), -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {percentLabel}
              </text>
              <polygon
                transform={`translate(${boltX}, 0)`}
                points="0.8,-4.2 -0.1,-0.75 2.8,-0.75 -0.8,4.2 0.1,0.75 -2.8,0.75"
                fill="#000000"
              />
            </g>
          ) : (
            <text
              x="11.5"
              y="6"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#000000"
              style={{
                fontFamily:
                  'var(--font-sf-pro), -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {percentLabel}
            </text>
          )}
        </g>
      </svg>
    );
  }

  // Mode B — classic hollow shell scaled to 13px height
  const maxFill = 19;
  const fillWidth = Math.max(fill > 0 ? 2.4 : 0, (maxFill * fill) / 100);
  const bodyX = 0.75;
  const bodyY = 0.75;
  const bodyW = 23.5;
  const bodyH = 11.5;
  const bodyRight = bodyX + bodyW;

  return (
    <svg
      width="27.5"
      height="13"
      viewBox="0 0 27.5 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        rx="4.5"
        stroke={trackColor}
        strokeWidth="1.2"
      />
      <rect
        x="2.6"
        y="2.6"
        width={fillWidth}
        height="8"
        rx="1.5"
        fill={activeFill}
      />
      {/* Flat tip — 1.5×4.5, 1px gap from body */}
      <rect
        x={bodyRight + 1}
        y={(13 - 4.5) / 2}
        width="1.5"
        height="4.5"
        rx="0.5"
        fill={trackColor}
      />
    </svg>
  );
}

export function IPhoneStatusBar({
  time = "12:05",
  textColor = "text-[#F5F5F7]",
  clockClassName,
  signal = "full",
  wifi = "full",
  cellularType = "4G",
  batteryLevel = 100,
  showBatteryPercent = false,
  charging = false,
}: IPhoneStatusBarProps) {
  const [hours, minutes] = time.includes(":") ? time.split(":") : [time, ""];
  const activeBars = signalLevelToBars(signal);
  const wifiTiers = wifiLevelToTiers(wifi);

  return (
    <div className={`relative z-10 h-[54px] w-full shrink-0 ${textColor}`}>
      <div className="pointer-events-none absolute left-1/2 top-[11px] z-20 h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black" />
      <div className="absolute inset-x-0 top-[11px] flex h-[37px] items-center justify-between pl-7 pr-6">
        <span className={cn("antialiased", DEFAULT_CLOCK_CLASS, clockClassName)}>
          {minutes ? (
            <>
              {hours}
              <span className="inline-block -translate-y-[1.5px] -mx-[0.5px]">:</span>
              {minutes}
            </>
          ) : (
            hours
          )}
        </span>
        <div className="flex items-center gap-[7.5px]">
          <svg
            width="18"
            height="12"
            viewBox="0 0 18 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="0.5"
              y="7.5"
              width="3"
              height="4"
              rx="0.75"
              fill="currentColor"
              opacity={activeBars >= 1 ? 1 : 0.3}
            />
            <rect
              x="5.25"
              y="5"
              width="3"
              height="6.5"
              rx="0.75"
              fill="currentColor"
              opacity={activeBars >= 2 ? 1 : 0.3}
            />
            <rect
              x="10"
              y="2.5"
              width="3"
              height="9"
              rx="0.75"
              fill="currentColor"
              opacity={activeBars >= 3 ? 1 : 0.3}
            />
            <rect
              x="14.75"
              y="0"
              width="3"
              height="11.5"
              rx="0.75"
              fill="currentColor"
              opacity={activeBars >= 4 ? 1 : 0.3}
            />
          </svg>
          {wifi !== "none" ? (
            <svg
              width="18"
              height="13"
              viewBox="0 0 24 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 18.5L8.1 14.6A5.5 5.5 0 0 1 15.9 14.6Z"
                fill="currentColor"
                opacity={wifiTiers >= 1 ? 1 : 0.3}
              />
              <path
                d="M5.3 11.8A9.5 9.5 0 0 1 18.7 11.8"
                stroke="currentColor"
                strokeWidth="3.1"
                strokeLinecap="butt"
                opacity={wifiTiers >= 2 ? 1 : 0.3}
              />
              <path
                d="M1.7 8.2A14.5 14.5 0 0 1 22.3 8.2"
                stroke="currentColor"
                strokeWidth="3.1"
                strokeLinecap="butt"
                opacity={wifiTiers >= 3 ? 1 : 0.3}
              />
            </svg>
          ) : (
            <span
              className={cn(
                "select-none text-[12px] font-semibold leading-none tracking-[-0.02em]",
                textColor,
              )}
              style={{
                fontFamily:
                  'var(--font-sf-pro), -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}
            >
              {cellularType}
            </span>
          )}
          <StatusBarBattery
            level={batteryLevel}
            showPercent={showBatteryPercent}
            charging={charging}
          />
        </div>
      </div>
    </div>
  );
}
