import { test, expect } from '@playwright/test';
import { addDays, formatApiDate, formatUiDate } from '../helpers/date';
import { deleteBooking, loginAsAdmin } from '../helpers/booking-api';

let createdBookingIds: number[] = [];

const getReserveNowButton = (page: import('@playwright/test').Page) =>
  page.getByRole('button', { name: 'Reserve Now' });
const getOpenReservationButton = (page: import('@playwright/test').Page) =>
  page.locator('#doReservation');

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

  // Labels aren't programmatically associated with inputs (getByLabel fails), so we anchor on visible label text within #booking.
  await bookingSection.locator('div:has(> label:has-text("Check In")) input').fill(formatUiDate(checkinDate));
  await bookingSection.locator('div:has(> label:has-text("Check Out")) input').fill(formatUiDate(checkoutDate));
  await bookingSection.getByRole('button', { name: 'Check Availability' }).click();

  const firstAvailableRoom = page.locator('a[href*="/reservation/"]').first();
  await firstAvailableRoom.waitFor({ state: 'visible', timeout: 10_000 });
  await firstAvailableRoom.click();

  return { checkinDate, checkoutDate };
};

test('UI: booking happy path', async ({ page, browserName }) => {
  const dateOffset = browserName === 'firefox' ? 520 : 500;
  const { checkinDate, checkoutDate } = await openReservation(page, dateOffset);

  const openReservationButton = getOpenReservationButton(page);
  await openReservationButton.click();

  await page.locator('input[name="firstname"]').fill('John');
  await page.locator('input[name="lastname"]').fill('Coltrane');
  await page.locator('input[name="email"]').fill(`John.Coltrane${Date.now()}@example.com`);
  await page.locator('input[name="phone"]').fill('01234567890');
  const submitReservationButton = getReserveNowButton(page);

  const bookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await submitReservationButton.click();
  const bookingResponse = await bookingResponsePromise;
  const confirmedRange = `${formatApiDate(checkinDate)} - ${formatApiDate(checkoutDate)}`;
  expect(
    bookingResponse.status(),
    `Booking POST returned ${bookingResponse.status()} for ${confirmedRange} at ${page.url()}. Shared env collision likely; try bumping base date offset.`
  ).toBe(201);

  const bookingBody = (await bookingResponse.json()) as { bookingid: number };
  createdBookingIds.push(bookingBody.bookingid);

  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toBeVisible();
  await expect(page.getByText('Your booking has been confirmed for the following dates:')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return Home' })).toBeVisible();

  await expect(page.getByText(confirmedRange)).toBeVisible();
});

test('UI: validation error when guest names are too short', async ({ page, browserName }) => {
  const dateOffset = browserName === 'firefox' ? 560 : 540;
  await openReservation(page, dateOffset);

  const openReservationButton = getOpenReservationButton(page);
  await openReservationButton.click();

  await page.locator('input[name="firstname"]').fill('PK');
  await page.locator('input[name="lastname"]').fill('QA');
  await page.locator('input[name="email"]').fill('invalid.names@example.com');
  await page.locator('input[name="phone"]').fill('01234567890');
  const submitReservationButton = getReserveNowButton(page);

  const invalidBookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await submitReservationButton.click();
  const invalidBookingResponse = await invalidBookingResponsePromise;

  expect(invalidBookingResponse.status()).toBe(400);
  // Both first and last name have displayed validation errors, but we just check for one to keep the test simpler
  await expect(page.getByText('size must be between 3 and 18')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).not.toBeVisible();
});

test('UI: prevents double-booking for the same room and date range', async ({ page, browserName }) => {
  const dateOffset = browserName === 'firefox' ? 600 : 580;
  await openReservation(page, dateOffset);

  const reservationUrl = page.url();
  const firstOpenReservationButton = getOpenReservationButton(page);
  await firstOpenReservationButton.click();

  await page.locator('input[name="firstname"]').fill('John');
  await page.locator('input[name="lastname"]').fill('Coltrane');
  await page.locator('input[name="email"]').fill(`John.Coltrane${Date.now()}@example.com`);
  await page.locator('input[name="phone"]').fill('01234567890');
  const submitFirstReservationButton = getReserveNowButton(page);

  const firstBookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await submitFirstReservationButton.click();
  const firstBookingResponse = await firstBookingResponsePromise;
  expect(
    firstBookingResponse.status(),
    `First booking POST returned ${firstBookingResponse.status()} at ${reservationUrl}. Shared env collision likely; try bumping base date offset.`
  ).toBe(201);

  const firstBookingBody = (await firstBookingResponse.json()) as { bookingid: number };
  createdBookingIds.push(firstBookingBody.bookingid);
  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).toBeVisible();

  await page.goto(reservationUrl);

  const secondOpenReservationButton = getOpenReservationButton(page);
  await secondOpenReservationButton.click();
  await page.locator('input[name="firstname"]').fill('Charlie');
  await page.locator('input[name="lastname"]').fill('Parker');
  await page.locator('input[name="email"]').fill(`Charlie.Parker${Date.now()}@example.com`);
  await page.locator('input[name="phone"]').fill('01234567890');
  const submitSecondReservationButton = getReserveNowButton(page);

  // Attempt to book the same room and date range again to validate conflict prevention.
  const secondBookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/booking') && response.request().method() === 'POST',
    { timeout: 15_000 }
  );

  await submitSecondReservationButton.click();
  const secondBookingResponse = await secondBookingResponsePromise;
  expect(secondBookingResponse.status()).toBe(409);
  await expect(page.getByRole('heading', { name: 'Booking Confirmed' })).not.toBeVisible();
});
