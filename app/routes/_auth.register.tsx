import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";

import { useState, useEffect } from "react";
import { data, redirect } from "@remix-run/node";
import { Link, useActionData, useSubmit } from "@remix-run/react";

import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { EyeSlash, Eye } from "react-bootstrap-icons";
import InputGroup from "react-bootstrap/InputGroup";
import { connectToDatabase } from "~/utils/server/db.server";
import {
  checkIfUserExists,
  hashPassword,
  registerPlainUser,
} from "~/utils/server/auth.server";
import { Alert } from "react-bootstrap";

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

type ActionData = {
  success: boolean;
  message: string;
  errors?: {
    email?: string[];
    password?: string[];
    username?: string[];
    general?: string[];
  };
  fields?: {
    email?: string;
    username?: string;
  };
};

export default function Register() {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmEmailTouched, setConfirmEmailTouched] = useState(false);
  const [matchingEmail, setMatchingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [checkPassword, setCheckPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(false);
  const [checkPasswordTouched, setCheckPasswordTouched] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validation, setValidation] = useState({
    length: false,
    number: false,
    special: false,
    noSpace: false,
  });

  const [validEmail, setValidEmail] = useState(false);

  const actionData = useActionData<ActionData>();
  const submit = useSubmit();

  useEffect(() => {
    if (password || passwordTouched) {
      setValidation({
        length: password.length >= 8,
        number: /\d+/.test(password),
        special: /[!@#$%^&*'(),.?":{}|<>+=~-]+/.test(password),
        noSpace: /\s/.test(password),
      });
    }
  }, [password, passwordTouched]);

  useEffect(() => {
    if (actionData) {
      setIsSubmitting(false);
    }
  }, [actionData]);

  const getBulletColor = (isValid: boolean) => {
    if (!passwordTouched) return "black";
    return isValid ? "green" : "red";
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmEmail", confirmEmail);
    formData.append("confirmPassword", checkPassword);

    submit(formData, { method: "POST" });
  };

  return (
    <>
      <Card.Header className="d-flex p-3 justify-content-center align-middle">
        <Card.Title> Sign up with Email! </Card.Title>
      </Card.Header>
      <Card.Body
        className="d-flex flex-column px-5 w-100 h-100"
        style={{ paddingTop: 50 }}
      >
        {actionData && !actionData.success && (
          <Alert variant="danger" className="mb-4">
            {actionData.message}
            {actionData.errors?.general?.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formGroupEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (confirmEmail === email && confirmEmailTouched) {
                  setMatchingEmail(true);
                } else {
                  setMatchingEmail(false);
                }
                setValidEmail(/.+@.+\..+/.test(email));
              }}
              isInvalid={actionData?.errors?.email?.length ? true : false}
            ></Form.Control>
            <Form.Control.Feedback type="invalid">
              {actionData?.errors?.email?.join(", ")}
            </Form.Control.Feedback>
            {!validEmail && confirmEmailTouched && (
              <div style={{ color: "red" }}> Invalid Email! </div>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="formGroupEmailConfirm">
            <Form.Label>Re-enter your email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
              onChange={(check) => setConfirmEmail(check.target.value)}
              onBlur={() => {
                setConfirmEmailTouched(true);
                if (confirmEmail === email && confirmEmailTouched) {
                  setMatchingEmail(true);
                } else {
                  setMatchingEmail(false);
                }
              }}
            ></Form.Control>
            {!matchingEmail && confirmEmailTouched && (
              <div style={{ color: "red" }}> Emails do not match </div>
            )}
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupPassword">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(f) => {
                  setPassword(f.target.value);
                  if (checkPasswordTouched) {
                    if (f.target.value === checkPassword)
                      setConfirmPassword(true);
                    else setConfirmPassword(false);
                  }
                }}
                onBlur={() => setPasswordTouched(true)}
                isInvalid={actionData?.errors?.password?.length ? true : false}
              ></Form.Control>
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {actionData?.errors?.password?.join(", ")}
              </Form.Control.Feedback>
            </InputGroup>
            <div className="mt-3 ms-3">
              <ul className="list-disc">
                <li style={{ color: getBulletColor(validation.length) }}>
                  should be at least 8 characters
                </li>
                <li style={{ color: getBulletColor(validation.number) }}>
                  should include at least 1 number
                </li>
                <li style={{ color: getBulletColor(validation.special) }}>
                  at least one of the following special characters:{" "}
                  {`!@#$%^&*'(),.?":{}|<>+-=~`}
                </li>
                <li style={{ color: getBulletColor(!validation.noSpace) }}>
                  no spaces allowed!
                </li>
              </ul>
            </div>
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupPasswordConfirm">
            <Form.Label>Re-enter your password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={checkPassword}
                onChange={(g) => {
                  setCheckPassword(g.target.value);
                  if (checkPasswordTouched) {
                    if (g.target.value === password) setConfirmPassword(true);
                    else setConfirmPassword(false);
                  }
                }}
                onBlur={() => {
                  setCheckPasswordTouched(true);
                  if (checkPassword === password) setConfirmPassword(true);
                  else setConfirmPassword(false);
                }}
              ></Form.Control>
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </Button>
            </InputGroup>
            <div className="">
              {!confirmPassword && checkPasswordTouched && (
                <p style={{ color: "red" }}>Passwords do not match!</p>
              )}
            </div>
          </Form.Group>
          <div className="d-grid gap-2 mb-3">
            <Button
              className="lg"
              type="submit"
              disabled={
                validEmail &&
                matchingEmail &&
                validation.length &&
                validation.number &&
                validation.special &&
                validation.noSpace &&
                confirmPassword &&
                isSubmitting
              }
            >
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </Button>
          </div>
          <Link
            to="/login"
            className="d-flex underlined mt-4 justify-content-center"
          >
            <h1 style={{ fontSize: "120%" }}>
              Already have an account? Sign in here!
            </h1>
          </Link>
        </Form>
      </Card.Body>
    </>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const confirmEmail = formData.get("confirmEmail") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const errors: ActionData["errors"] = {
    email: [],
    password: [],
    general: [],
  };

  // Email validation
  if (!email || typeof email !== "string") {
    errors.email?.push("Email is required");
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email?.push("Invalid email format");
  }

  if (email !== confirmEmail) {
    errors.email?.push("Emails do not match");
  }

  // Username generation
  const username = email.split("@")[0];
  if (!username || typeof username !== "string") {
    errors.username?.push("Username is required");
  }

  // Password validation
  if (!password || typeof password !== "string") {
    errors.password?.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.password?.push("Password must be at least 8 characters");
    }
    if (!/\d/.test(password)) {
      errors.password?.push("Password must include at least 1 number");
    }
    if (!/[!@#$%^&*'(),.?":{}|<>+-=~]+/.test(password)) {
      errors.password?.push("Password must include one special character");
    }
    if (/\s/.test(password)) {
      errors.password?.push("Password cannot contain spaces");
    }
  }

  if (password !== confirmPassword) {
    errors.password?.push("Passwords do not match");
  }

  // Check if there are any errors
  if (
    errors.email?.length ||
    errors.password?.length ||
    errors.username?.length ||
    errors.general?.length
  ) {
    return data<ActionData>(
      {
        success: false,
        message: "Please correct the errors below",
        errors,
        fields: { email, username },
      },
      { status: 400 }
    );
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    // const existingUser = await UserModel.findOne({
    //   $or: [{ email }, { username }],
    // });
    const existingUser = await checkIfUserExists(email, username);

    if (existingUser) {
      return data<ActionData>(
        {
          success: false,
          message: "Registration failed",
          errors: {
            general: [
              existingUser.email === email
                ? "Email already in use"
                : "Username already taken",
            ],
          },
          fields: { email, username },
        },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create new user with credentials
    const newUser = await registerPlainUser(username, email, passwordHash);
    // Success, redirect to login page
    return redirect("/login?registered=true");
  } catch (error) {
    console.error("Registration error:", error);
    return data<ActionData>(
      {
        success: false,
        message: "Registration failed",
        errors: {
          general: [`Database error: ${error.message}`],
        },
        fields: { email, username },
      },
      { status: 500 }
    );
  }
};
