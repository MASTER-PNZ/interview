import { APIRequestContext, expect } from '@playwright/test';
import { addDays, formatApiDate } from './date';

export type BookingPayload = {
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  email: string;
  phone: string;
};

export const loginAsAdmin = async (request: APIRequestContext): Promise<string> => {
  const authResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'password' },
  });

  expect(authResponse.status()).toBe(200);
  const authBody = await authResponse.json();
  return `token=${authBody.token as string}`;
};

export const buildBookingPayload = (options?: {
  roomid?: number;
  dateOffset?: number;
  stayLength?: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
}): BookingPayload => {
  const checkinDate = addDays(new Date(), options?.dateOffset ?? 120);
  const checkoutDate = addDays(new Date(), (options?.dateOffset ?? 120) + (options?.stayLength ?? 2));

  return {
    roomid: options?.roomid ?? 1,
    firstname: options?.firstname ?? 'PKQA',
    lastname: options?.lastname ?? 'QATest',
    depositpaid: false,
    bookingdates: {
      checkin: formatApiDate(checkinDate),
      checkout: formatApiDate(checkoutDate),
    },
    email: options?.email ?? `pk.${Date.now()}@example.com`,
    phone: options?.phone ?? '01234567890',
  };
};

export const createBooking = async (
  request: APIRequestContext,
  payload: BookingPayload
): Promise<{ bookingid: number; roomid: number }> => {
  const createResponse = await request.post('/api/booking', { data: payload });
  expect(
    createResponse.status(),
    `Booking POST returned ${createResponse.status()} for room ${payload.roomid} on ${payload.bookingdates.checkin} -> ${payload.bookingdates.checkout}. Shared env collision likely; try bumping base date offset.`
  ).toBe(201);
  return createResponse.json();
};

export const getBooking = async (
  request: APIRequestContext,
  bookingId: number,
  authCookie: string
) => {
  return request.get(`/api/booking/${bookingId}`, {
    headers: { Cookie: authCookie },
  });
};

export const deleteBooking = async (
  request: APIRequestContext,
  bookingId: number,
  authCookie: string
) => {
  return request.delete(`/api/booking/${bookingId}`, {
    headers: { Cookie: authCookie },
  });
};
