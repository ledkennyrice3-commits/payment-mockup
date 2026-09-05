"use client";

import type { CellularType } from "@/components/IPhoneStatusBar";
import type { SignalLevel } from "@/components/status-icons";

const selectClassName =
  "w-full rounded-lg border border-[#d7dbe0] px-3 py-2.5 text-sm outline-none focus:border-[#2563eb]";

const levelOptions = (
  <>
    <option value="none">Off</option>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="full">Good (full)</option>
  </>
);

export type StatusBarState = {
  clock: string;
  signal: SignalLevel;
  wifi: SignalLevel;
  cellular: SignalLevel;
  cellularType: CellularType;
  battery: number;
  charging: boolean;
  showBatteryPercent: boolean;
};

export function StatusBarPanel({
  clock,
  signal,
  wifi,
  cellular,
  cellularType = "4G",
  battery,
  charging,
  showBatteryPercent,
  onClockChange,
  onSignalChange,
  onWifiChange,
  onCellularChange,
  onCellularTypeChange,
  onBatteryChange,
  onChargingChange,
  onShowBatteryPercentChange,
}: {
  clock: string;
  signal: SignalLevel;
  wifi: SignalLevel;
  cellular: SignalLevel;
  cellularType?: CellularType;
  battery: number;
  charging: boolean;
  showBatteryPercent: boolean;
  onClockChange: (value: string) => void;
  onSignalChange: (value: SignalLevel) => void;
  onWifiChange: (value: SignalLevel) => void;
  onCellularChange: (value: SignalLevel) => void;
  onCellularTypeChange?: (value: CellularType) => void;
  onBatteryChange: (value: number) => void;
  onChargingChange: (value: boolean) => void;
  onShowBatteryPercentChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold">Status Bar</h2>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-[#5f6672]">Clock</span>
          <input
            value={clock}
            onChange={(e) => onClockChange(e.target.value)}
            className={selectClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-[#5f6672]">Signal</span>
          <select
            value={signal}
            onChange={(e) => onSignalChange(e.target.value as SignalLevel)}
            className={selectClassName}
          >
            {levelOptions}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-[#5f6672]">WIFI</span>
          <select
            value={wifi}
            onChange={(e) => onWifiChange(e.target.value as SignalLevel)}
            className={selectClassName}
          >
            {levelOptions}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-[#5f6672]">Cellular</span>
          <select
            value={cellular}
            onChange={(e) => onCellularChange(e.target.value as SignalLevel)}
            className={selectClassName}
          >
            {levelOptions}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-[#5f6672]">
            Network type
          </span>
          <select
            value={cellularType}
            disabled={wifi !== "none" || !onCellularTypeChange}
            onChange={(e) =>
              onCellularTypeChange?.(e.target.value as CellularType)
            }
            className={`${selectClassName} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <option value="4G">4G</option>
            <option value="5G">5G</option>
            <option value="LTE">LTE</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-sm text-[#5f6672]">
            <span>Battery</span>
            <span>{battery}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={battery}
            onChange={(e) => onBatteryChange(Number(e.target.value))}
            className="w-full accent-[#2563eb]"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-[#5f6672]">Show battery %</span>
          <button
            type="button"
            role="switch"
            aria-checked={showBatteryPercent}
            onClick={() => onShowBatteryPercentChange(!showBatteryPercent)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showBatteryPercent ? "bg-[#2563eb]" : "bg-[#d7dbe0]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showBatteryPercent ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-[#5f6672]">Charging</span>
          <button
            type="button"
            role="switch"
            aria-checked={charging}
            onClick={() => onChargingChange(!charging)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              charging ? "bg-[#2563eb]" : "bg-[#d7dbe0]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                charging ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
