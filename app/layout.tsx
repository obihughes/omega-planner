"use client";

import "@/app/globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark" style={{ backgroundColor: '#0a0a0a' }} suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="color-scheme" content="dark" />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            background-color: #0a0a0a !important;
            color: #ffffff !important;
            color-scheme: dark !important;
            min-height: 100vh !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          * {
            box-sizing: border-box;
          }
          
          #__next, main, [class*=container]:not([class*=bg-]), [class*=wrapper]:not([class*=bg-]), [class*=content]:not([class*=bg-]), [class*=app]:not([class*=bg-]) {
            background-color: #0a0a0a !important;
            color: #ffffff !important;
          }
        `}} />
      </head>
      <body className={`${inter.className} dark`} style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Force dark mode
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.style.backgroundColor = '#0a0a0a';
              document.documentElement.style.color = '#ffffff';
              
              document.body.classList.add('dark');
              document.body.style.backgroundColor = '#0a0a0a';
              document.body.style.color = '#ffffff';
              
              // Apply dark theme to all containers
              const containers = document.querySelectorAll('#__next, #root, main, [class*=container]:not([class*=bg-]), [class*=wrapper]:not([class*=bg-]), [class*=content]:not([class*=bg-]), [class*=app]:not([class*=bg-])');
              containers.forEach(container => {
                if (container) {
                  container.style.backgroundColor = '#0a0a0a';
                  container.style.color = '#ffffff';
                }
              });
              
              // Remove any background images
              const allElements = document.querySelectorAll('*');
              allElements.forEach(el => {
                if (el.style && el.style.backgroundImage) {
                  el.style.backgroundImage = 'none';
                }
              });
              
              // Re-apply when DOM changes
              const observer = new MutationObserver((mutations) => {
                // Target elements within the body, and exclude script/style tags from getting data-dark-applied
                document.body.querySelectorAll('*:not([data-dark-applied]):not(script):not(style)').forEach(el => {
                  // Only apply background to body and html directly, other elements rely on CSS or specific class targeting
                  if (el.tagName === 'HTML' || el.tagName === 'BODY') {
                    el.style.backgroundColor = '#0a0a0a';
                  }
                  // Avoid setting backgroundColor directly on all other elements via this observer,
                  // as it's too broad. Rely on CSS for theming.
                  el.setAttribute('data-dark-applied', 'true');
                });
              });
              
              // Observe the body for changes
              if (document.body) { // Ensure body exists before observing
                observer.observe(document.body, { childList: true, subtree: true });
              }
            })();
          `
        }} />
      </body>
    </html>
  );
} 