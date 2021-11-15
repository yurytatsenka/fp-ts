import { Reservations } from './db';

type IHTTPRequest<T extends string> = {
  body: Record<T, any>;
};
export enum IHTTPResponse {
  UnprocessableEntity = '422',
  Forbidden = '403',
  Created = '201'
}

type IReservationRequest = {
  date: Date;
  seats: number; // Could be a float?
  flightNumber: string; // Could be empty?
};

type IReservation = {
  id: string;
  date: Date;
  seats: number;
  flightNumber: string;
};

class ReservationManager {
  tryAccept(
    reservationRequest: IReservationRequest,
    capacity: number
  ): Promise<IReservation | undefined> {
    return Reservations.getReservedSeats(reservationRequest.flightNumber).then(
      (reservedSeats) => {
        if (reservedSeats + reservationRequest.seats > capacity) {
          return undefined;
        }
        return Reservations.create(reservationRequest);
      }
    );
  }
}
const reservationManager = new ReservationManager();

function validateReservationRequest(
  reservationRequest: any
): reservationRequest is IReservationRequest {
  if (reservationRequest == null || typeof reservationRequest !== 'object') {
    return false;
  }
  if (
    typeof reservationRequest === 'object' &&
    typeof reservationRequest.flightNumber !== 'string'
  ) {
    return false;
  }
  if (
    typeof reservationRequest.seats !== 'number' ||
    reservationRequest.seats <= 0
  ) {
    return false;
  }
  // and so on...
  return true;
}

export function createReservation(
  request: IHTTPRequest<'reservation'>
): Promise<IHTTPResponse> {
  const reservationRequest: JSON = request.body.reservation;

  if (!validateReservationRequest(reservationRequest)) {
    return Promise.resolve(IHTTPResponse.UnprocessableEntity);
  }
  return reservationManager
    .tryAccept(reservationRequest as IReservationRequest, 100)
    .then((reservation) => {
      if (reservation == null) {
        return IHTTPResponse.Forbidden;
      }

      return IHTTPResponse.Created;
    });
}
