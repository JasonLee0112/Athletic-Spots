// app/routes/reset-password.tsx
import {
  ActionFunction,
  ActionFunctionArgs,
  data,
  LoaderFunction,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { resetPassword } from "~/utils/server/auth.server";
import { connectToDatabase } from "~/utils/server/db.server";
import { UserModel } from "~/models/server/users.server";

type ActionData = {
  success: boolean;
  message: string;
};

type LoaderData = {
  isValidToken: boolean;
  error?: string;
};

export const meta: MetaFunction = () => {
  return [
    { title: "Reset Password - Athletic Spots" },
    {
      name: "description",
      content: "Reset your password to recover your account",
    },
  ];
};

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return data<LoaderData>({
      isValidToken: false,
      error: "Missing reset token",
    });
  }

  try {
    await connectToDatabase();

    // Check if the token exists and is not expired
    const user = await UserModel.findOne({
      "credentials.resetToken": token,
      "credentials.resetTokenExpiry": { $gt: new Date() },
    });

    if (!user) {
      return data<LoaderData>({
        isValidToken: false,
        error: "Invalid or expired reset token",
      });
    }

    return data<LoaderData>({ isValidToken: true });
  } catch (error) {
    console.error("Token validation error:", error);
    return data<LoaderData>({
      isValidToken: false,
      error: "An error occurred. Please try again later.",
    });
  }
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const password = formData.get("password");
  const token = formData.get("token");

  if (typeof password !== "string" || !password) {
    return data<ActionData>(
      {
        success: false,
        message: "Password is required",
      },
      { status: 400 }
    );
  }

  if (typeof token !== "string" || !token) {
    return data<ActionData>(
      {
        success: false,
        message: "Reset token is missing",
      },
      { status: 400 }
    );
  }

  try {
    const success = await resetPassword(token, password);

    if (!success) {
      console.log("Reset was not successful");
      return data<ActionData>(
        {
          success: false,
          message: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    console.log("Reset was successful");
    return redirect("/login?reset=success");
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

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();

  useEffect(() => {
    if (confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);

      submit(formData, { method: "post" });
    }
  };

  if (!loaderData.isValidToken) {
    return (
      <>
        <Card.Header className="d-flex p-3 justify-content-center align-middle">
          <Card.Title>Reset Password</Card.Title>
        </Card.Header>
        <Card.Body
          className="d-flex flex-column px-5 w-100 h-100"
          style={{ paddingTop: 50 }}
        >
          <Alert variant="danger" className="mb-4">
            {loaderData.error ||
              "Invalid or expired reset link. Please request a new password reset."}
          </Alert>
          <div className="d-grid gap-2 mb-3">
            <Button className="lg" href="/forgot_password">
              Request New Reset Link
            </Button>
          </div>
        </Card.Body>
      </>
    );
  }

  return (
    <>
      <Card.Header className="d-flex p-3 justify-content-center align-middle">
        <Card.Title>Reset Your Password</Card.Title>
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

        {!actionData?.success && (
          <Form method="post" onSubmit={handleSubmit}>
            <input type="hidden" name="token" value={token} />

            <Form.Group className="mb-4" controlId="formGroupPassword">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Form.Text className="text-muted">
                Password must be at least 8 characters long.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formGroupConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                isInvalid={!passwordsMatch}
              />
              {!passwordsMatch && (
                <Form.Control.Feedback type="invalid">
                  Passwords do not match.
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-grid gap-2 mb-3">
              <Button
                className="lg"
                type="submit"
                disabled={isSubmitting || !passwordsMatch || !password}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </Form>
        )}

        {actionData?.success && (
          <div className="d-grid gap-2 mb-3">
            <Button className="lg" href="/login">
              Go to Login
            </Button>
          </div>
        )}
      </Card.Body>
    </>
  );
}
