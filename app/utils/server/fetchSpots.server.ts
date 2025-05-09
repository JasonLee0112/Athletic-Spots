import {
  getObjectByCreatedUser,
  ObjectModel,
} from "~/models/server/spot.server";
import { connectToDatabase } from "./db.server";

export async function fetchCreatedSpots(userId: string) {
  // TODO: write this fetch function
  await connectToDatabase();

  console.log("Searching for User spots");
  const userSpots = await getObjectByCreatedUser(userId);

  if (!userSpots) {
    console.log("No spots found");
    return null;
  } else {
    console.log("returning spots");
    return userSpots;
  }
}

export async function fetchCreatedReviews(userId: string) {
  // TODO: Fetch created reviews
  await connectToDatabase();

  console.log("Searching for User reviews");
  const userSpots = await getObjectByCreatedUser(userId);

  if (!userSpots) {
    console.log("No reviews found");
    return null;
  } else {
    console.log("returning reviews");
    return userSpots;
  }
}

export async function fetchReports() {
  // TODO: fetch reported created spots and reviews via Report object
}

export async function fetchUsers() {
  // TODO: fetch all user objects
}
