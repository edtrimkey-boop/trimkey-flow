import type { Metadata } from "next";
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';
import { AudioInit } from '@/components/ui/AudioInit';
import { Montserrat, Overpass } from "next/font/google";
import "./globals.css";


// 1. Initialize custom fonts mapping to our CSS variables
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const overpass = Overpass({
  subsets: ["latin"],
  variable: "--font-overpass",
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: "Trim Key Flow | Enterprise Routing",
  description: "Advanced multi-gateway payment routing and management infrastructure.",
};

import { ToastProvider } from "@/components/ui/ToastProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. Force 'dark' mode at the HTML level
    <html lang="en" className="dark suppressHydrationWarning">
      <body
        className={`${montserrat.variable} ${overpass.variable} font-sans bg-background text-foreground antialiased min-h-screen selection:bg-primary/30`}
      >
        <AudioInit /><ConfirmProvider><ToastProvider>
        {/* 3. The universal fixed blurred mesh background */}
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(0, 251, 166, 0.08), transparent 35%), radial-gradient(circle at 85% 30%, rgba(40, 195, 229, 0.08), transparent 35%), radial-gradient(circle at 50% 0%, #1a1a24 0%, #0a0a0c 100%)',
            backgroundAttachment: 'fixed'
          }}
        />
        
        {/* TRUE LIQUID REFRACTION ENGINE */}
        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true" focusable="false">
          <filter id="liquid-refraction" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feImage href="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cdefs%3E%3CradialGradient id='rg' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='rgb(128,128,128)'/%3E%3Cstop offset='100%25' stop-color='rgb(200,200,200)'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='256' height='256' fill='url(%23rg)'/%3E%3C/svg%3E" result="LENS_MAP" preserveAspectRatio="none"/>
            <feDisplacementMap in="SourceGraphic" in2="LENS_MAP" scale="30" xChannelSelector="R" yChannelSelector="G" result="BENT_PIXELS"/>
            <feGaussianBlur in="BENT_PIXELS" stdDeviation="8" result="FROSTED"/>
            <feColorMatrix in="FROSTED" type="saturate" values="1.6" />
          </filter>
        </svg>


        {/* Hidden Apple Liquid Refraction SVG Filter */}
<svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
  <filter id="liquid-refraction">
    <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>



        {/* 4. Render main application views */}
        {children}
        </ToastProvider></ConfirmProvider>
      </body>
    </html>
  );
}




