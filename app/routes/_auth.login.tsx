import {
  ActionFunction,
  ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  Link,
  Form as RemixForm,
  useActionData,
  useSubmit,
} from "@remix-run/react";

import { User } from "~/models/types/user.types";

import { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Alert } from "react-bootstrap";

type ActionData = {
  success: boolean;
  message: string;
};

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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionData = useActionData<ActionData>();
  const submit = useSubmit();

  useEffect(() => {
    if (actionData) {
      setIsSubmitting(false);
    }
  }, [actionData]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    submit(formData, { method: "post" });
  };

  return (
    <>
      <Card.Header className="d-flex p-3 justify-content-center align-middle">
        <Card.Title>Enter your login information</Card.Title>
      </Card.Header>
      <Card.Body
        className="d-flex flex-column px-5 w-100 h-100"
        style={{ paddingTop: 50 }}
      >
        {/* Show success or error message if we have actionData */}
        {actionData && (
          <Alert
            variant={actionData.success ? "success" : "danger"}
            className="mb-4"
          >
            {actionData.message}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formGroupEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            ></Form.Control>
          </Form.Group>
          <div className="d-grid gap-2 mb-3">
            <Button className="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
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

import { data } from "@remix-run/react";
import { connectToDatabase } from "~/utils/server/db.server";
import { authenticateUser } from "~/utils/server/auth.server";
import { createUserSession } from "~/utils/server/session.server";

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  const ipAddress =
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("CF-Connecting-IP") ||
    "Unknown";

  if (typeof email !== "string" || typeof password !== "string") {
    return data<ActionData>(
      {
        success: false,
        message: `Invalid Form Submission`,
      },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return data<ActionData>(
      {
        success: false,
        message: "Email and password are required!",
      },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const user = await authenticateUser(email, password, ipAddress as string);

    if (!user) {
      return data<ActionData>(
        { success: false, message: "Invalid email or password!" },
        { status: 401 }
      );
    }

    // return data<ActionData>({
    //   success: true,
    //   message: `Login successful! Found user with email: ${email}`,
    // });
    return createUserSession(user._id.toString(), redirectTo);
  } catch (error) {
    console.error("Login error: ", error);
    return data<ActionData>(
      {
        success: false,
        message: `Database error: ${error.message}`,
      },
      { status: 500 }
    );
  }
};
