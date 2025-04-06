import bcrypt from 'bcryptjs';
import { UserModel } from "../../models/server/users.server";
import type { User } from '../../models/types/user.types';
import { connectToDatabase } from '~/utils/server/db.server';

/**
 * Hash a plain text password using bcrypt
 * 
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
    // Generate a salt and hash in one step (cost factor 12)
    return bcrypt.hash(password, 12);
}

/**
 * Verify if a provided password matches the stored hash
 * 
 * @param password - The plain text password to check
 * @param hashedPassword - The stored hashed password to compare against
 * @returns A promise that resolves to true if passwords match, false otherwise
 */
export async function verifyPassword(
    password: string, 
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Authenticate a user by email and password
 * 
 * @param email - User's email address
 * @param password - User's plain text password
 * @returns The user object if authentication succeeds, null otherwise
 */
export async function authenticateUser(email: string, password: string) {
    await connectToDatabase();
    // Find the user by email
    console.log("Searching for email");
    const user = await UserModel.findOne({ email });

    // Return null if no user found with that email
    if (!user || !user.credentials || !user.credentials.passwordHash) {
        console.log("No email found");
        return null;
    }

    console.log("Email found, verifying hash...")
    // Verify the password against the stored hash
    const isValid = await verifyPassword(password, user.credentials.passwordHash);

    // Return the user if password is valid, otherwise null
    isValid ? console.log("Hash verified!") : console.log("Hashes do not match!!!");
    return isValid ? user : null;
}

// /**
//  * Register a new user with hashed credentials
//  * 
//  * @param userData - User registration data 
//  * @returns The newly created user object
//  */
// export async function registerUser(userData: {
//   username: string;
//   email: string;
//   password: string;
//   firstName?: string;
//   lastName?: string;
// }): Promise<User> {
//   const { username, email, password, firstName, lastName } = userData;

//   // Check if user already exists
//   const existingUser = await UserModel.findOne({ 
//     $or: [{ email }, { username }] 
//   });

//   if (existingUser) {
//     throw new Error(
//       existingUser.email === email 
//         ? 'Email already in use' 
//         : 'Username already taken'
//     );
//   }

//   // Hash the password
//   const passwordHash = await hashPassword(password);

//   // Create new user with credentials
//   const newUser = await UserModel.create({
//     username,
//     email,
//     credentials: {
//       passwordHash,
//       lastChanged: new Date()
//     },
//     profile: {
//       firstName,
//       lastName,
//       joinDate: new Date()
//     },
//     permissions: {
//       level: 'User'
//     },
//     meta: {
//       accountStatus: 'Active'
//     }
//   });

//   return newUser;
// }

// /**
//  * Generate a password reset token and set expiry
//  * 
//  * @param email - Email of the user requesting password reset
//  * @returns The reset token if successful, null if user not found
//  */
// export async function generatePasswordResetToken(email: string) {
//   const user = await UserModel.findOne({ email });

//   if (!user) {
//     return null;
//   }

//   // Generate a random token
//   const crypto = require('crypto');
//   const resetToken = crypto.randomBytes(32).toString('hex');

//   // Set token expiry to 1 hour from now
//   const resetTokenExpiry = new Date(Date.now() + 3600000);

//   // Update user with reset token information
//   await UserModel.findByIdAndUpdate(user.id, {
//     'credentials.resetToken': resetToken,
//     'credentials.resetTokenExpiry': resetTokenExpiry
//   });

//   return resetToken;
// }

// /**
//  * Reset a user's password using a valid reset token
//  * 
//  * @param resetToken - The token provided to the user for password reset
//  * @param newPassword - The new password to set
//  * @returns True if password was reset successfully, false otherwise
//  */
// export async function resetPassword(resetToken: string, newPassword: string) {
//   // Find user with the given reset token and valid expiry
//   const user = await UserModel.findOne({
//     'credentials.resetToken': resetToken,
//     'credentials.resetTokenExpiry': { $gt: new Date() }
//   });

//   if (!user) {
//     return false;
//   }

//   // Hash the new password
//   const passwordHash = await hashPassword(newPassword);

//   // Update user with new password and clear reset token
//   await UserModel.findByIdAndUpdate(user.id, {
//     'credentials.passwordHash': passwordHash,
//     'credentials.resetToken': null,
//     'credentials.resetTokenExpiry': null,
//     'credentials.lastChanged': new Date()
//   });

//   return true;
// }