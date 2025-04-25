import {
  ActionFunction,
  ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link, useActionData, useSubmit } from "@remix-run/react";
import { useSearchParams } from "@remix-run/react";
import { useState, useEffect, ChangeEvent } from "react";
import { Alert, FloatingLabel, Card, Form, Button } from "react-bootstrap";
import { data } from "@remix-run/react";
import { connectToDatabase } from "~/utils/server/db.server";
import { authenticateUser } from "~/utils/server/auth.server";
import { createUserSession } from "~/utils/server/session.server";

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

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  const sessionExtend = formData.get("sessionExtend") === "true";
  console.log(formData.get("sessionExtend"));

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
    return createUserSession(user._id.toString(), redirectTo, sessionExtend);
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const [extendedSession, setExtendedSession] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  const actionData = useActionData<ActionData>();
  const submit = useSubmit();

  useEffect(() => {
    if (actionData) {
      setIsSubmitting(false);
    }
  }, [actionData]);

  const handleSessionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExtendedSession(event.target.checked);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("sessionExtend", JSON.stringify(extendedSession));

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
        {resetSuccess && (
          <Alert variant="success">
            Your password has been reset successfully. You can now log in with
            your new password.
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formGroupEmail">
            <FloatingLabel label="Email Address">
              <Form.Control
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              ></Form.Control>
            </FloatingLabel>
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupPassword">
            <FloatingLabel label="Password">
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              ></Form.Control>
            </FloatingLabel>
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupExtendedSession">
            <Form.Check
              type="checkbox"
              label="Remember me on this device"
              onChange={handleSessionChange}
            ></Form.Check>
          </Form.Group>
          <div className="d-grid gap-2 mb-3">
            <Button className="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
          <div className="mb-2">
            <Link to="/forgot_password" className="underlined">
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
