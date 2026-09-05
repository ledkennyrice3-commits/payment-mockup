import fs from "fs";

// Measured from reference PNG (413×368), centered in 413×413 canvas
const CX = 206.5;
const CY = 313.5; // tip: measured y=291 + 22.5 vertical offset
const A1 = 225.1;
const A2 = 315.3;
const R_WEDGE = 52.5;
const GAP = 24;
const BANDS = [
  [78.5, 106.5], // inner arc — radial thickness 28
  [130.5, 158.5], // middle arc — thickness 28
  [182.5, 210.5], // outer arc — thickness 28
];

const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))];
const f = (n) => (+n).toFixed(2);

function wedge(ro) {
  const [lx, ly] = pt(ro, A1);
  const [rx, ry] = pt(ro, A2);
  return `M${f(CX)} ${f(CY)} L${f(lx)} ${f(ly)} A${ro} ${ro} 0 0 1 ${f(rx)} ${f(ry)} Z`;
}

function band(ri, ro) {
  const [lox, loy] = pt(ro, A1);
  const [rox, roy] = pt(ro, A2);
  const [rix, riy] = pt(ri, A2);
  const [lix, liy] = pt(ri, A1);
  return `M${f(lox)} ${f(loy)} A${ro} ${ro} 0 0 1 ${f(rox)} ${f(roy)} L${f(rix)} ${f(riy)} A${ri} ${ri} 0 0 0 ${f(lix)} ${f(liy)} Z`;
}

const paths = [wedge(R_WEDGE), ...BANDS.map(([ri, ro]) => band(ri, ro))];

const svg413 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="413" height="413" viewBox="0 0 413 413" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Vertex: (${CX}, ${CY}) | Fan: ${A1}°–${A2}° (~90.2°) | Gap: ${GAP}px -->
  <!-- Wedge outer radius: ${R_WEDGE} -->
  <!-- Arc1: ${BANDS[0][0]}–${BANDS[0][1]} | Arc2: ${BANDS[1][0]}–${BANDS[1][1]} | Arc3: ${BANDS[2][0]}–${BANDS[2][1]} -->
${paths.map((d) => `  <path d="${d}" fill="#000000" />`).join("\n")}
</svg>
`;

fs.writeFileSync("public/wifi-icon-413.svg", svg413);

// Status-bar scale (20×16 display, 5:4 aspect)
const scale = 20 / 413;
const cx = CX * scale;
const cy = CY * scale;
const ptS = (r, a) => [cx + r * scale * Math.cos(rad(a)), cy + r * scale * Math.sin(rad(a))];
const f3 = (n) => (+n).toFixed(3);

function wedgeS(ro) {
  const [lx, ly] = ptS(ro, A1);
  const [rx, ry] = ptS(ro, A2);
  const rs = ro * scale;
  return `M${f3(cx)} ${f3(cy)} L${f3(lx)} ${f3(ly)} A${f3(rs)} ${f3(rs)} 0 0 1 ${f3(rx)} ${f3(ry)} Z`;
}

function bandS(ri, ro) {
  const [lox, loy] = ptS(ro, A1);
  const [rox, roy] = ptS(ro, A2);
  const [rix, riy] = ptS(ri, A2);
  const [lix, liy] = ptS(ri, A1);
  const ros = ro * scale;
  const ris = ri * scale;
  return `M${f3(lox)} ${f3(loy)} A${f3(ros)} ${f3(ros)} 0 0 1 ${f3(rox)} ${f3(roy)} L${f3(rix)} ${f3(riy)} A${f3(ris)} ${f3(ris)} 0 0 0 ${f3(lix)} ${f3(liy)} Z`;
}

const smallPaths = [
  wedgeS(R_WEDGE),
  ...BANDS.map(([ri, ro]) => bandS(ri, ro)),
];

console.log(JSON.stringify(smallPaths, null, 2));
