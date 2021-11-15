import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import * as ioTsTypes from 'io-ts-types';
import { Do } from 'fp-ts-contrib/lib/Do';
import { flow } from 'fp-ts/lib/function';
import { taskEither, TaskEither } from 'fp-ts/lib/TaskEither';

type IHTTPRequest<T extends string> = {
  body: Record<T, any>;
};

export enum IHTTPResponse {
  UnprocessableEntity = '422',
  Forbidden = '403',
  Created = '201',
  Ok = '200',
}

const ReservationRequest = t.type({
  date: ioTsTypes.date,
  seats: t.Int,
  flightNumber: ioTsTypes.NonEmptyString,
});
type ReservationRequest = t.TypeOf<typeof ReservationRequest>;

const Reservation = t.type({
  id: t.string,
  date: ioTsTypes.date,
  seats: t.Int,
  flightNumber: ioTsTypes.NonEmptyString,
});
type Reservation = t.TypeOf<typeof Reservation>;

const ReservationsFP = {
  getReservations(_flightNumber: string): TaskEither<Error, Reservation[]> {
    return TE.of([
      {
        id: '1',
        date: new Date(),
        seats: 100,
        flightNumber: 'AB1234',
      } as Reservation,
    ]);
  },
  getReservedSeats(_flightNumber: string): TaskEither<Error, number> {
    return TE.of(5);
  },
  create(
    reservationRequest: ReservationRequest,
  ): TaskEither<Error, Reservation> {
    return TE.of({ ...reservationRequest, id: '2' });
  },
};

const changeErrorType = <Right>(
  err: IHTTPResponse,
  data: TE.TaskEither<unknown, Right>,
) => TE.mapLeft(() => err)(data);

const validateReservationRequestTE = flow(
  ReservationRequest.decode,
  E.mapLeft(() => IHTTPResponse.UnprocessableEntity),
  TE.fromEither,
);

const promiseFromTE: <ReturnValue extends {}>(
  te: TaskEither<ReturnValue, ReturnValue>,
) => Promise<ReturnValue> = flow(
  TE.getOrElse((e) => T.of(e)),
  (promiseFactory) => promiseFactory(),
);

function tryAccept(
  reservationRequest: ReservationRequest,
  capacity: number,
): TaskEither<Error, Reservation> {
  return Do(taskEither)
    .bind(
      'reservedSeats',
      ReservationsFP.getReservedSeats(reservationRequest.flightNumber),
    )
    .bindL('reservationResult', ({ reservedSeats }) => {
      if (reservedSeats + reservationRequest.seats > capacity) {
        return TE.left(
          new Error('There was not enough capacity on this plane.'),
        );
      }
      return ReservationsFP.create(reservationRequest);
    })
    .return(({ reservationResult }) => reservationResult);
}

export function createReservation(
  request: IHTTPRequest<'reservation'>,
): Promise<IHTTPResponse> {
  return promiseFromTE(
    Do(taskEither)
      .bind(
        'reservationRequest',
        changeErrorType(
          IHTTPResponse.UnprocessableEntity,
          validateReservationRequestTE(request.body.reservation),
        ),
      )
      .bindL('reservation', ({ reservationRequest }) =>
        changeErrorType(
          IHTTPResponse.Forbidden,
          tryAccept(reservationRequest, 100),
        ),
      )
      .return(() => IHTTPResponse.Created),
  );
}
