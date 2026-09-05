"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import {
  ChevronLeft,
  Copy,
  Download,
  Headphones,
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

type Status = "Completed" | "Pending" | "Failed";

function randomTxId() {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
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

export default function Home() {
  const receiptRef = useRef<HTMLDivElement>(null);

  const [coin, setCoin] = useState("USDT");
  const [amount, setAmount] = useState("37");
  const [fee, setFee] = useState("1");
  const [network, setNetwork] = useState("TRX");
  const [address, setAddress] = useState("TSeeRHvSHio9q97QVEZPhFc6FkGE6x1UCU");
  const [txId, setTxId] = useState(
    "830a39f120b65f7466e2f6ae8ff3fdf22136ffb7b7eb3b0bdbe18d5caecc4a",
  );
  const [withdrawalWallet, setWithdrawalWallet] = useState("Spot Account");
  const [date, setDate] = useState("2026-03-28 20:27:49");
  const [status, setStatus] = useState<Status>("Completed");

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

  const netAmount = useMemo(() => {
    const gross = Number.parseFloat(amount) || 0;
    const networkFee = Number.parseFloat(fee) || 0;
    return gross - networkFee;
  }, [amount, fee]);

  const statusStyles = {
    Completed: {
      color: "#0ECB81",
      icon: (
        <svg
          className="h-[18px] w-[18px] shrink-0"
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
      ),
    },
    Pending: {
      color: "#FCD535",
      icon: (
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#FCD535]" />
      ),
    },
    Failed: {
      color: "#F6465D",
      icon: (
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F6465D] text-[9px] font-bold text-white">
          !
        </span>
      ),
    },
  }[status];

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
        link.download = `receipt-${Date.now()}.png`;
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
        {/* Left panel */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Edit Withdrawal</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">Coin</span>
              <input
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">
                Amount ({coin})
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">
                Network fee ({coin})
              </span>
              <input
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>

            <div className="flex items-center justify-between rounded-lg bg-[#f7f8fa] px-3 py-2.5">
              <span className="text-sm text-[#5f6672]">Net amount</span>
              <span className="text-sm font-semibold">
                -{netAmount} {coin}
              </span>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">Network</span>
              <input
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">Txid</span>
              <div className="relative">
                <input
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#2563eb]"
                />
                <button
                  type="button"
                  aria-label="Generate random Txid"
                  onClick={() => setTxId(randomTxId())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5f6672] hover:bg-[#f0f2f5]"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">
                Wallet
              </span>
              <input
                value={withdrawalWallet}
                onChange={(e) => setWithdrawalWallet(e.target.value)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">Date</span>
              <MaskedDateInput
                value={date}
                onChange={setDate}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 font-sans text-sm tracking-wide outline-none focus:border-[#2563eb]"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-[#5f6672]">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </label>
          </div>
        </section>

        {/* Center mobile preview */}
        <section className="flex w-full items-start justify-center px-2 py-2">
          <div className="relative mx-auto flex aspect-[9/19.5] w-full max-w-[430px] flex-col justify-between rounded-[50px] bg-[#111111] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            {/* Left side — Volume Up / Volume Down */}
            <div className="pointer-events-none absolute top-[22%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[32%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            {/* Right side — Power */}
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

              {/* Master content rail — padding on children so divider can go edge-to-edge */}
              <div className="flex min-h-0 flex-1 flex-col pt-2">
                {/* Navigation Header — edges align with Network / TRX */}
                <div className="relative flex shrink-0 items-center justify-between px-6 py-[10px]">
                  <ChevronLeft
                    className="relative z-10 h-5 w-5 shrink-0 text-[#EAECEF]"
                    strokeWidth={1.75}
                  />
                  <span className="pointer-events-none absolute inset-x-0 text-center text-[15px] font-medium text-[#EAECEF]">
                    Withdrawal Details
                  </span>
                  <span className="relative z-10 shrink-0">
                    <Headphones className="h-5 w-5 text-[#EAECEF]" strokeWidth={1.5} />
                  </span>
                </div>

                {/* Main body */}
                <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
                  <div className="min-h-0">
                    <div className="px-6 pt-6 text-center">
                      <p className="text-center text-[#EAECEF]">
                        <span className="inline-flex items-center text-2xl font-semibold leading-tight tracking-tight">
                          <svg
                            width="7"
                            height="2"
                            viewBox="0 0 7 2"
                            fill="none"
                            className="mr-[2px] shrink-0"
                            aria-hidden
                          >
                            <rect width="7" height="2" rx="0.5" fill="currentColor" />
                          </svg>
                          <span>
                            {netAmount} {coin}
                          </span>
                        </span>
                      </p>

                      <div
                        className="mt-2 inline-flex items-center gap-1"
                        style={{ color: statusStyles.color }}
                      >
                        {statusStyles.icon}
                        <span className="text-[13px] font-medium leading-none">
                          {status}
                        </span>
                      </div>

                      <div className="my-2 w-full px-4 text-center text-[12px] leading-tight text-[#848E9C]">
                        <p>
                          {
                            "Crypto transferred out of Binance. Please contact the recipient"
                          }
                        </p>
                        <p>platform for your transaction receipt.</p>
                      </div>

                      <button
                        type="button"
                        className="mx-auto mt-2 block px-6 text-xs font-normal leading-snug text-[#B89E2F] hover:underline"
                      >
                        Why hasn&apos;t my withdrawal arrived?
                      </button>
                    </div>

                    {/* Edge-to-edge divider — outside padded sections */}
                    <div className="mt-6 mb-3 w-full border-t border-[#2B313A] opacity-40" />

                    <div className="px-6">
                      <DetailRow label="Network" value={network} />

                      {/* Address Row */}
                      <div className="flex items-start justify-between py-3">
                        <span className="w-[88px] shrink-0 text-[13px] text-[#848E9C]">
                          Address
                        </span>
                        <div className="flex min-w-0 flex-1 items-start justify-end gap-1.5">
                          <div className="flex min-w-0 max-w-full flex-col items-end text-right">
                            <div className="max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF]">
                              {address.slice(0, 30)}
                            </div>
                            {address.length > 30 ? (
                              <div className="mt-0.5 max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF]">
                                {address.slice(30)}
                              </div>
                            ) : null}
                            <button
                              type="button"
                              className="mt-1 text-xs font-normal text-[#B89E2F] hover:underline"
                            >
                              Save Address
                            </button>
                          </div>
                          <Copy
                            className="mt-[2px] h-3.5 w-3.5 shrink-0 cursor-pointer text-[#848E9C] hover:text-white"
                            onClick={() =>
                              navigator.clipboard.writeText(address)
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
                            <div className="max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF] underline decoration-[1.1px] decoration-[#CBCED3] underline-offset-[1px]">
                              {txId.slice(0, 34)}
                            </div>
                            {txId.length > 34 ? (
                              <div className="mt-0.5 max-w-full break-all text-[12px] font-normal leading-tight tracking-tight text-[#EAECEF] underline decoration-[1.1px] decoration-[#CBCED3] underline-offset-[1px]">
                                {txId.slice(34)}
                              </div>
                            ) : null}
                          </div>
                          <Copy
                            className="mt-[2px] h-3.5 w-3.5 shrink-0 cursor-pointer text-[#848E9C] hover:text-white"
                            onClick={() =>
                              navigator.clipboard.writeText(txId)
                            }
                          />
                        </div>
                      </div>

                      <DetailRow label="Amount" value={`${amount} ${coin}`} />
                      <DetailRow label="Network fee" value={`${fee} ${coin}`} />
                      <DetailRow
                        label="Wallet"
                        value={withdrawalWallet}
                      />
                      <DetailRow
                        label="Date"
                        value={date}
                        valueClassName="font-sans tracking-wide"
                      />

                      <div className="flex items-center justify-center gap-1.5 pt-2 pb-2 text-[12px] text-[#848E9C]">
                        <svg
                          className="inline-block h-3.5 w-3.5 shrink-0 text-[#848E9C]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <circle cx="12" cy="11.5" r="2.5" />
                        </svg>
                        <span>Scam Report</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom safe area */}
                  <div className="mt-auto px-4 pb-8 pt-4">
                    <button
                      type="button"
                      className="mb-2 w-full rounded-lg bg-[#F1B90A] py-3.5 text-sm font-semibold text-[#181A20]"
                    >
                      Withdraw Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel */}
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
                <h2 className="mb-5 text-left text-lg font-semibold">Save Image</h2>
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
