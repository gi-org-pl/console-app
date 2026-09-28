import type { Page } from "@playwright/test";

export const MEDIA_ID = "d1b1e6c0-0000-4000-8000-000000000000";

export const SESSION = {
  email: "marketing@gi.org.pl",
  channels: [
    { id: "ig", name: "Fundacja GI", service: "instagram" },
    { id: "li", name: "Generacja Innowacja", service: "linkedin" },
  ],
};

/**
 * Stands in for console-publisher-worker, which the app calls cross-origin, so no
 * test depends on the real network. Returns the post bodies the page sent.
 */
export async function stubBufferWorker(
  page: Page,
  { isLoggedIn = false } = {},
) {
  const posts: Record<string, unknown>[] = [];
  let uploads = 0;

  await page.route("https://console.gi.org.pl/**", async (route) => {
    const request = route.request();
    const headers = {
      "access-control-allow-origin": new URL(page.url()).origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, POST",
    };
    const path = new URL(request.url()).pathname;
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers });
    }
    if (!isLoggedIn) {
      return route.fulfill({
        status: 401,
        json: { message: "Brak sesji." },
        headers,
      });
    }
    if (path === "/api/buffer/session") {
      return route.fulfill({ json: SESSION, headers });
    }
    if (path === "/api/buffer/media") {
      uploads++;
      return route.fulfill({ json: { mediaId: MEDIA_ID }, headers });
    }
    if (path === "/api/buffer/posts") {
      posts.push(request.postDataJSON());
      return route.fulfill({
        json: { postId: `post-${posts.length}` },
        headers,
      });
    }
    return route.fulfill({
      status: 404,
      json: { message: "Not found." },
      headers,
    });
  });

  return { posts, uploadCount: () => uploads };
}
