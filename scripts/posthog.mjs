import { PostHog } from 'posthog-node';

export const BUILD_DISTINCT_ID = 'openharness-build-system';

export function createPostHogClient() {
  const key = process.env.POSTHOG_PROJECT_TOKEN;
  const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!key) return null;
  return new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}
