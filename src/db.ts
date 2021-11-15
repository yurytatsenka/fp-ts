
type IReservation = {
  id: string;
  date: Date;
  seats: number;
  flightNumber: string;
};
export const Reservations = {
  async getReservations(_flightNumber: string): Promise<IReservation[]> {
    return [
      {
        id: '1',
        date: new Date(),
        seats: 100,
        flightNumber: 'AB1234'
      }
    ];
  },
  async getReservedSeats(_flightNumber: string): Promise<number> {
    return 10;
  },

  async create(reservationRequest: any): Promise<IReservation> {
    return reservationRequest;
  }
};
export const Flights = {
  async get(
    flightNumber: string
  ): Promise<
    | {
        flightNumber: string;
        date: Date;
        plane: { capacity: number };
      }
    | undefined
  > {
    if (flightNumber === 'AB1234') {
      return {
        flightNumber: 'AB1234',
        date: new Date(),
        plane: { capacity: 200 }
      };
    }
    return undefined;
  }
};

