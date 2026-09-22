export type RoomStatus = "available" | "maintenance";

export interface Room {
  id: number;
  name: string;
  description?: string | null;
  capacity: number;
  location: string;
  status: RoomStatus;
  image?: string | null;
}