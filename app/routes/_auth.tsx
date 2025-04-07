import type { MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { LoginNavigator } from "~/root";

import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import CardGroup from "react-bootstrap/CardGroup";

import { Map } from "react-bootstrap-icons";

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

export default function Auth() {
  return (
    <>
      <Container
        fluid
        className="d-flex justify-content-center align-items-center lg px-5 pb-5"
        style={{ height: "90vh" }}
      >
        <CardGroup className="w-100 h-100">
          <Card className="bg-light w-100 align-items-center justify-content-center">
            <h1 style={{ fontSize: "250%" }}>
              <b> Welcome! </b>
            </h1>
            <Map style={{ width: "50%", height: "50%" }}></Map>
          </Card>
          <Card className="bg-body-tertiary text-black w-100">
            <Outlet />
          </Card>
        </CardGroup>
      </Container>
    </>
  );
}
