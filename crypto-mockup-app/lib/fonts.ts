import localFont from "next/font/local";

export const sfProText = localFont({
  src: [
    { path: "../app/fonts/SFProText-Regular.otf", weight: "400", style: "normal" },
    { path: "../app/fonts/SFProText-Medium.otf", weight: "500", style: "normal" },
    { path: "../app/fonts/SFProText-Semibold.otf", weight: "600", style: "normal" },
    { path: "../app/fonts/SFProText-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-sf-pro",
  display: "swap",
});
