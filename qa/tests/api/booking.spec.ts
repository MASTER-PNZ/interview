import { test, expect } from '@playwright/test';
import {
  buildBookingPayload,
  createBooking,
  deleteBooking,
  getBooking,
  loginAsAdmin,
} from '../helpers/booking-api';

let createdBookingIds: number[] = [];

test.afterEach(async ({ request }) => {
  if (createdBookingIds.length === 0) return;

  const authCookie = await loginAsAdmin(request);
  for (const bookingId of createdBookingIds) {
    await deleteBooking(request, bookingId, authCookie);
  }
  createdBookingIds = [];
});

test('API: create, get, and delete booking', async ({ request, browserName }) => {
  // Deterministic browser-specific room/date mapping reduces shared-environment booking collisions.
  const roomid = browserName === 'firefox' ? 2 : 1;
  const dateOffset = browserName === 'firefox' ? 700 : 680;
  const payload = buildBookingPayload({ dateOffset, roomid });

  const created = await createBooking(request, payload);
  createdBookingIds.push(created.bookingid);

  const authCookie = await loginAsAdmin(request);
  const getResponse = await getBooking(request, created.bookingid, authCookie);
  expect(getResponse.status()).toBe(200);

  const fetched = await getResponse.json();
  expect(fetched.bookingid).toBe(created.bookingid);
  expect(fetched.firstname).toBe(payload.firstname);
  expect(fetched.lastname).toBe(payload.lastname);
  expect(fetched.bookingdates).toEqual(payload.bookingdates);

  const deleteResponse = await deleteBooking(request, created.bookingid, authCookie);
  expect(deleteResponse.status()).toBe(200);
  createdBookingIds = createdBookingIds.filter((id) => id !== created.bookingid);

  const getAfterDelete = await getBooking(request, created.bookingid, authCookie);
  expect(getAfterDelete.status()).toBe(404);
});
