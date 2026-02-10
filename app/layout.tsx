import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { BottomNav } from "@/components/BottomNav";
import CopilotProvider from "@/components/copilot/CopilotProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GRIT - Tu Entrenador con IA",
  description: "App de seguimiento de gimnasio con IA para sobrecarga progresiva",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-20`} // Added padding-bottom for the nav
      >
        <CopilotProvider>
          {children}
          <BottomNav />
          <Toaster richColors />
        </CopilotProvider>
      </body>
    </html>
  );
}
