import type { Review } from "./review.types";

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ObjectLocation {
  type?: "Point";
  coordinates: number[]; // [longitude, latitude]
  address?: Address;
  googlePlaceId?: string;
}

export interface AccessInfo {
  isPublic?: boolean;
  isRestricted?: boolean;
  restrictionDetails?: string;
}

export interface DailyHours {
  open?: string;
  close?: string;
}

export interface RegularHours {
  monday?: DailyHours;
  tuesday?: DailyHours;
  wednesday?: DailyHours;
  thursday?: DailyHours;
  friday?: DailyHours;
  saturday?: DailyHours;
  sunday?: DailyHours;
}

export interface HolidayHours {
  date: Date;
  open?: string;
  close?: string;
  isClosed?: boolean;
}

export interface SpotHours {
  is24Hours?: boolean;
  regularHours?: RegularHours;
  holidayHours?: HolidayHours[];
}

export interface VerificationInfo {
  isVerified?: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
  verificationNotes?: string;
}

export interface RatingsSummary {
  average?: number;
  count?: number;
}

export interface ObjectMetadata {
  dateCreated?: Date;
  lastUpdated?: Date;
  lastUpdatedBy?: string;
}

export interface GeospatialObject {
  _id?: string;
  name: string;
  description: string;
  location: ObjectLocation;
  access?: AccessInfo;
  hours?: SpotHours;
  verification?: VerificationInfo;
  ratings?: RatingsSummary;
  reviews?: Review[];
  metadata?: ObjectMetadata;
}
