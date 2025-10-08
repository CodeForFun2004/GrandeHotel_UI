export type Gender = "male" | "female" | "other";

export interface User {
  _id?: string;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  avatar?: string;
  address?: string;
  gender?: Gender;
  birthday?: string; // yyyy-MM-dd
  country?: string;
  role?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpires?: string;
  googleId?: string;
  refreshToken?: string;
  storeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Legacy interface for backward compatibility
export interface Account {
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber?: string;
  Gender?: Gender;
  DOB?: string; // yyyy-MM-dd
  Address?: string;
  Country?: string;
  AvatarURL?: string;
}

export type Tab = "profile" | "change";

export interface PasswordState {
  cur: string;
  n: string;
  c: string;
}

export interface ShowPasswordState {
  cur: boolean;
  n: boolean;
  c: boolean;
}
