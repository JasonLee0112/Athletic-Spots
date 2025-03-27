import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

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

export default function Index() {
  return (
    <>
      <Card.Header className="d-flex p-3 justify-content-center align-middle">
        <Card.Title>Enter your login information</Card.Title>
      </Card.Header>
      <Card.Body
        className="d-flex flex-column px-5 w-100 h-100"
        style={{ paddingTop: 50 }}
      >
        <Form>
          <Form.Group className="mb-3" controlId="formGroupEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
            ></Form.Control>
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="password"></Form.Control>
          </Form.Group>
          <div className="d-grid gap-2 mb-3">
            <Button className="lg" type="submit">
              Sign In
            </Button>
          </div>
          <div className="mb-2">
            <Link to="/" className="underlined">
              Forgot password?
            </Link>
          </div>
        </Form>
        <Link
          to="/register"
          className="d-flex underlined mt-12 justify-content-center"
        >
          <h1 style={{ fontSize: "120%" }}>
            Don't Have an Account? Make one here!
          </h1>
        </Link>
      </Card.Body>
    </>
  );
}
