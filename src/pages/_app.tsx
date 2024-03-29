import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SessionProvider session={pageProps.session}>
        <NextUIProvider>
          <NextThemesProvider attribute="class" defaultTheme="light">
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex-grow">
                <Component {...pageProps} />
              </div>
              <Footer />
            </div>
          </NextThemesProvider>
        </NextUIProvider>
      </SessionProvider>
    </>
  );
}
