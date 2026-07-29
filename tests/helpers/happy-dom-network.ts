import type { DetachedWindowAPI, IFetchInterceptor } from "happy-dom";

const PASSTHROUGH_ORIGIN = "http://localhost:3000";

const interceptor = {
  beforeAsyncRequest: async ({ request, window }) => {
    if (new URL(request.url).origin === PASSTHROUGH_ORIGIN) {
      return new window.Response(null, { status: 204 });
    }
    // Fail fast instead of a real DNS round-trip; suites must stub their own fetch.
    throw new TypeError(`fetch failed: blocked outbound request to ${request.url}`);
  },
} satisfies IFetchInterceptor;

if (typeof window !== "undefined") {
  const happyDOMWindow = window as unknown as Window & { happyDOM: DetachedWindowAPI };
  happyDOMWindow.happyDOM.settings.fetch.interceptor = interceptor;
}
