"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { toBlob, toPng } from "html-to-image";
import { Copy, Download, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BybitBackButton } from "@/components/BybitBackButton";
import { HomeIndicator } from "@/components/HomeIndicator";
import {
  IPhoneStatusBar,
  type CellularType,
} from "@/components/IPhoneStatusBar";
import { StatusBarPanel } from "@/components/StatusBarPanel";
import { type SignalLevel } from "@/components/status-icons";
import { sfProText } from "@/lib/fonts";

type WithdrawalStatus = "Completed" | "Pending" | "Failed";

function randomTxId() {
  const hex = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return `0x${hex}`;
}

function extractDateDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

function sanitizeDateDigits(digits: string): string {
  const y = digits.slice(0, 4);
  let mo = digits.slice(4, 6);
  let da = digits.slice(6, 8);
  let hh = digits.slice(8, 10);
  let mi = digits.slice(10, 12);
  let ss = digits.slice(12, 14);

  if (mo.length === 2) {
    let month = Number.parseInt(mo, 10);
    if (Number.isNaN(month) || month < 1) month = 1;
    if (month > 12) month = 12;
    mo = String(month).padStart(2, "0");
  }

  if (da.length === 2) {
    let day = Number.parseInt(da, 10);
    if (Number.isNaN(day) || day < 1) day = 1;
    if (day > 31) day = 31;
    da = String(day).padStart(2, "0");
  }

  if (hh.length === 2) {
    let hour = Number.parseInt(hh, 10);
    if (Number.isNaN(hour) || hour < 0) hour = 0;
    if (hour > 23) hour = 23;
    hh = String(hour).padStart(2, "0");
  }

  if (mi.length === 2) {
    let minute = Number.parseInt(mi, 10);
    if (Number.isNaN(minute) || minute < 0) minute = 0;
    if (minute > 59) minute = 59;
    mi = String(minute).padStart(2, "0");
  }

  if (ss.length === 2) {
    let second = Number.parseInt(ss, 10);
    if (Number.isNaN(second) || second < 0) second = 0;
    if (second > 59) second = 59;
    ss = String(second).padStart(2, "0");
  }

  let result = y;
  if (digits.length > 4) result += mo;
  if (digits.length > 6) result += da;
  if (digits.length > 8) result += hh;
  if (digits.length > 10) result += mi;
  if (digits.length > 12) result += ss;

  return result.slice(0, 14);
}

function formatDateMasked(digits: string): string {
  if (digits.length === 0) return "";
  const seg = (start: number, len: number) => digits.slice(start, start + len);
  return `${seg(0, 4)}-${seg(4, 2)}-${seg(6, 2)} ${seg(8, 2)}:${seg(10, 2)}:${seg(12, 2)}`;
}

function digitIndexFromCaret(formatted: string, caret: number): number {
  let digits = 0;
  for (let i = 0; i < Math.min(caret, formatted.length); i += 1) {
    if (/\d/.test(formatted[i])) digits += 1;
  }
  return digits;
}

function caretFromDigitIndex(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;
  let digits = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) {
      digits += 1;
      if (digits === digitIndex) return i + 1;
    }
  }
  return formatted.length;
}

function caretAfterLastDigit(formatted: string): number {
  for (let i = formatted.length - 1; i >= 0; i -= 1) {
    if (/\d/.test(formatted[i])) return i + 1;
  }
  return 0;
}

function MaskedDateInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const applyDigits = (digits: string, caretDigitIndex: number) => {
    const sanitized = sanitizeDateDigits(digits);
    const formatted = formatDateMasked(sanitized);
    pendingCaret.current = caretFromDigitIndex(
      formatted,
      Math.min(caretDigitIndex, sanitized.length),
    );
    onChange(formatted);
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || pendingCaret.current === null) return;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    input.setSelectionRange(caret, caret);
  });

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      value={value}
      placeholder="YYYY-MM-DD HH:mm:ss"
      maxLength={19}
      className={className}
      onChange={(event) => {
        const input = event.target;
        const caret = input.selectionStart ?? value.length;
        const digitIndex = digitIndexFromCaret(input.value, caret);
        applyDigits(extractDateDigits(input.value), digitIndex);
      }}
      onKeyDown={(event) => {
        const input = event.currentTarget;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;

        if (event.key === "Backspace" && start === end && start > 0) {
          let deleteAt = start;
          while (deleteAt > 0 && !/\d/.test(value[deleteAt - 1])) {
            deleteAt -= 1;
          }

          if (deleteAt !== start) {
            event.preventDefault();
            const digitIndex = digitIndexFromCaret(value, deleteAt);
            const digits = extractDateDigits(value);
            applyDigits(
              digits.slice(0, digitIndex - 1) + digits.slice(digitIndex),
              digitIndex - 1,
            );
            return;
          }
        }

        if (event.key === "Delete" && start === end && start < value.length) {
          let deleteAt = start;
          while (deleteAt < value.length && !/\d/.test(value[deleteAt])) {
            deleteAt += 1;
          }

          if (deleteAt !== start) {
            event.preventDefault();
            const digitIndex = digitIndexFromCaret(value, deleteAt + 1);
            const digits = extractDateDigits(value);
            applyDigits(
              digits.slice(0, digitIndex - 1) + digits.slice(digitIndex),
              digitIndex - 1,
            );
          }
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        const pasted = event.clipboardData.getData("text");
        const input = event.currentTarget;
        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? value.length;
        const digits = extractDateDigits(value);
        const startDigit = digitIndexFromCaret(value, start);
        const endDigit = digitIndexFromCaret(value, end);
        const pastedDigits = extractDateDigits(pasted);
        const merged =
          digits.slice(0, startDigit) + pastedDigits + digits.slice(endDigit);
        applyDigits(merged, startDigit + pastedDigits.length);
      }}
      onFocus={() => {
        if (!value) return;
        const caret = caretAfterLastDigit(value);
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(caret, caret);
        });
      }}
    />
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[#5f6672]">{label}</span>
      {children}
    </label>
  );
}

function BybitCopyIcon({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Copy"
      onClick={onClick}
      className={`inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0 ${className ?? ""}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="-1 -1 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block -translate-y-[1px] cursor-pointer align-middle"
        aria-hidden="true"
      >
        {/* Shifted Bottom-Left Rectangle */}
        <rect
          x="0.1"
          y="6.9"
          width="9"
          height="9"
          rx="2"
          stroke="#F8F8FA"
          strokeWidth="1.3"
        />
        {/* Top-Right Overlapping Rectangle with background mask */}
        <rect
          x="5.5"
          y="1.5"
          width="9"
          height="9"
          rx="2"
          fill="#100F15"
          stroke="#F8F8FA"
          strokeWidth="1.3"
        />
      </svg>
    </button>
  );
}

function getStatusStyles(status: WithdrawalStatus) {
  switch (status) {
    case "Pending":
      return {
        color: "#FF9900",
        label: "Withdrawal Pending",
        icon: (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF9900]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#121214]" />
          </span>
        ),
      };
    case "Failed":
      return {
        color: "#F6465D",
        label: "Withdrawal Failed",
        icon: (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F6465D]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#121214]" />
          </span>
        ),
      };
    default:
      return {
        color: "#2CAD79",
        label: "Withdrawal Completed",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="h-[16px] w-[16px] shrink-0"
            aria-hidden
          >
            {/* r = 8 - 1.5/2 so the 1.5px ring sits fully inside the 16x16 box */}
            <circle
              cx="8"
              cy="8"
              r="7.25"
              fill="#112D21"
              stroke="#253332"
              strokeWidth={1.5}
            />
            <g transform="translate(8 8) scale(0.625) translate(-8 -8)">
              <path
                d="M3.5 8.2 6.4 11l6-6"
                fill="none"
                stroke="#2CAD79"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        ),
      };
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="shrink-0 text-[14px] font-normal !text-[#AFB0B5]"
        style={{ color: "#AFB0B5" }}
      >
        {label}
      </span>
      <span
        className="text-right text-[14px] font-normal leading-[1.35] !text-[#F8F8FA]"
        style={{ color: "#F8F8FA" }}
      >
        {value}
      </span>
    </div>
  );
}

function splitFixed(value: string, sizes: number[]): string[] {
  const lines: string[] = [];
  let i = 0;
  for (const n of sizes) {
    if (i >= value.length) break;
    lines.push(value.slice(i, i + n));
    i += n;
  }
  if (i < value.length) lines.push(value.slice(i));
  return lines.length > 0 ? lines : [value];
}

function CopyableDetailRow({
  label,
  value,
  onCopy,
  wrapAt,
  wrapChunks,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  wrapAt?: number;
  wrapChunks?: number[];
}) {
  const chunkSizes = wrapChunks ?? (wrapAt != null ? [wrapAt] : undefined);
  const lines = chunkSizes ? splitFixed(value, chunkSizes) : null;
  const useFixedWrap = lines != null && lines.length > 0;

  return (
    <div className="flex items-start justify-between">
      <span
        className="shrink-0 text-[14px] font-normal !text-[#AFB0B5]"
        style={{ color: "#AFB0B5" }}
      >
        {label}
      </span>
      {useFixedWrap ? (
        <div className="flex min-w-0 flex-1 items-start justify-end gap-[1.5px]">
          <div
            className="flex min-w-0 flex-col text-right text-[14px] font-normal leading-[1.35] !text-[#F8F8FA]"
            style={{ color: "#F8F8FA" }}
          >
            {lines.map((line, index) => (
              <div key={`${index}-${line}`}>{line}</div>
            ))}
          </div>
          <BybitCopyIcon onClick={onCopy} />
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-start justify-end gap-[1.5px]">
          <span
            className="min-w-0 flex-1 break-all text-right text-[14px] font-normal leading-[1.35] !text-[#F8F8FA]"
            style={{ color: "#F8F8FA" }}
          >
            {value}
          </span>
          <BybitCopyIcon className="mt-[2px]" onClick={onCopy} />
        </div>
      )}
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]";

export default function BybitWithdrawalPage() {
  const receiptRef = useRef<HTMLDivElement>(null);

  const [coin, setCoin] = useState("USDT");
  const [amount, setAmount] = useState("100");
  const [withdrawalAccount, setWithdrawalAccount] = useState("Funding Account");
  const [fees, setFees] = useState("1 USDT");
  const [chainType, setChainType] = useState("Ethereum (ERC20)");
  const [address, setAddress] = useState(
    "0x71C7656EC7ab88b098defB751B7401A0f4003A9",
  );
  const [txid, setTxid] = useState(
    "0x830a39f120b65f7466e2f6ae8ff3fdf2236ffb7b7eb3b0bdbe18d5caecc4a",
  );
  const [time, setTime] = useState("2026-03-28 20:27:49");
  const [status, setStatus] = useState<WithdrawalStatus>("Completed");

  const [clock, setClock] = useState("12:05");
  const [signal, setSignal] = useState<SignalLevel>("full");
  const [wifi, setWifi] = useState<SignalLevel>("full");
  const [cellular, setCellular] = useState<SignalLevel>("full");
  const [cellularType, setCellularType] = useState<CellularType>("4G");
  const [battery, setBattery] = useState(27);
  const [charging, setCharging] = useState(false);
  const [showBatteryPercent, setShowBatteryPercent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Image");

  const statusStyles = getStatusStyles(status);

  const exportOptions = {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#100F15",
  } as const;

  async function exportReceipt(action: "download" | "copy") {
    if (!receiptRef.current) return;

    if (action === "download") {
      setExporting(true);
      try {
        const dataUrl = await toPng(receiptRef.current, exportOptions);
        const link = document.createElement("a");
        link.download = `bybit-withdrawal-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } finally {
        setExporting(false);
      }
      return;
    }

    setCopying(true);
    try {
      const blob = await toBlob(receiptRef.current, exportOptions);
      if (!blob) throw new Error("Failed to create image blob");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyLabel("Copied cleanly!");
      window.setTimeout(() => setCopyLabel("Copy Image"), 1600);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy Image"), 1600);
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef0f3] text-[#1f2328]">
      <AppHeader />

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* Left — Bybit Withdrawal Settings */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Bybit Withdrawal Settings</h2>
          <div className="space-y-4">
            <Field label="Coin">
              <input
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Amount">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Withdrawal Account">
              <input
                value={withdrawalAccount}
                onChange={(e) => setWithdrawalAccount(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Fees">
              <input
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Chain Type">
              <input
                value={chainType}
                onChange={(e) => setChainType(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Withdrawal Address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Transaction Hash">
              <div className="relative">
                <input
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className={`${inputClassName} pr-10`}
                />
                <button
                  type="button"
                  aria-label="Generate random transaction hash"
                  onClick={() => setTxid(randomTxId())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5f6672] hover:bg-[#f0f2f5]"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </Field>

            <Field label="Time">
              <MaskedDateInput
                value={time}
                onChange={setTime}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 font-sans text-sm tracking-wide outline-none focus:border-[#2563eb]"
              />
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WithdrawalStatus)}
                className={inputClassName}
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </Field>
          </div>
        </section>

        {/* Center — Bybit phone preview */}
        <section className="flex w-full items-start justify-center px-2 py-2">
          <div className="relative mx-auto flex aspect-[9/19.5] w-full max-w-[430px] flex-col justify-between rounded-[50px] bg-[#100F15] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="pointer-events-none absolute top-[22%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[32%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[26%] right-[-3px] h-16 w-[3px] rounded-r-sm bg-[#2a2a2e]" />

            <div
              id="receipt-preview"
              ref={receiptRef}
              className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[42px] bg-[#100F15] ${sfProText.className} [&_*]:[scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden`}
              style={{
                backgroundColor: "#100F15",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                textRendering: "optimizeLegibility",
              }}
            >
              <IPhoneStatusBar
                time={clock}
                clockClassName="text-[#FBFBFC]"
                signal={signal}
                wifi={wifi}
                cellularType={cellularType}
                batteryLevel={battery}
                showBatteryPercent={showBatteryPercent}
                charging={charging}
              />
              <HomeIndicator />

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-10">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[16px]">
                <div className="relative flex min-h-[44px] shrink-0 items-center py-[10px]">
                  <BybitBackButton />
                  <span
                    className="pointer-events-none absolute inset-x-0 text-center"
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#EAECEF",
                      letterSpacing: "0.01em",
                    }}
                  >
                    Withdrawal Details
                  </span>
                </div>

                <div className="mt-[35px] flex flex-col items-center justify-center">
                  <p
                    className="!mb-[8px] !text-[13px] !font-normal !leading-none !text-[#AFB0B5]"
                    style={{
                      color: "#AFB0B5",
                      fontSize: "13px",
                      fontWeight: 400,
                      marginBottom: "8px",
                      lineHeight: 1,
                    }}
                  >
                    Quantity
                  </p>
                  <p
                    className="!text-[20px] !font-medium !leading-none !text-[#EAECEF]"
                    style={{
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "#EAECEF",
                      lineHeight: 1,
                      marginTop: 0,
                      marginBottom: 0,
                    }}
                  >
                    {amount} {coin}
                  </p>
                  <div
                    className="mb-[66px] inline-flex items-center gap-[4px]"
                    style={{
                      color: statusStyles.color,
                      marginTop: "8px",
                      lineHeight: 1,
                    }}
                  >
                    {statusStyles.icon}
                    <span className="text-[14px] font-medium leading-none">
                      {statusStyles.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-[15px]">
                  <DetailRow label="Withdrawal Account" value={withdrawalAccount} />
                  <DetailRow label="Fees" value={fees} />
                  <DetailRow label="Chain Type" value={chainType} />
                  <DetailRow label="Time" value={time} />

                  <CopyableDetailRow
                    label="Withdrawal Address"
                    value={address}
                    wrapAt={23}
                    onCopy={() => navigator.clipboard.writeText(address)}
                  />

                  <CopyableDetailRow
                    label="Transaction Hash"
                    value={txid}
                    wrapChunks={[24, 24]}
                    onCopy={() => navigator.clipboard.writeText(txid)}
                  />
                </div>
                </div>

                <div className="mt-auto w-full px-0 pt-10">
                  <button
                    type="button"
                    className="w-full rounded-full border border-[#646369] bg-transparent py-[8px] text-center text-[13.5px] font-medium text-white transition-colors"
                  >
                    View in Blockchain Explorer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right — Status + Export */}
        <section className="space-y-5">
          <StatusBarPanel
            clock={clock}
            signal={signal}
            wifi={wifi}
            cellular={cellular}
            cellularType={cellularType}
            battery={battery}
            charging={charging}
            showBatteryPercent={showBatteryPercent}
            onClockChange={setClock}
            onSignalChange={setSignal}
            onWifiChange={setWifi}
            onCellularChange={setCellular}
            onCellularTypeChange={setCellularType}
            onBatteryChange={setBattery}
            onChargingChange={setCharging}
            onShowBatteryPercentChange={setShowBatteryPercent}
          />

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <h2 className="mb-5 text-left text-lg font-semibold">
                  Save Image
                </h2>
                <button
                  type="button"
                  onClick={() => exportReceipt("download")}
                  disabled={exporting || copying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Exporting..." : "Download PNG"}
                </button>
              </div>
              <div className="min-w-0">
                <h2 className="mb-5 text-right text-lg font-semibold">Copy</h2>
                <button
                  type="button"
                  onClick={() => exportReceipt("copy")}
                  disabled={exporting || copying}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Copy className="h-4 w-4" />
                  {copying ? "Copying..." : copyLabel}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
