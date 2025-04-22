import "reflect-metadata";
import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
  index,
  Ref,
} from "@typegoose/typegoose";
import type {
  User as UserType,
  UserCredentials,
  UserProfile,
  UserAddress,
  UserProfileImage,
  UserPermissions,
  UserMeta,
  PermissionLevel,
  AccountStatus,
} from "../types/user.types";
import "../../../app/utils/server/db.server.ts";

// Use classes for each nested document to maintain type safety
class Credentials implements UserCredentials {
  @prop({ type: String })
  public passwordHash?: string;

  @prop({ type: Date })
  public lastChanged?: Date;

  @prop({ type: String })
  public resetToken?: string;

  @prop({ type: Date })
  public resetTokenExpiry?: Date;
}

class Address implements UserAddress {
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

class Profile implements UserProfile {
  @prop({ type: String })
  public firstName?: string;

  @prop({ type: String })
  public lastName?: string;

  @prop({ type: String })
  public bio?: string;

  @prop({ default: Date.now, type: Date })
  public joinDate?: Date;

  @prop({ type: String })
  public phoneNumber?: string;

  @prop({ type: () => Address })
  public address?: Address;
}

class ProfileImage implements UserProfileImage {
  @prop({ default: "default-profile-image.jpg", type: String })
  public imageUrl?: string;

  @prop({ type: Date })
  public lastUpdated?: Date;
}

class Permissions implements UserPermissions {
  @prop({
    type: String,
    enum: ["User", "VerifiedUser", "Administrator"],
    default: "User",
  })
  public level?: PermissionLevel;

  @prop({ type: [String] })
  public specialAccess?: string[];

  @prop({ type: Date })
  public lastPromoted?: Date;
}

class Meta implements UserMeta {
  @prop({ type: Date })
  public lastActive?: Date;

  @prop({
    type: String,
    enum: ["Active", "Suspended", "Deactivated"],
  })
  public accountStatus?: AccountStatus;

  @prop({ type: Date })
  public verificationDate?: Date;
}

// Main User model with compound indexes for unique username and email
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: "users",
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index({ username: 1 }, { unique: true })
@index({ email: 1 }, { unique: true })
export class User implements UserType {
  @prop({ required: true, type: String })
  public username!: string;

  @prop({ required: true, type: String })
  public email!: string;

  @prop({ type: () => Credentials })
  public credentials?: Credentials;

  @prop({ type: () => Profile })
  public profile?: Profile;

  @prop({ type: () => ProfileImage })
  public profileImage?: ProfileImage;

  @prop({ type: () => Permissions })
  public permissions?: Permissions;

  @prop({ type: () => Meta })
  public meta?: Meta;
}

// Create and export the Mongoose model
export const UserModel = getModelForClass(User);

// Server-side operations for user data
export async function getUserById(id: string) {
  await UserModel.findById(id);
}

export async function getUserByEmail(email: string) {
  return UserModel.findOne({ email });
}

export async function createUser(userData: UserType) {
  return UserModel.create(userData);
}

export async function updateUser(id: string, updates: Partial<UserType>) {
  return UserModel.findByIdAndUpdate(id, updates, { new: true });
}
