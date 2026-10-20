// coding-standard: maintained
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import type { Translator } from "@/i18n/config";

import commonMessages from "@/messages/en/common.json";
import customersMessages from "@/messages/en/customers.json";
import authMessages from "@/messages/en/auth.json";
import dashboardMessages from "@/messages/en/dashboard.json";
import ecommerceMessages from "@/messages/en/ecommerce.json";
import onboardingMessages from "@/messages/en/onboarding.json";
import productsMessages from "@/messages/en/products.json";
import reportsMessages from "@/messages/en/reports.json";
import settingsMessages from "@/messages/en/settings.json";

/**
 * A real English translator for code that builds labels outside React (helpers that take a
 * `Translator`), bound to `namespace` — so a test asserts the copy a merchant reads.
 */
export const testTranslator = (namespace: "ecommerce") =>
  createTranslator({ locale: "en", messages: { ecommerce: ecommerceMessages }, namespace }) as never as Translator;

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
        customers: customersMessages,
        dashboard: dashboardMessages,
        ecommerce: ecommerceMessages,
        onboarding: onboardingMessages,
        products: productsMessages,
        // `reports.period` is the shared date-filter vocabulary, so this
        // namespace is not reports-only — `PeriodFilter`/`PeriodSelect` read it
        // on every screen that filters by date.
        reports: reportsMessages,
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
