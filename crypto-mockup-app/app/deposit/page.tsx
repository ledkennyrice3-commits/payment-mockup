"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toBlob, toPng } from "html-to-image";
import { ChevronLeft, Copy, Download, Headphones, RefreshCw } from "lucide-react";
import useSWR from "swr";
import { AppHeader } from "@/components/AppHeader";
import { HomeIndicator } from "@/components/HomeIndicator";
import {
  IPhoneStatusBar,
  type CellularType,
} from "@/components/IPhoneStatusBar";
import { StatusBarPanel } from "@/components/StatusBarPanel";
import { type SignalLevel } from "@/components/status-icons";

export type DepositFormData = {
  coin: string;
  amount: string;
  account: string;
  chain: string;
  time: string;
  address: string;
  txid: string;
};

function randomTxId() {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function networkFromChain(chain: string) {
  const value = chain.toUpperCase();
  if (value.includes("TRC20") || value.includes("TRON")) return "TRX";
  if (value.includes("BEP20") || value.includes("BSC")) return "BSC";
  if (value.includes("ERC20") || value.includes("ETH")) return "ETH";
  if (value.includes("SOL")) return "SOL";
  return chain;
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

const DEFAULT_FORM: DepositFormData = {
  coin: "USDT",
  amount: "29",
  account: "Funding Account",
  chain: "TRON (TRC20)",
  time: "2025-02-23 23:53:57",
  address: "TJ9YhPNqEPUo2LNxqY7HrDpLv",
  txid: "ec849145af340721889255d1a2b3c4d5e6f7890abcdef1234567890abcdef12",
};

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

function DetailRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-2 py-3">
      <span className="w-[88px] shrink-0 select-none whitespace-nowrap text-[13px] font-normal leading-tight text-[#848E9C]">
        {label}
      </span>
      <span
        className={`min-w-0 flex-1 text-right text-[13px] font-normal leading-normal text-[#EAECEF] ${
          valueClassName || "tracking-tight"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]";

type TradePairCard = {
  pair: string;
  base: string;
  price: string;
  change: string;
  isPositive: boolean;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

const TICKER_ORDER = ["USDCUSDT", "BTCUSDT", "ETHUSDT"] as const;

const FALLBACK_PAIRS: TradePairCard[] = [
  {
    pair: "USDC",
    base: "/USDT",
    price: "0.99963",
    change: "-0.03%",
    isPositive: false,
  },
  {
    pair: "BTC",
    base: "/USDT",
    price: "79,616.59",
    change: "-1.81%",
    isPositive: false,
  },
  {
    pair: "ETH",
    base: "/USDT",
    price: "2,453.57",
    change: "-1.97%",
    isPositive: false,
  },
];

async function fetchBinanceTickers(url: string): Promise<BinanceTicker[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load tickers");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid ticker payload");
  return data;
}

function formatTickerPrice(symbol: string, lastPrice: string): string {
  const value = Number(lastPrice);
  if (!Number.isFinite(value)) return lastPrice;
  if (symbol === "USDCUSDT") {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTickerChange(pct: string): { change: string; isPositive: boolean } {
  const value = Number(pct);
  if (!Number.isFinite(value)) {
    return { change: pct, isPositive: false };
  }
  const isPositive = value > 0;
  const change = `${isPositive ? "+" : ""}${value.toFixed(2)}%`;
  return { change, isPositive };
}

function mapTickersToCards(data: BinanceTicker[] | undefined): TradePairCard[] | null {
  if (!data?.length) return null;
  const bySymbol = new Map(data.map((ticker) => [ticker.symbol, ticker]));

  const cards: TradePairCard[] = [];
  for (const symbol of TICKER_ORDER) {
    const ticker = bySymbol.get(symbol);
    if (!ticker) return null;
    const { change, isPositive } = formatTickerChange(ticker.priceChangePercent);
    cards.push({
      pair: symbol.replace("USDT", ""),
      base: "/USDT",
      price: formatTickerPrice(symbol, ticker.lastPrice),
      change,
      isPositive,
    });
  }
  return cards;
}

export default function DepositPage() {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<DepositFormData>(DEFAULT_FORM);

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

  const { data: tickerData } = useSWR(
    "/api/binance-ticker",
    fetchBinanceTickers,
    { refreshInterval: 5000 },
  );

  const tradePairs = useMemo(
    () => mapTickersToCards(tickerData) ?? FALLBACK_PAIRS,
    [tickerData],
  );

  function updateField<K extends keyof DepositFormData>(
    key: K,
    value: DepositFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const networkLabel = networkFromChain(formData.chain);

  const exportOptions = {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#181A20",
  } as const;

  async function exportReceipt(action: "download" | "copy") {
    if (!receiptRef.current) return;

    if (action === "download") {
      setExporting(true);
      try {
        const dataUrl = await toPng(receiptRef.current, exportOptions);
        const link = document.createElement("a");
        link.download = `deposit-receipt-${Date.now()}.png`;
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
        {/* Left panel — Edit Deposit */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Edit Deposit</h2>
          <div className="space-y-4">
            <Field label="Coin">
              <input
                type="text"
                value={formData.coin}
                onChange={(e) => updateField("coin", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Amount">
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Wallet">
              <input
                type="text"
                value={formData.account}
                onChange={(e) => updateField("account", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Chain Type">
              <input
                type="text"
                value={formData.chain}
                onChange={(e) => updateField("chain", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Time">
              <MaskedDateInput
                value={formData.time}
                onChange={(value) => updateField("time", value)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 font-sans text-sm tracking-wide outline-none focus:border-[#2563eb]"
              />
            </Field>

            <Field label="Deposit Address">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="Transaction Hash">
              <div className="relative">
                <input
                  type="text"
                  value={formData.txid}
                  onChange={(e) => updateField("txid", e.target.value)}
                  className={`${inputClassName} truncate pr-10`}
                />
                <button
                  type="button"
                  aria-label="Generate random Transaction Hash"
                  onClick={() => updateField("txid", randomTxId())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5f6672] hover:bg-[#f0f2f5]"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </Field>
          </div>
        </section>

        {/* Center — phone preview */}
        <section className="flex w-full items-start justify-center px-2 py-2">
          <div className="relative mx-auto flex aspect-[9/19.5] w-full max-w-[430px] flex-col justify-between rounded-[50px] bg-[#111111] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="pointer-events-none absolute top-[22%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[32%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[26%] right-[-3px] h-16 w-[3px] rounded-r-sm bg-[#2a2a2e]" />

            <div
              id="receipt-preview"
              ref={receiptRef}
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[42px] bg-[#181A20] [&_*]:[scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden"
            >
              <HomeIndicator />

              <IPhoneStatusBar
                time={clock}
                clockClassName="text-[13.5px] font-medium tracking-[-0.1px] leading-none translate-y-[1px]"
                signal={signal}
                wifi={wifi}
                cellularType={cellularType}
                batteryLevel={battery}
                showBatteryPercent={showBatteryPercent}
                charging={charging}
              />

              {/* Body content */}
              <div className="flex min-h-0 flex-1 flex-col pt-2">
                <div className="relative flex shrink-0 items-center justify-between px-6 py-[10px]">
                  <ChevronLeft
                    className="relative z-10 h-5 w-5 shrink-0 text-[#EAECEF]"
                    strokeWidth={1.75}
                  />
                  <span className="pointer-events-none absolute inset-x-0 text-center text-[15px] font-medium text-[#EAECEF]">
                    Deposit Details
                  </span>
                  <span className="relative z-10 shrink-0">
                    <Headphones
                      className="h-5 w-5 text-[#EAECEF]"
                      strokeWidth={1.5}
                    />
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="px-6 pt-6 text-center">
                    <p className="text-2xl font-semibold leading-tight tracking-tight text-[#EAECEF]">
                      +{formData.amount} {formData.coin}
                    </p>

                    <div className="mt-2 inline-flex items-center gap-1 text-[#0ECB81]">
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                      <span className="text-[13px] font-medium leading-none">
                        Completed
                      </span>
                    </div>

                    <p className="mx-auto mt-2.5 text-center text-[11px] font-normal leading-tight text-[#848E9C]">
                      Crypto has arrived in your Binance account. View your spot
                      <br />
                      account balance for more details.
                    </p>
                  </div>

                  <div className="my-6 w-full border-t border-[#2B313A] opacity-40" />

                  <div className="px-6">
                    <DetailRow label="Network" value={networkLabel} />

                    {/* Address Row */}
                    <div className="flex items-start justify-between py-3">
                      <span className="w-[88px] shrink-0 text-[13px] text-[#848E9C]">
                        Address
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-end gap-1.5">
                        <div className="flex min-w-0 max-w-full flex-col items-end text-right">
                          <div className="max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF]">
                            {formData.address.slice(0, 30)}
                          </div>
                          {formData.address.length > 30 ? (
                            <div className="mt-0.5 max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF]">
                              {formData.address.slice(30)}
                            </div>
                          ) : null}
                        </div>
                        <Copy
                          className="mt-[2px] h-3.5 w-3.5 shrink-0 cursor-pointer text-[#848E9C] hover:text-white"
                          onClick={() =>
                            navigator.clipboard.writeText(formData.address)
                          }
                        />
                      </div>
                    </div>

                    {/* Txid Row */}
                    <div className="flex items-start justify-between py-3">
                      <span className="w-[88px] shrink-0 text-[13px] text-[#848E9C]">
                        Txid
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-end gap-1.5">
                        <div className="flex min-w-0 max-w-full flex-col items-end text-right">
                          <div className="max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF] underline decoration-[#848E9C]/60 underline-offset-[3px]">
                            {formData.txid.slice(0, 34)}
                          </div>
                          {formData.txid.length > 34 ? (
                            <div className="mt-0.5 max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF] underline decoration-[#848E9C]/60 underline-offset-[3px]">
                              {formData.txid.slice(34)}
                            </div>
                          ) : null}
                        </div>
                        <Copy
                          className="mt-[2px] h-3.5 w-3.5 shrink-0 cursor-pointer text-[#848E9C] hover:text-white"
                          onClick={() =>
                            navigator.clipboard.writeText(formData.txid)
                          }
                        />
                      </div>
                    </div>

                    <DetailRow
                      label="Wallet"
                      value={formData.account}
                    />
                    <DetailRow
                      label="Date"
                      value={formData.time}
                      valueClassName="font-sans tracking-wide"
                    />
                  </div>

                  <div className="mt-6 w-full border-t border-[#2B313A] opacity-40" />

                  <div className="mt-4 flex flex-col gap-3 px-6 pb-6">
                    {tradePairs.map((item) => (
                      <div
                        key={item.pair}
                        className="flex items-center justify-between rounded-2xl border border-[#2B313A] p-4"
                      >
                        <div>
                          <p className="text-[15px] font-semibold text-[#EAECEF]">
                            {item.pair}
                            <span className="font-normal text-[#848E9C]">
                              {item.base}
                            </span>
                          </p>
                          <p className="mt-1 text-[13px] font-medium text-[#EAECEF]">
                            {item.price}{" "}
                            <span
                              className={
                                item.isPositive
                                  ? "text-[#0ECB81]"
                                  : "text-[#F6465D]"
                              }
                            >
                              {item.change}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-xl bg-[#FCD535] px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                        >
                          Trade Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel — Status Bar controls */}
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
