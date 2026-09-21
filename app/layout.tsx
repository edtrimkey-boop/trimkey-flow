import type { Metadata } from "next";
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';
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
        <ConfirmProvider><ToastProvider>
        {/* 3. The universal fixed blurred mesh background */}
        <div 
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a24 0%, #0a0a0c 100%)',
            backgroundAttachment: 'fixed'
          }}
        />
        {/* 4. Render main application views */}
        {children}
        </ToastProvider></ConfirmProvider>
      </body>
    </html>
  );
}



