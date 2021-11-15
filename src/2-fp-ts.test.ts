import { createReservation, IHTTPResponse } from './2-fp-ts';

test('happy path', async () => {
  const result = await createReservation({
    body: {
      reservation: {
        date: new Date(),
        flightNumber: 'AB1234',
        seats: 2,
      },
    },
  });

  expect(result).toBe(IHTTPResponse.Created);
});

test('invalid request', async () => {
  const result = await createReservation({
    body: {
      reservation: {
        date: new Date().toString(),
        flightNumber: 'AB1234',
        seats: -1,
      },
    },
  });

  expect(result).toBe(IHTTPResponse.UnprocessableEntity);
});
