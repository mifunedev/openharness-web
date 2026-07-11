interface PostHogStub {
  capture(event: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string, properties?: Record<string, unknown>): void;
}

interface Window {
  posthog?: PostHogStub;
}
