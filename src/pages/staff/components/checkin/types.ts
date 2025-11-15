import type { IdType } from "./constants";

export interface IdDocument {
  type?: IdType;
  number: string;
  nameOnId: string;
  address?: string;
}

export interface RoomInfo {
  _id: string;
  roomNumber?: string;
  name?: string;
  status?: string;
}

