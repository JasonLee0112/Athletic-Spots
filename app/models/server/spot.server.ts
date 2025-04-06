import { prop, getModelForClass, modelOptions, Severity, index, Ref } from "@typegoose/typegoose";
import type { 
  GeospatialObject,
  ObjectLocation,
  AccessInfo,
  SpotHours,
  RegularHours,
  DailyHours,
  HolidayHours,
  VerificationInfo,
  RatingsSummary,
  ObjectMetadata
} from "../types/spot.types";
import { Review as ReviewType } from "../types/review.types";
import { User } from "./users.server";
import "../../../utils/server/db.server";

// Review as a subdocument class
class Review implements ReviewType {
  @prop({ required: true, ref: () => User })
  public userId!: string;

  @prop({ required: true, min: 1, max: 5 })
  public rating!: number;

  @prop()
  public reviewText?: string;

  @prop({ default: Date.now })
  public datePosted?: Date;

  @prop({ default: 0 })
  public helpful?: number;

  @prop({ default: 0 })
  public notHelpful?: number;
}

// Classes for nested document structures
class GeoPoint {
  @prop({ 
    type: String, 
    enum: ['Point'],
    default: 'Point'
  })
  public type?: string;

  @prop({ 
    type: [Number],
    required: true
  })
  public coordinates!: number[];
}

class Address {
  @prop()
  public street?: string;

  @prop()
  public city?: string;

  @prop()
  public state?: string;

  @prop()
  public zipCode?: string;

  @prop()
  public country?: string;
}

class Location implements ObjectLocation {
  @prop({
    type: () => GeoPoint,
    _id: false
  })
  public type?: "Point";

  @prop({ type: [Number], required: true })
  public coordinates!: number[];

  @prop({ type: () => Address })
  public address?: Address;

  @prop()
  public googlePlaceId?: string;
}

class Access implements AccessInfo {
  @prop({ default: true })
  public isPublic?: boolean;

  @prop({ default: false })
  public isRestricted?: boolean;

  @prop()
  public restrictionDetails?: string;
}

class DailyHour implements DailyHours {
  @prop()
  public open?: string;

  @prop()
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

class HolidayHour implements HolidayHours {
  @prop({ required: true })
  public date!: Date;

  @prop()
  public open?: string;

  @prop()
  public close?: string;

  @prop()
  public isClosed?: boolean;
}

class Hours implements SpotHours {
  @prop({ default: false })
  public is24Hours?: boolean;

  @prop({ type: () => RegularHour })
  public regularHours?: RegularHour;

  @prop({ type: () => [HolidayHour] })
  public holidayHours?: HolidayHour[];
}

class Verification implements VerificationInfo {
  @prop({ default: false })
  public isVerified?: boolean;

  @prop({ ref: () => User })
  public verifiedBy?: string;

  @prop()
  public verificationDate?: Date;

  @prop()
  public verificationNotes?: string;
}

class Ratings implements RatingsSummary {
  @prop({ default: 0 })
  public average?: number;

  @prop({ default: 0 })
  public count?: number;
}

class Metadata implements ObjectMetadata {
  @prop({ default: Date.now })
  public dateCreated?: Date;

  @prop()
  public lastUpdated?: Date;

  @prop({ ref: () => User })
  public lastUpdatedBy?: string;
}

// Main Object model with spatial index
@modelOptions({ 
  schemaOptions: { 
    timestamps: true,
    collection: 'objects'
  }, 
  options: { 
    allowMixed: Severity.ALLOW 
  } 
})
@index({ "location.coordinates": "2dsphere" })
export class LocationData implements GeospatialObject {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public description!: string;

  @prop({ 
    required: true,
    type: () => Location 
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

export async function getObjectsByLocation(lng: number, lat: number, maxDistance: number = 10000) {
  return ObjectModel.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  });
}

export async function createObject(objectData: LocationData) {
  return ObjectModel.create(objectData);
}

export async function addReviewToObject(objectId: string, reviewData: ReviewType) {
  return ObjectModel.findByIdAndUpdate(
    objectId,
    { 
      $push: { reviews: reviewData },
      $inc: { "ratings.count": 1 }
    },
    { new: true }
  ).then(object => {
    // Update average rating
    if (object && object.reviews && object.reviews.length > 0) {
      const total = object.reviews.reduce((sum, review) => sum + review.rating, 0);
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