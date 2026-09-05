"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const isBinance =
    pathname === "/" ||
    pathname.startsWith("/withdraw") ||
    pathname.startsWith("/deposit") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/binance");
  const isOkx = pathname.startsWith("/okx");
  const isBybit = pathname.startsWith("/bybit");

  const [isBinanceOpen, setIsBinanceOpen] = useState(false);
  const [isOkxOpen, setIsOkxOpen] = useState(false);
  const [isBybitOpen, setIsBybitOpen] = useState(false);
  const binanceRef = useRef<HTMLDivElement>(null);
  const okxRef = useRef<HTMLDivElement>(null);
  const bybitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (binanceRef.current && !binanceRef.current.contains(target)) {
        setIsBinanceOpen(false);
      }
      if (okxRef.current && !okxRef.current.contains(target)) {
        setIsOkxOpen(false);
      }
      if (bybitRef.current && !bybitRef.current.contains(target)) {
        setIsBybitOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsBinanceOpen(false);
    setIsOkxOpen(false);
    setIsBybitOpen(false);
  }, [pathname]);

  const linkClass =
    "block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#2B313A]";

  return (
    <header className="border-b border-[#dde1e6] bg-white px-6 py-3">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            MD Mockup
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[#5f6672] md:flex">
            <button type="button">Trending</button>

            <div className="relative" ref={okxRef}>
              <button
                type="button"
                onClick={() => {
                  setIsOkxOpen((open) => !open);
                  setIsBinanceOpen(false);
                  setIsBybitOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-1 hover:text-[#F0B90B] ${
                  isOkx ? "font-medium text-[#1f2328]" : ""
                }`}
                aria-expanded={isOkxOpen}
                aria-haspopup="menu"
              >
                <span>OKX</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOkxOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                role="menu"
                className={`absolute top-full left-0 z-50 mt-2 w-52 origin-top overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-lg transition-all duration-150 dark:border-gray-700 dark:bg-[#1E2329] ${
                  isOkxOpen
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                <Link
                  href="/okx"
                  role="menuitem"
                  onClick={() => setIsOkxOpen(false)}
                  className={linkClass}
                >
                  OKX Withdrawal
                </Link>
                <Link
                  href="/okx/deposit"
                  role="menuitem"
                  onClick={() => setIsOkxOpen(false)}
                  className={linkClass}
                >
                  OKX Deposit
                </Link>
              </div>
            </div>

            <div className="relative" ref={binanceRef}>
              <button
                type="button"
                onClick={() => {
                  setIsBinanceOpen((open) => !open);
                  setIsOkxOpen(false);
                  setIsBybitOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-1 hover:text-[#F0B90B] ${
                  isBinance ? "font-medium text-[#1f2328]" : ""
                }`}
                aria-expanded={isBinanceOpen}
                aria-haspopup="menu"
              >
                <span>BINANCE</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isBinanceOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                role="menu"
                className={`absolute top-full left-0 z-50 mt-2 w-52 origin-top overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-lg transition-all duration-150 dark:border-gray-700 dark:bg-[#1E2329] ${
                  isBinanceOpen
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                <p className="px-4 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-[#848E9C] uppercase">
                  Withdrawal
                </p>
                <Link
                  href="/"
                  role="menuitem"
                  onClick={() => setIsBinanceOpen(false)}
                  className={linkClass}
                >
                  Withdraw (Crypto)
                </Link>

                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                <p className="px-4 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-[#848E9C] uppercase">
                  Deposit
                </p>
                <Link
                  href="/deposit"
                  role="menuitem"
                  onClick={() => setIsBinanceOpen(false)}
                  className={linkClass}
                >
                  Deposit (Crypto)
                </Link>

                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                <p className="px-4 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-[#848E9C] uppercase">
                  Assets
                </p>
                <Link
                  href="/assets"
                  role="menuitem"
                  onClick={() => setIsBinanceOpen(false)}
                  className={linkClass}
                >
                  Assets
                </Link>
              </div>
            </div>

            <div className="relative" ref={bybitRef}>
              <button
                type="button"
                onClick={() => {
                  setIsBybitOpen((open) => !open);
                  setIsBinanceOpen(false);
                  setIsOkxOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-1 hover:text-[#F0B90B] ${
                  isBybit ? "font-medium text-[#1f2328]" : ""
                }`}
                aria-expanded={isBybitOpen}
                aria-haspopup="menu"
              >
                <span>BYBIT</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isBybitOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                role="menu"
                className={`absolute top-full left-0 z-50 mt-2 w-52 origin-top overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-lg transition-all duration-150 dark:border-gray-700 dark:bg-[#1E2329] ${
                  isBybitOpen
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
              >
                <Link
                  href="/bybit/withdrawal"
                  role="menuitem"
                  onClick={() => setIsBybitOpen(false)}
                  className={linkClass}
                >
                  Withdrawal
                </Link>
                <Link
                  href="/bybit/deposit"
                  role="menuitem"
                  onClick={() => setIsBybitOpen(false)}
                  className={linkClass}
                >
                  Deposit
                </Link>
              </div>
            </div>

            <button type="button">History</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-medium text-[#8a6d00]">
            Expires 12h 35m
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
            TU
          </div>
        </div>
      </div>
    </header>
  );
}
