import type { MetaFunction } from "@remix-run/node";
import { useParams } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Athletic Spots" },
    {
      name: "description",
      content:
        "Webpage for looking up spaces where you can play a sport or get some exercise done in a safe manner!",
    },
  ];
};

export default function Verifier() {
  const { userId } = useParams();

  return (
    <div>
      <div>This is the verifier page for user: {userId}!</div>
    </div>
  );
}
