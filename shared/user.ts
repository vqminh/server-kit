export interface PublicProfile {
  displayName: string;
  photoURL: string;
}

export interface Timed {
  created_at?: string;
  updated_at?: string;
}

export interface User extends Timed, PublicProfile {
  uid: string;
  email: string;
  phoneNumber?: string;
  admin?: boolean;
  owner?: boolean;
  sid: string;
  facebook_sender_psid?: string;
  zalo_uid?: string;
  stores?: string[];
}

export const USERS = "users";
export const nameOfFactory = <T>() => (name: keyof T) => name as string;
export const userDot = nameOfFactory<User>();