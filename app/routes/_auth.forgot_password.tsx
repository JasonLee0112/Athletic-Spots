// app/routes/forgot-password.tsx
import {
  ActionFunction,
  ActionFunctionArgs,
  data,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import React, { ReactEventHandler, useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { generatePasswordResetToken } from "~/utils/server/auth.server";
import { sendPasswordResetEmail } from "~/utils/server/email.server";
import { connectToDatabase } from "~/utils/server/db.server";

type ActionData = {
  success: boolean;
  message: string;
};

export const meta: MetaFunction = () => {
  return [
    { title: "Forgot Password - Athletic Spots" },
    {
      name: "description",
      content: "Request a password reset link to recover your account",
    },
  ];
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");

  console.log(`${email}, ${typeof email}`);

  if (typeof email !== "string" || !email) {
    return data<ActionData>(
      {
        success: false,
        message: "Email is required",
      },
      { status: 400 }
    );
  }

  try {
    // await connectToDatabase();

    const resetToken = await generatePasswordResetToken(email);

    // If no user found with this email, we still return a success message
    // This is a security best practice to prevent email enumeration attacks
    if (!resetToken) {
      console.log("No email discovered!");
      return data<ActionData>({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Get base URL for reset link
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset_password`;

    // Send the reset email
    await sendPasswordResetEmail(email, resetToken, resetUrl);

    console.log("Email found!");
    return data<ActionData>({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return data<ActionData>(
      {
        success: false,
        message: "An error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
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

    console.log(`Email was submitted ${email}`);
    submit(formData, { method: "post" });
  };

  return (
    <>
      <Card.Header className="d-flex p-3 justify-content-center align-middle">
        <Card.Title>Forgot Your Password?</Card.Title>
      </Card.Header>
      <Card.Body
        className="d-flex flex-column px-5 w-100 h-100"
        style={{ paddingTop: 50 }}
      >
        {actionData && (
          <Alert
            variant={actionData.success ? "success" : "danger"}
            className="mb-4"
          >
            {actionData.message}
          </Alert>
        )}

        <p className="mb-4">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <Form method="POST" onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formGroupEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <div className="d-grid gap-2 mb-3">
            <Button className="lg" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </>
  );
}
