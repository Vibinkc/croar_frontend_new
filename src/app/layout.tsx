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

// Icon-font stylesheets, loaded non-render-blocking (see <head> below).
const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block";
const MATERIAL_ICONS_HREF =
  "https://fonts.googleapis.com/icon?family=Material+Icons&display=block";
const MATERIAL_ICONS_OUTLINED_HREF =
  "https://fonts.googleapis.com/icon?family=Material+Icons+Outlined&display=block";

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

        {/* Apply the saved light/dark theme before first paint (no flash of wrong theme). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('croar-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
          }}
        />

        {/* Start fetching the icon stylesheets early… */}
        <link rel="preload" as="style" href={MATERIAL_SYMBOLS_HREF} />
        <link rel="preload" as="style" href={MATERIAL_ICONS_HREF} />
        <link rel="preload" as="style" href={MATERIAL_ICONS_OUTLINED_HREF} />

        {/*
          …but DON'T block first paint on them. Loading them with media="print"
          keeps them non-render-blocking; the inline script flips each to
          media="all" once it has downloaded. This stops a slow/blocked Google
          Fonts CDN from stalling the whole page (icons just fill in a moment
          later instead of the page hanging). <noscript> keeps it working with
          JS disabled.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var h=[${JSON.stringify(MATERIAL_SYMBOLS_HREF)},${JSON.stringify(MATERIAL_ICONS_HREF)},${JSON.stringify(MATERIAL_ICONS_OUTLINED_HREF)}];for(var i=0;i<h.length;i++){(function(href){var l=document.createElement('link');l.rel='stylesheet';l.href=href;l.media='print';l.onload=function(){this.media='all'};document.head.appendChild(l);})(h[i]);}})();`,
          }}
        />
        <noscript>
          <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
          <link rel="stylesheet" href={MATERIAL_ICONS_HREF} />
          <link rel="stylesheet" href={MATERIAL_ICONS_OUTLINED_HREF} />
        </noscript>
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

