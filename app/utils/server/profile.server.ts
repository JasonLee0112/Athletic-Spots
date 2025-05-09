import { UserModel } from "~/models/server/users.server";

export async function getUserProfileImage(userId: string) {
  const user = await UserModel.findById(userId);

  if (!user || !user.profileImage || !user.profileImage.image) {
    return null;
  }

  return {
    image: user.profileImage.image,
    contentType: user.profileImage.contentType || "",
  };
}
