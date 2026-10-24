import { test, expect } from "@playwright/test";
test("Arabic home, controller focus and compatibility persist", async ({
  page
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#demo")).toBeVisible();
  await page.goto("/controller");
  await page.locator("#c1").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#c2")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#controller-result")).toContainText("تم اختيار");
  await page.goto("/compat");
  await page.locator("#probe").click();
  await expect(page.locator("#result")).toContainText("تم حفظ");
  expect(
    await page.evaluate(() => localStorage.getItem("deviceId"))
  ).toBeTruthy();
});
test("modal restores focus for 20 cycles; refresh preserves focused card", async ({
  page
}) => {
  await page.goto("/");
  const card = page.locator("#hero-open");
  await expect(card).toBeVisible();
  for (let i = 0; i < 20; i++) {
    await card.click();
    await expect(page.locator("#modal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(card).toBeFocused();
  }
  await page.locator("#today-demo-1").focus();
  await page.clock.install();
  await page.clock.fastForward(120001);
  await expect(page.locator("#today-demo-1")).toBeFocused();
});
test("works without fetch Promise Map Set or Gamepad", async ({ page }) => {
  await page.addInitScript(() => {
    for (const k of ["fetch", "Promise", "Map", "Set"])
      Object.defineProperty(window, k, {
        value: undefined,
        configurable: true
      });
    Object.defineProperty(navigator, "getGamepads", {
      value: undefined,
      configurable: true
    });
  });
  await page.goto("/");
  await expect(page.locator("#hero-open")).toBeVisible();
  await page.locator("#hero-open").click();
  await expect(page.locator("#modal")).toBeVisible();
});
test("generated HLS actually advances and verifies MSE", async ({ page }) => {
  const codecs = await page.evaluate(
    () =>
      !!window.MediaSource &&
      MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"') &&
      MediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')
  );
  test.skip(
    !codecs,
    "Installed Chromium lacks H264/AAC; requires codec-enabled browser or PS4."
  );
  await page.goto("/compat");
  await page.locator("#probe").click();
  await expect(page.locator("#result")).toContainText("تم حفظ");
  await page.locator("#test-mse").click();
  await expect(page.locator("#video-result")).toContainText("نجح التشغيل", {
    timeout: 20000
  });
});
test("unavailable codecs never mark device verified", async ({
  page,
  request
}) => {
  await page.goto("/compat");
  const supported = await page.evaluate(() =>
    MediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.2"')
  );
  test.skip(supported, "Codec failure test only for codec-limited runtime");
  await page.locator("#probe").click();
  await expect(page.locator("#result")).toContainText("تم حفظ");
  await page.locator("#test-mse").click();
  await expect(page.locator("#video-result")).toContainText("فشل", {
    timeout: 10000
  });
  const r = await request.get("/api/admin/diagnostics", {
    headers: {
      Authorization: "Bearer browser-test-only-abcdefghijklmnopqrstuvwxyz"
    }
  });
  const id = await page.evaluate(() => localStorage.getItem("deviceId"));
  expect(
    (await r.json()).devices.find((d: any) => d.id === id).verified.mse
  ).toBe(false);
});
test("TV layouts fit 1080p and 720p with bounded DOM", async ({ page }) => {
  for (const size of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 }
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(page.locator("#hero-open")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    expect(await page.locator("*").count()).toBeLessThan(500);
    if (size.width === 1920)
      await page.screenshot({ path: "data/tv-preview.png", fullPage: true });
  }
});
test("holding gamepad X selects once until released", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).testPad = {
      buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
    };
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [(window as any).testPad]
    });
  });
  await page.clock.install();
  await page.goto("/controller");
  await page.locator("#c1").focus();
  await page.evaluate(() => {
    (window as any).clicks = 0;
    document.getElementById("c1")!.addEventListener("click", () => {
      (window as any).clicks++;
    });
    (window as any).testPad.buttons[0].pressed = true;
  });
  await page.clock.fastForward(1100);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(1);
  await page.evaluate(
    () => ((window as any).testPad.buttons[0].pressed = false)
  );
  await page.clock.fastForward(300);
  await page.evaluate(
    () => ((window as any).testPad.buttons[0].pressed = true)
  );
  await page.clock.fastForward(300);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(2);
});
test("initial network failure shows actionable Arabic error", async ({
  page
}) => {
  await page.route("**/api/fixtures", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#empty")).toContainText("تأكد من اتصال الخادم");
});
