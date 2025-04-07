import { ActionFunctionArgs, data } from "@remix-run/node";
import { logoutAction } from "~/utils/server/session.server";

// Action handler for logout
export const action = async ({ request }: ActionFunctionArgs) => {
  return logoutAction(request);
};

// For direct GET requests (shouldn't happen in normal use)
export const loader = () => {
  throw new Response("Method not allowed", { status: 405 });
};
