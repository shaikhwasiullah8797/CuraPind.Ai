import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import CursorGravity from "@/components/CursorGravity";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Indian Voter Companion AI",
  description: "Your multilingual AI guide to the Indian electoral process.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <div className="hero-bg">
            <div 
              className="hero-shape bg-saffron" 
              style={{ width: '400px', height: '400px', top: '-10%', left: '-5%' }}
            />
            <div 
              className="hero-shape bg-green" 
              style={{ width: '500px', height: '500px', bottom: '-20%', right: '-10%' }}
            />
          </div>
          <CursorGravity />
          <Navbar />
          <main style={{ position: 'relative', zIndex: 5 }}>
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
