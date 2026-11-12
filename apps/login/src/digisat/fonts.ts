import { Gabarito, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

// latin-ext carries the Turkish letters (ş ğ İ ı) that latin lacks.
const gabarito = Gabarito({
  weight: ["700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-gabarito",
});

const instrumentSans = Instrument_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ibm-plex-mono",
});

// Classes that define the font variables; src/digisat/theme.css maps them to --font-sans/-display/-mono.
export const fontVariables = `${gabarito.variable} ${instrumentSans.variable} ${ibmPlexMono.variable}`;
