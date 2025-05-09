import { LoaderFunctionArgs } from "@remix-run/node";
import { connectToDatabase } from "~/utils/server/db.server";
import { getUserProfileImage } from "~/utils/server/profile.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { userId } = params;

  if (!userId) {
    console.log(`No User ID provided`);
    return new Response("User ID is required", { status: 400 });
  }

  try {
    await connectToDatabase();
    const imageData = await getUserProfileImage(userId);

    if (!imageData) {
      // Return default image or 404
      `No image found`;
      return new Response("Image not found", { status: 404 });
    }

    `Image found, ${imageData.contentType}`;
    return new Response(imageData.image, {
      headers: {
        "Content-Type": imageData.contentType,
        // "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving profile image:", error);
    return new Response("Error serving image", { status: 500 });
  }
};
