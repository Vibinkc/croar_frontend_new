import type { Metadata } from "next";
import "./globals.css";
import { hankenGrotesk, jetbrainsMono } from "@/components/ds/fonts";
import { AuthProvider } from "@/context/AuthContext";
// import AgentCopilot from "@/components/enterprise/AgentCopilot";

export const metadata: Metadata = {
  title: "Croar AI Portal",
  description: "",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons&display=block"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined&display=block"
          rel="stylesheet"
        />
      </head>
      <body className={`${hankenGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          {/* <AgentCopilot /> */}
        </AuthProvider>
      </body>
    </html>
  );
}

