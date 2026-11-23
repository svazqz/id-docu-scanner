import { expect, test } from '@playwright/test';

const openCvUrl = 'https://docs.opencv.org/3.4.0/opencv.js';

test('starts preview and runs analysis against a synthetic media stream', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: async () => document.createElement('canvas').captureStream(),
    });
  });
  await page.route(openCvUrl, route => route.fulfill({
    contentType: 'text/javascript',
    body: `
      window.cv = {
        Mat: class { delete() {} },
        MatVector: class { delete() {} size() { return 0 } },
        VideoCapture: class { read() { document.body.dataset.analyzed = 'true' } },
        cvtColor() {}, Canny() {}, findContours() {}
      };
    `,
  }));

  await page.goto('/');
  await expect(page.locator('video')).toBeVisible();
  expect(await page.locator('video').evaluate(video => video.srcObject instanceof MediaStream)).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-analyzed', 'true');
});

test('keeps the page usable when the camera or analysis script is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: async () => { throw new DOMException('Fixture camera denied', 'NotAllowedError'); },
    });
  });
  await page.route(openCvUrl, route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await expect(page.locator('video')).toBeVisible();
  expect(await page.locator('video').evaluate(video => video.srcObject)).toBeNull();
  expect(errors).toEqual([]);
});
