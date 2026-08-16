// coding-standard: maintained
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import commonMessages from "@/messages/en/common.json";
import authMessages from "@/messages/en/auth.json";
import dashboardMessages from "@/messages/en/dashboard.json";
import onboardingMessages from "@/messages/en/onboarding.json";
import settingsMessages from "@/messages/en/settings.json";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
  client?: QueryClient;
}

export function TestProviders({ children, client }: WrapperProps) {
  const qc = client ?? createTestQueryClient();
  return (
    // Tests always run in English so getByText("...") assertions stay stable
    // (docs/I18N.md). Add namespaces here as tests need them.
    <NextIntlClientProvider
      locale="en"
      messages={{
        common: commonMessages,
        auth: authMessages,
        dashboard: dashboardMessages,
        onboarding: onboardingMessages,
        settings: settingsMessages,
      }}
    >
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { client?: QueryClient },
) {
  const { client, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders client={client}>{children}</TestProviders>
    ),
    ...rest,
  });
}

export * from "@testing-library/react";
