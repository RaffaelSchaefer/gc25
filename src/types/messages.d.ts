type Messages = typeof import("../messages/de.json");

declare global {
  // Verwende type-safe Message-Schlüssel mit next-intl
  interface IntlMessages extends Messages {
    // Force interface to have content
    [key: string]: unknown;
  }
}

export {};
