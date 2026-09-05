"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toBlob, toPng } from "html-to-image";
import {
  ChevronLeft,
  Copy,
  Download,
  Info,
  RefreshCw,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { HomeIndicator } from "@/components/HomeIndicator";
import {
  IPhoneStatusBar,
  type CellularType,
} from "@/components/IPhoneStatusBar";
import { StatusBarPanel } from "@/components/StatusBarPanel";
import { type SignalLevel } from "@/components/status-icons";

function randomTxId() {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function randomReferenceNo() {
  return String(Math.floor(100000000 + Math.random() * 900000000));
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

function formatOkxSubmittedTime(value: string): string {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) return value;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const year = match[1];
  const month = months[Number.parseInt(match[2], 10) - 1] ?? match[2];
  const day = Number.parseInt(match[3], 10);
  let hour = Number.parseInt(match[4], 10);
  const minute = match[5];
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${month} ${day}, ${year}, ${hour}:${minute} ${ampm}`;
}

function truncateTxid(txid: string): string {
  if (txid.length <= 12) return txid;
  return `${txid.slice(0, 5)}...${txid.slice(-5)}`;
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

function UsdtLogoSvg({
  className = "h-12 w-12",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 800 800"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="400" cy="400" r="400" fill="#009392" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M400.49 428.59c68.79 0 126.28-11.63 140.33-27.17-11.93-13.18-55.08-23.56-109.88-26.4v32.83c-9.81.51-20.01.76-30.46.76s-20.65-.25-30.48-.76v-32.83c-54.78 2.84-97.95 13.22-109.88 26.4 14.07 15.54 71.57 27.17 140.36 27.17Zm122.22-154.53v45.21h-91.77v31.35c64.46 3.35 112.83 17.13 113.19 33.62v34.38c-.36 16.49-48.73 30.24-113.19 33.6v76.94h-60.93v-76.94c-64.46-3.35-112.81-17.11-113.17-33.6v-34.38c.36-16.49 48.71-30.27 113.17-33.62v-31.35h-91.77v-45.21h244.48Zm-280.56-71.95h322.16c7.7 0 14.79 4.05 18.63 10.63l93.85 161.16a21.04 21.04 0 0 1-3.52 25.68L414.93 651.76c-8.38 8.17-21.84 8.17-30.2 0L126.71 399.92c-7.09-6.94-8.43-17.79-3.2-26.19l100.33-161.49c3.91-6.28 10.85-10.12 18.32-10.12Z"
      />
    </svg>
  );
}

function TronDot() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="#FA0512" />
      {/* White architecture from official TRON mark vertices */}
      <path
        d="M7.5 7.257 21.932 9.913 25.678 13.475 15.095 26.369Z"
        stroke="#FFFFFF"
        strokeWidth="0.75"
        strokeLinejoin="miter"
      />
      <path
        d="M7.5 7.257 16.105 14.989M21.932 9.913 16.105 14.989M25.678 13.475 16.105 14.989M15.095 26.369 16.105 14.989"
        stroke="#FFFFFF"
        strokeWidth="0.75"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

const inputClassName =
  "w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]";

export default function OkxWithdrawalPage() {
  const receiptRef = useRef<HTMLDivElement>(null);

  const [amount, setAmount] = useState("25");
  const [asset, setAsset] = useState("USDT");
  const [price, setPrice] = useState("0.99");
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [network, setNetwork] = useState("Tron (TRC20)");
  const [networkFee, setNetworkFee] = useState("1.5");
  const [address, setAddress] = useState(
    "TAp7rM9fmpQTSB8H2dMham4TdPLCqZTD1B",
  );
  const [txid, setTxid] = useState(
    "50d0a3f120b65f7466e2f6ae8ff3fdf22136ffb7b7eb3b0bdbe18d5ca1908",
  );
  const [submittedAt, setSubmittedAt] = useState("2026-06-25 14:36:00");
  const [referenceNo, setReferenceNo] = useState("410893276");

  const [clock, setClock] = useState("11:51");
  const [signal, setSignal] = useState<SignalLevel>("full");
  const [wifi, setWifi] = useState<SignalLevel>("full");
  const [cellular, setCellular] = useState<SignalLevel>("full");
  const [cellularType, setCellularType] = useState<CellularType>("4G");
  const [battery, setBattery] = useState(38);
  const [charging, setCharging] = useState(false);
  const [showBatteryPercent, setShowBatteryPercent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Image");

  const usdEstimate = useMemo(() => {
    const a = Number.parseFloat(amount) || 0;
    const p = Number.parseFloat(price) || 0;
    return (a * p).toFixed(2);
  }, [amount, price]);

  async function fetchLiveUsdtPrice() {
    setPriceLoading(true);
    setSyncError(null);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd",
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Rate limited or network error");
      const data = await res.json();
      if (data?.tether?.usd) {
        setPrice(Number(data.tether.usd).toFixed(4));
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        throw new Error("Invalid price data format");
      }
    } catch {
      // Network/CORS/rate-limit failures are expected offline — surface in UI only
      // (avoid console.error so Next.js dev overlay does not treat this as a crash)
      setSyncError("Failed to sync price");
    } finally {
      setPriceLoading(false);
    }
  }

  useEffect(() => {
    void fetchLiveUsdtPrice();
  }, []);

  const exportOptions = {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#000000",
  } as const;

  async function exportReceipt(action: "download" | "copy") {
    if (!receiptRef.current) return;

    if (action === "download") {
      setExporting(true);
      try {
        const dataUrl = await toPng(receiptRef.current, exportOptions);
        const link = document.createElement("a");
        link.download = `okx-withdrawal-${Date.now()}.png`;
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
    <div className="min-h-screen bg-[#eef0f3] font-okx text-[#1f2328]">
      <AppHeader />

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* Left — OKX Withdrawal Settings */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">OKX Withdrawal Settings</h2>
          <div className="space-y-4">
            <Field label="Amount">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Asset">
              <input
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <div className="block">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-sm text-[#5f6672]">Price (USD)</span>
                <div className="flex items-center gap-2">
                  {lastSynced && (
                    <span className="text-[10px] text-[#848E9C]">
                      Synced at {lastSynced}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void fetchLiveUsdtPrice()}
                    disabled={priceLoading}
                    className="text-[11px] font-medium text-[#2563eb] hover:underline disabled:opacity-50"
                  >
                    {priceLoading ? "Syncing..." : "Sync Live"}
                  </button>
                </div>
              </div>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClassName}
              />
              {syncError && (
                <p className="mt-1 text-[11px] text-red-600">{syncError}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#f7f8fa] px-3 py-2.5">
              <span className="text-sm text-[#5f6672]">USD estimate</span>
              <span className="text-sm font-semibold">~${usdEstimate}</span>
            </div>

            <Field label="Network">
              <input
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label={`Network fee (${asset})`}>
              <input
                value={networkFee}
                onChange={(e) => setNetworkFee(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Transaction ID">
              <div className="relative">
                <input
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className={`${inputClassName} pr-10`}
                />
                <button
                  type="button"
                  aria-label="Generate random Txid"
                  onClick={() => setTxid(randomTxId())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5f6672] hover:bg-[#f0f2f5]"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </Field>

            <Field label="Submitted time">
              <MaskedDateInput
                value={submittedAt}
                onChange={setSubmittedAt}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 font-sans text-sm tracking-wide outline-none focus:border-[#2563eb]"
              />
            </Field>

            <Field label="Reference no.">
              <div className="relative">
                <input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className={`${inputClassName} pr-10`}
                />
                <button
                  type="button"
                  aria-label="Generate random reference"
                  onClick={() => setReferenceNo(randomReferenceNo())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5f6672] hover:bg-[#f0f2f5]"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </Field>
          </div>
        </section>

        {/* Center — OKX phone preview */}
        <section className="flex w-full items-start justify-center px-2 py-2">
          <div className="relative mx-auto flex aspect-[9/19.5] w-full max-w-[430px] flex-col justify-between rounded-[50px] bg-[#111111] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="pointer-events-none absolute top-[22%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[32%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[26%] right-[-3px] h-16 w-[3px] rounded-r-sm bg-[#2a2a2e]" />

            <div
              id="receipt-preview"
              ref={receiptRef}
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[42px] bg-black [&_*]:[scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden"
            >
              <HomeIndicator />

              <IPhoneStatusBar
                time={clock}
                signal={signal}
                wifi={wifi}
                cellularType={cellularType}
                batteryLevel={battery}
                showBatteryPercent={showBatteryPercent}
                charging={charging}
              />

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-10">
                <div className="relative flex shrink-0 items-center py-2">
                  <ChevronLeft
                    className="relative z-10 h-6 w-6 shrink-0 text-white"
                    strokeWidth={1.75}
                  />
                </div>

                <div className="pt-2 text-center">
                  <div className="mx-auto flex justify-center">
                    <UsdtLogoSvg className="h-12 w-12" />
                  </div>
                  <p className="mt-3 text-[22px] font-bold leading-tight tracking-tight text-white">
                    Withdrawn {amount} {asset}
                  </p>
                  <p className="mt-1 text-[13px] text-white/60">
                    ~${usdEstimate}
                  </p>
                </div>

                <div className="mt-8 -mx-5 flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-[#1D9A53]">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-[12.5px] w-[12.5px]"
                        aria-hidden
                      >
                        <path
                          d="M3.5 8.2 6.4 11l6-6"
                          fill="none"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[14px] font-bold tracking-tight text-white">
                      Status
                    </span>
                  </div>
                  <span className="text-[14px] font-normal tracking-normal text-[#8E8E93]">
                    Completed
                  </span>
                </div>

                <div className="-mx-5 mt-[12px] mb-[8px]">
                  <div className="h-px w-full bg-white/10" />
                </div>

                <div className="mt-0 space-y-0">
                  <div className="flex items-start justify-between gap-3 py-[18px]">
                    <span className="shrink-0 text-[13px] font-semibold tracking-normal text-white">
                      Address
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end text-right text-[13px] font-normal leading-[1.3] tracking-normal text-[#8E8E93]">
                        <span>{address.slice(0, 17)}</span>
                        <span>{address.slice(17)}</span>
                      </div>
                      <Copy
                        className="h-[14px] w-[14px] shrink-0 cursor-pointer text-[#8E8E93]"
                        onClick={() => navigator.clipboard.writeText(address)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-[18px]">
                    <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold tracking-normal text-white">
                      Price
                      <Info className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                    </span>
                    <span className="text-[13px] font-normal tracking-normal text-[#8E8E93]">
                      ${price}/{asset}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-[18px]">
                    <span className="shrink-0 text-[13px] font-semibold tracking-normal text-white">
                      Network
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-normal tracking-normal text-[#8E8E93]">
                      <TronDot />
                      {network}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-[18px]">
                    <span className="shrink-0 text-[13px] font-semibold tracking-normal text-white">
                      Network fee
                    </span>
                    <span className="text-[13px] font-normal tracking-normal text-[#8E8E93]">
                      {networkFee} {asset}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-[18px]">
                    <span className="shrink-0 text-[13px] font-semibold tracking-normal text-white">
                      Transaction ID
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-normal tracking-normal text-[#8E8E93]">
                      {truncateTxid(txid)}
                      <Copy
                        className="h-3.5 w-3.5 shrink-0 cursor-pointer text-[#8E8E93]"
                        onClick={() => navigator.clipboard.writeText(txid)}
                      />
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-[18px]">
                    <span className="shrink-0 text-[13px] font-semibold tracking-normal text-white">
                      Submitted time
                    </span>
                    <span className="text-right text-[13px] font-normal tracking-normal text-[#8E8E93]">
                      {formatOkxSubmittedTime(submittedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-[18px]">
                    <span className="shrink-0 text-[13px] font-semibold tracking-normal text-white">
                      Reference no.
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-normal tracking-normal text-[#8E8E93]">
                      {referenceNo}
                      <Copy
                        className="h-3.5 w-3.5 shrink-0 cursor-pointer text-[#8E8E93]"
                        onClick={() =>
                          navigator.clipboard.writeText(referenceNo)
                        }
                      />
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col items-center gap-4 pt-6 pb-2">
                  <button
                    type="button"
                    className="w-full -translate-y-[26px] rounded-full bg-[#BBFF2E] py-3.5 text-center text-[15px] font-bold text-black transition-colors hover:bg-[#b2da2f]"
                  >
                    View on blockchain explorer
                  </button>

                  <button
                    type="button"
                    className="cursor-pointer text-[13px] font-medium text-white hover:underline"
                  >
                    Why hasn&apos;t my transaction arrived?
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
