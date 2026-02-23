import { test, expect } from '@playwright/test';
import { addDays, formatApiDate, formatUiDate } from '../helpers/date';
import { deleteBooking, loginAsAdmin } from '../helpers/booking-api';

let createdBookingIds: number[] = [];

test.afterEach(async ({ request }) => {
  if (createdBookingIds.length === 0) return;

  const authCookie = await loginAsAdmin(request);
  for (const bookingId of createdBookingIds) {
    await deleteBooking(request, bookingId, authCookie);
  }
  createdBookingIds = [];
});

const openReservation = async (page: import('@playwright/test').Page, dateOffset: number) => {
  const checkinDate = addDays(new Date(), dateOffset);
  const checkoutDate = addDays(new Date(), dateOffset + 2);

  await page.goto('/');
  const bookingSection = page.locator('#booking');
  await expect(bookingSection).toBeVisible();

  const dateInputs = bookingSection.locator('input.form-control');
  await dateInputs.nth(0).fill(formatUiDate(checkinDate));
  await dateInputs.nth(1).fill(formatUiDate(checkoutDate));
  await bookingSection.getByRole('button', { name: /check availability/i }).click();

  const firstAvailableRoom = page.locator('a[href*="/reservation/"]').first();
  await firstAvailableRoom.waitFor({ state: 'visible', timeout: 10_000 });
  await firstAvailableRoom.click();

  return { checkinDate, checkoutDate };
};

test('UI: booking happy path', async ({ page, browserName }) => {
  const dateOffset = browserName === 'firefox' ? 300 : 280;
  const { checkinDate, checkoutDate } = await openReservation(page, dateOffset);

  const reserveNowButton = page.getByRole('button', { name: /^Reserve Now$/i });
  await reserveNowButton.click();

  await page.locator('input[name="firstname"]').fill('Alicia');
  await page.locator('input[name="lastname"]').fill('Testerson');
  await page.locator('input[name="email"]').fill(`alicia.${Date.now()}@example.com`);
  await page.locator('input[name="phone"]').fill('01234567890');

  const bookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await reserveNowButton.click();
  const bookingResponse = await bookingResponsePromise;
  expect(bookingResponse.status()).toBe(201);

  const bookingBody = (await bookingResponse.json()) as { bookingid: number };
  createdBookingIds.push(bookingBody.bookingid);

  await expect(page.getByRole('heading', { name: /booking confirmed/i })).toBeVisible();
  await expect(page.getByText('Your booking has been confirmed for the following dates:')).toBeVisible();

  const confirmedRange = `${formatApiDate(checkinDate)} - ${formatApiDate(checkoutDate)}`;
  await expect(page.getByText(confirmedRange)).toBeVisible();
});

test('UI: validation error when guest names are too short', async ({ page, browserName }) => {
  const dateOffset = browserName === 'firefox' ? 220 : 200;
  await openReservation(page, dateOffset);

  const reserveNowButton = page.getByRole('button', { name: /^Reserve Now$/i });
  await reserveNowButton.click();

  await page.locator('input[name="firstname"]').fill('Al');
  await page.locator('input[name="lastname"]').fill('Te');
  await page.locator('input[name="email"]').fill('invalid.names@example.com');
  await page.locator('input[name="phone"]').fill('01234567890');

  const invalidBookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await reserveNowButton.click();
  const invalidBookingResponse = await invalidBookingResponsePromise;

  expect(invalidBookingResponse.status()).toBe(400);
  await expect(page.getByText('size must be between 3 and 18')).toBeVisible();
  await expect(page.getByText(/booking confirmed/i)).not.toBeVisible();
});

test('UI: prevents double-booking for the same room and date range', async ({ page, browserName }) => {
  const dateOffset = browserName === 'firefox' ? 260 : 240;
  await openReservation(page, dateOffset);

  const reservationUrl = page.url();
  const reserveNowButton = page.getByRole('button', { name: /^Reserve Now$/i });
  await reserveNowButton.click();

  await page.locator('input[name="firstname"]').fill('FirstBooker');
  await page.locator('input[name="lastname"]').fill('LastBooker');
  await page.locator('input[name="email"]').fill(`first.booker.${Date.now()}@example.com`);
  await page.locator('input[name="phone"]').fill('01234567890');

  const firstBookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await reserveNowButton.click();
  const firstBookingResponse = await firstBookingResponsePromise;
  expect(firstBookingResponse.status()).toBe(201);

  const firstBookingBody = (await firstBookingResponse.json()) as { bookingid: number };
  createdBookingIds.push(firstBookingBody.bookingid);
  await expect(page.getByRole('heading', { name: /booking confirmed/i })).toBeVisible();

  await page.goto(reservationUrl);

  const secondReserveNowButton = page.getByRole('button', { name: /^Reserve Now$/i });
  await secondReserveNowButton.click();
  await page.locator('input[name="firstname"]').fill('SecondBooker');
  await page.locator('input[name="lastname"]').fill('LastBooker');
  await page.locator('input[name="email"]').fill(`second.booker.${Date.now()}@example.com`);
  await page.locator('input[name="phone"]').fill('01234567890');

  const secondBookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await secondReserveNowButton.click();
  const secondBookingResponse = await secondBookingResponsePromise;
  expect(secondBookingResponse.status()).toBe(409);
  await expect(page.getByRole('heading', { name: /booking confirmed/i })).not.toBeVisible();
});
