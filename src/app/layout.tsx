import type { Metadata } from "next";
import { ChakraUIProvider } from "@/presentation/providers/chakra-provider";
import { AuthProvider } from "@/presentation/providers/auth-context";
import { ReduxProvider } from "@/store/providers/redux-provider";
import { AppProvider } from "@/presentation/providers/app-context";

export const metadata: Metadata = {
  title: "Universal Dashboard - Baad Monitor",
  description: "Unified dashboard for flood monitoring, weather and disaster management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="chakra-ui-light" suppressHydrationWarning>
        <ChakraUIProvider>
          <AuthProvider>
            <ReduxProvider>
              <AppProvider>{children}</AppProvider>
            </ReduxProvider>
          </AuthProvider>
        </ChakraUIProvider>
      </body>
    </html>
  );
}
