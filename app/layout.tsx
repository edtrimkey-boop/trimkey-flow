import type { Metadata } from "next";
import { Montserrat, Overpass } from "next/font/google";
import "./globals.css";

// Configure core brand fonts
const montserrat = Montserrat({ 
  subsets: ["latin"], 
  variable: "--font-montserrat" 
});

const overpass = Overpass({ 
  subsets: ["latin"], 
  variable: "--font-overpass" 
});

export const metadata: Metadata = {
  title: "Trim Key Flow | Gateway Operations",
  description: "Advanced multi-gateway payment routing and management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${montserrat.variable} ${overpass.variable} font-overpass bg-background text-foreground antialiased min-h-screen selection:bg-primary/30`}
      >
        {/* Global blurred background element for depth */}
        <div className="fixed inset-0 -z-10 bg-dark-mesh bg-cover bg-center bg-no-repeat" />
        {children}
      </body>
    </html>
  );
}