import type { Metadata } from "next";
import { ChakraUIProvider } from "@/presentation/providers/chakra-provider";
import { AuthProvider } from "@/presentation/providers/auth-context";
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
            <AppProvider>{children}</AppProvider>
          </AuthProvider>
        </ChakraUIProvider>
      </body>
    </html>
  );
}
