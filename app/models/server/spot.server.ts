import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
  index,
  Ref,
} from "@typegoose/typegoose";
import type {
  GeospatialObject,
  ObjectLocation,
  AccessInfo,
  SpotHours,
  RegularHours,
  DailyHours,
  VerificationInfo,
  RatingsSummary,
  ObjectMetadata,
} from "../types/spot.types";
import { Review as ReviewType } from "../types/review.types";
import { User } from "./users.server";
import "../../utils/server/db.server";
import { connectToDatabase } from "../../utils/server/db.server";

// Review as a subdocument class
class Review implements ReviewType {
  @prop({ required: true, ref: () => User })
  public userId!: string;

  @prop({ required: true, min: 1, max: 5, type: Number })
  public rating!: number;

  @prop({ type: String })
  public reviewText?: string;

  @prop({ default: Date.now, type: Date })
  public datePosted?: Date;

  @prop({ default: 0, type: Number })
  public helpful?: number;

  @prop({ default: 0, type: Number })
  public notHelpful?: number;
}

// Classes for nested document structures
// class GeoPoint {
//   @prop({
//     type: String,
//     enum: ["Point"],
//     default: "Point",
//   })
//   public type?: string;

//   @prop({
//     type: [Number],
//     required: true,
//   })
//   public coordinates!: number[];
// }

class Address {
  @prop({ type: String })
  public street?: string;

  @prop({ type: String })
  public city?: string;

  @prop({ type: String })
  public state?: string;

  @prop({ type: String })
  public zipCode?: string;

  @prop({ type: String })
  public country?: string;
}

class Location implements ObjectLocation {
  @prop({
    type: String,
    enum: ["Point"],
    default: "Point",
  })
  public type?: "Point";

  @prop({ type: [Number], required: true })
  public coordinates!: number[];

  @prop({ type: () => Address })
  public address?: Address;

  @prop({ type: String })
  public googlePlaceId?: string;
}

class Access implements AccessInfo {
  @prop({ default: true, type: Boolean })
  public isPublic?: boolean;

  @prop({ default: false, type: Boolean })
  public isRestricted?: boolean;

  @prop({ type: String })
  public restrictionDetails?: string;
}

class DailyHour implements DailyHours {
  @prop({ type: String })
  public open?: string;

  @prop({ type: String })
  public close?: string;
}

class RegularHour implements RegularHours {
  @prop({ type: () => DailyHour })
  public monday?: DailyHour;

  @prop({ type: () => DailyHour })
  public tuesday?: DailyHour;

  @prop({ type: () => DailyHour })
  public wednesday?: DailyHour;

  @prop({ type: () => DailyHour })
  public thursday?: DailyHour;

  @prop({ type: () => DailyHour })
  public friday?: DailyHour;

  @prop({ type: () => DailyHour })
  public saturday?: DailyHour;

  @prop({ type: () => DailyHour })
  public sunday?: DailyHour;
}

class Hours implements SpotHours {
  @prop({ default: false, type: Boolean })
  public is24Hours?: boolean;

  @prop({ type: () => RegularHour })
  public regularHours?: RegularHour;
}

class Verification implements VerificationInfo {
  @prop({ default: false, type: Boolean })
  public isVerified?: boolean;

  @prop({ ref: () => User })
  public verifiedBy?: string;

  @prop({ type: Date })
  public verificationDate?: Date;

  @prop({ type: String })
  public verificationNotes?: string;
}

class Ratings implements RatingsSummary {
  @prop({ default: 0, type: Number })
  public average?: number;

  @prop({ default: 0, type: Number })
  public count?: number;
}

class Metadata implements ObjectMetadata {
  @prop({ default: Date.now, type: Date })
  public dateCreated?: Date;

  @prop({ type: Date })
  public lastUpdated?: Date;

  @prop({ ref: () => User })
  public lastUpdatedBy?: string;
}

// Main Object model with spatial index
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "spots",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index({ "location.coordinates": "2dsphere" })
export class LocationData implements GeospatialObject {
  @prop({ required: true, type: String })
  public name!: string;

  @prop({ required: true, type: String })
  public description!: string;

  @prop({
    required: true,
    type: () => Location,
  })
  public location!: Location;

  @prop({ type: () => Access })
  public access?: Access;

  @prop({ type: () => Hours })
  public hours?: Hours;

  @prop({ type: () => Verification })
  public verification?: Verification;

  @prop({ type: () => Ratings })
  public ratings?: Ratings;

  @prop({ type: () => [Review] })
  public reviews?: Review[];

  @prop({ type: () => Metadata })
  public metadata?: Metadata;
}

// Create and export the Mongoose model
export const ObjectModel = getModelForClass(LocationData);

// Server-side operations
export async function getObjectById(id: string) {
  return ObjectModel.findById(id);
}

export async function getObjectByCreatedUser(userId: string) {
  await connectToDatabase();
  const spots = ObjectModel.find({ "metadata.lastUpdatedBy": userId }).sort({
    "metadata.lastUpdated": -1,
  });
  return spots;
}

export async function getObjectsByLocation(
  lng: number,
  lat: number,
  maxDistance: number = 10000
) {
  return ObjectModel.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance,
      },
    },
  });
}

export async function createObject(objectData: LocationData) {
  return ObjectModel.create(objectData);
}

export async function addReviewToObject(
  objectId: string,
  reviewData: ReviewType
) {
  return ObjectModel.findByIdAndUpdate(
    objectId,
    {
      $push: { reviews: reviewData },
      $inc: { "ratings.count": 1 },
    },
    { new: true }
  ).then((object) => {
    // Update average rating
    if (object && object.reviews && object.reviews.length > 0) {
      const total = object.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const average = total / object.reviews.length;

      return ObjectModel.findByIdAndUpdate(
        objectId,
        { "ratings.average": average },
        { new: true }
      );
    }
    return object;
  });
}
