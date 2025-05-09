export interface UserCredentials {
  passwordHash?: string;
  lastChanged?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  joinDate?: Date;
  phoneNumber?: string;
  address?: UserAddress;
}

export interface UserProfileImage {
  image?: Buffer;
  contentType?: string;
  lastUpdated?: Date;
}

export type PermissionLevel = "User" | "VerifiedUser" | "Administrator";

export interface UserPermissions {
  level?: PermissionLevel;
  specialAccess?: string[];
  lastPromoted?: Date;
}

export type AccountStatus = "Active" | "Suspended" | "Deactivated";

export interface UserMeta {
  lastActive?: Date;
  accountStatus?: AccountStatus;
  verificationDate?: Date;
}

export interface User {
  _id?: string;
  username: string;
  email: string;
  credentials?: UserCredentials;
  profile?: UserProfile;
  profileImage?: UserProfileImage;
  permissions?: UserPermissions;
  meta?: UserMeta;
}
