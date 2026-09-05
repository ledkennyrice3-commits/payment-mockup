"use client";

import { useRef, useState, type ReactNode } from "react";
import { toBlob, toPng } from "html-to-image";
import {
  ArrowLeftRight,
  Copy,
  Download,
  Eye,
  Home,
  LineChart,
  List,
  Plus,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { HomeIndicator } from "@/components/HomeIndicator";
import {
  IPhoneStatusBar,
  type CellularType,
} from "@/components/IPhoneStatusBar";
import { StatusBarPanel } from "@/components/StatusBarPanel";
import { type SignalLevel } from "@/components/status-icons";

type TokenId = "USDT" | "TRX" | "USDC";

type TokenState = {
  id: TokenId;
  name: string;
  amount: string;
  usdValue: string;
  color: string;
};

type AssetsTab = "Overview" | "Spot" | "Earn";

const inputClassName =
  "w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]";

const DEFAULT_TOKENS: TokenState[] = [
  {
    id: "USDT",
    name: "TetherUS",
    amount: "5.21",
    usdValue: "5.21",
    color: "#26A17B",
  },
  {
    id: "TRX",
    name: "TRON",
    amount: "2.40",
    usdValue: "0.68",
    color: "#FA0512",
  },
  {
    id: "USDC",
    name: "USD Coin",
    amount: "0.32",
    usdValue: "0.32",
    color: "#2775CA",
  },
];

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

function TokenBadge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {label.slice(0, 1)}
    </span>
  );
}

export default function BinanceAssetsPage() {
  const previewRef = useRef<HTMLDivElement>(null);

  const [totalValue, setTotalValue] = useState("6.21");
  const [pnlAmount, setPnlAmount] = useState("0.02");
  const [pnlPercent, setPnlPercent] = useState("0.32");
  const [tokens, setTokens] = useState<TokenState[]>(DEFAULT_TOKENS);
  const [activeTab, setActiveTab] = useState<AssetsTab>("Spot");

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

  const pnlPositive = (Number.parseFloat(pnlAmount) || 0) >= 0;
  const pnlColor = pnlPositive ? "#0ECB81" : "#F6465D";
  const pnlSign = pnlPositive ? "+" : "";

  function updateToken(
    id: TokenId,
    key: "amount" | "usdValue",
    value: string,
  ) {
    setTokens((prev) =>
      prev.map((token) =>
        token.id === id ? { ...token, [key]: value } : token,
      ),
    );
  }

  const exportOptions = {
    cacheBust: true,
    pixelRatio: 3,
    backgroundColor: "#181A20",
  } as const;

  async function exportPreview(action: "download" | "copy") {
    if (!previewRef.current) return;

    if (action === "download") {
      setExporting(true);
      try {
        const dataUrl = await toPng(previewRef.current, exportOptions);
        const link = document.createElement("a");
        link.download = `binance-assets-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } finally {
        setExporting(false);
      }
      return;
    }

    setCopying(true);
    try {
      const blob = await toBlob(previewRef.current, exportOptions);
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

  const tabs: AssetsTab[] = ["Overview", "Spot", "Earn"];
  const actions = [
    { label: "Add Funds", icon: Plus },
    { label: "Send", icon: Send },
    { label: "Transfer", icon: ArrowLeftRight },
    { label: "Earn", icon: Sparkles },
  ] as const;

  const bottomNav = [
    { label: "Home", icon: Home, active: false },
    { label: "Markets", icon: LineChart, active: false },
    { label: "Trade", icon: ArrowLeftRight, active: false },
    { label: "Futures", icon: LineChart, active: false },
    { label: "Assets", icon: Wallet, active: true },
  ] as const;

  return (
    <div className="min-h-screen bg-[#eef0f3] text-[#1f2328]">
      <AppHeader />

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* Left — Edit Assets */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">Edit Assets details</h2>
          <div className="space-y-4">
            <Field label="Est. Total Value (USD)">
              <input
                type="text"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className={inputClassName}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Today's PNL ($)">
                <input
                  type="text"
                  value={pnlAmount}
                  onChange={(e) => setPnlAmount(e.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="Today's PNL (%)">
                <input
                  type="text"
                  value={pnlPercent}
                  onChange={(e) => setPnlPercent(e.target.value)}
                  className={inputClassName}
                />
              </Field>
            </div>

            {tokens.map((token) => (
              <div
                key={token.id}
                className="space-y-3 rounded-xl border border-[#e5e7eb] p-3"
              >
                <p className="text-sm font-semibold text-[#1f2328]">
                  {token.id}
                </p>
                <Field label={`${token.id} Amount`}>
                  <input
                    type="text"
                    value={token.amount}
                    onChange={(e) =>
                      updateToken(token.id, "amount", e.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>
                <Field label={`${token.id} USD Value`}>
                  <input
                    type="text"
                    value={token.usdValue}
                    onChange={(e) =>
                      updateToken(token.id, "usdValue", e.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>
              </div>
            ))}
          </div>
        </section>

        {/* Center — phone preview */}
        <section className="flex w-full items-start justify-center px-2 py-2">
          <div className="relative mx-auto flex aspect-[9/19.5] w-full max-w-[430px] flex-col justify-between rounded-[50px] bg-[#111111] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="pointer-events-none absolute top-[22%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[32%] left-[-3px] h-12 w-[3px] rounded-l-sm bg-[#2a2a2e]" />
            <div className="pointer-events-none absolute top-[26%] right-[-3px] h-16 w-[3px] rounded-r-sm bg-[#2a2a2e]" />

            <div
              id="assets-preview"
              ref={previewRef}
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

              <div className="flex min-h-0 flex-1 flex-col">
                {/* Tabs */}
                <div className="flex items-end gap-5 px-5 pt-2">
                  {tabs.map((tab) => {
                    const active = tab === activeTab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`relative pb-2 text-[15px] transition-colors ${
                          active
                            ? "font-semibold text-[#EAECEF]"
                            : "font-medium text-[#848E9C]"
                        }`}
                      >
                        {tab}
                        {active ? (
                          <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#FCD535]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-4">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#848E9C]">
                    <span>Est. Total Value</span>
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#EAECEF]">
                    ${totalValue}{" "}
                    <span className="text-[16px] font-medium text-[#848E9C]">
                      USD
                    </span>
                  </p>
                  <p
                    className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium"
                    style={{
                      color: pnlColor,
                      backgroundColor: `${pnlColor}1A`,
                    }}
                  >
                    Today&apos;s PNL {pnlSign}
                    {pnlAmount} ({pnlSign}
                    {pnlPercent}%)
                  </p>

                  {/* Actions */}
                  <div className="mt-6 grid grid-cols-4 gap-2">
                    {actions.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-2"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2B313A] text-[#EAECEF]">
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <span className="text-center text-[11px] text-[#848E9C]">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Balance */}
                  <div className="mt-6 flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#EAECEF]">
                      Balance
                    </h3>
                    <List className="h-4 w-4 text-[#848E9C]" strokeWidth={1.75} />
                  </div>

                  <div className="mt-3 space-y-3">
                    {tokens.map((token) => (
                      <div
                        key={token.id}
                        className="rounded-2xl border border-[#2B313A] px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <TokenBadge color={token.color} label={token.id} />
                            <div className="min-w-0">
                              <p className="text-[14px] font-semibold text-[#EAECEF]">
                                {token.id}
                              </p>
                              <p className="text-[11px] text-[#848E9C]">
                                {token.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] font-semibold text-[#EAECEF]">
                              {token.amount}
                            </p>
                            <p className="text-[11px] text-[#848E9C]">
                              ${token.usdValue}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-[#2B313A] px-3 py-1.5 text-[12px] font-medium text-[#EAECEF]"
                          >
                            Earn
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-[#FCD535] px-3 py-1.5 text-[12px] font-semibold text-[#181A20]"
                          >
                            Trade
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="shrink-0 border-t border-[#2B313A] px-2 pb-5 pt-2">
                  <div className="grid grid-cols-5">
                    {bottomNav.map(({ label, icon: Icon, active }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1"
                      >
                        <Icon
                          className="h-5 w-5"
                          strokeWidth={1.75}
                          style={{
                            color: active ? "#F0B90B" : "#848E9C",
                          }}
                        />
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color: active ? "#F0B90B" : "#848E9C",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
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
                  onClick={() => exportPreview("download")}
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
                  onClick={() => exportPreview("copy")}
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
