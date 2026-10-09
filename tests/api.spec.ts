import { test, expect } from "@playwright/test";

test("health endpoint has no cache", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ status: "ok", service: "formula-data" });
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("rejects unauthorized OpenF1 endpoint", async ({ request }) => {
  const response = await request.get("/api/openf1/unlisted");
  expect(response.status()).toBe(400);
});

test("rejects invalid telemetry interval", async ({ request }) => {
  const response = await request.get("/api/telemetry?session_key=1&driver_number=1");
  expect(response.status()).toBe(400);
});

test("rejects unknown OpenF1 query parameter", async ({ request }) => {
  const response = await request.get("/api/openf1/meetings?untrusted=1");
  expect(response.status()).toBe(400);
});
