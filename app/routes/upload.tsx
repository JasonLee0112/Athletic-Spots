import type { MetaFunction } from "@remix-run/node";

import { HeadNavigationBar } from "~/root";

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

export default function Upload() {
  return (
    <div>
      <div>This is the upload page!</div>
    </div>
  );
}
