"use client";

import "@/app/globals.css";
import { Lexend, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ViewModeProvider } from "@/app/context/ViewModeContext";
import { ProjectsViewProvider } from "@/app/context/ProjectsViewContext";
import { CalendarViewProvider } from "@/app/context/CalendarViewContext";
import { DocumentsViewProvider } from "@/app/context/DocumentsViewContext";

const lexend = Lexend({ subsets: ["latin"] });
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${lexend.className} ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <ViewModeProvider>
            <ProjectsViewProvider>
              <CalendarViewProvider>
                <DocumentsViewProvider>
                  <ErrorBoundary>
                    <div className="min-h-screen bg-background text-foreground">
                      {children}
                    </div>
                  </ErrorBoundary>
                </DocumentsViewProvider>
              </CalendarViewProvider>
            </ProjectsViewProvider>
          </ViewModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 