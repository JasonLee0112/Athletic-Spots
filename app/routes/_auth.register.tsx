import type { MetaFunction } from "@remix-run/node";

import { Link } from "@remix-run/react";

import { useState, useEffect } from "react";

import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { EyeSlash, Eye } from "react-bootstrap-icons";
import InputGroup from "react-bootstrap/InputGroup";

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

export default function Register() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [checkPassword, setCheckPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(false);
  const [checkPasswordTouched, setCheckPasswordTouched] = useState(false);

  const [validation, setValidation] = useState({
    length: false,
    number: false,
    special: false,
    noSpace: false,
  });

  useEffect(() => {
    if (password || passwordTouched) {
      setValidation({
        length: password.length >= 8,
        number: /\d+/.test(password),
        special: /[!@#$%^&*'(),.?":{}|<>]+/.test(password),
        noSpace: /\s/.test(password),
      });
    }
  }, [password, passwordTouched]);

  const getBulletColor = (isValid: boolean) => {
    if (!passwordTouched) return "black";
    return isValid ? "green" : "red";
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
        <Form method="post">
          <Form.Group className="mb-3" controlId="formGroupEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
            ></Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formGroupEmailConfirm">
            <Form.Label>Re-enter your email</Form.Label>
            <Form.Control
              type="email"
              placeholder="you@example.com"
            ></Form.Control>
          </Form.Group>
          <Form.Group className="mb-4" controlId="formGroupPassword">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (checkPasswordTouched) {
                    if (e.target.value === checkPassword)
                      setConfirmPassword(true);
                    else setConfirmPassword(false);
                  }
                }}
                onBlur={() => setPasswordTouched(true)}
              ></Form.Control>
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </Button>
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
                  add a special character for additional security!
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
                onChange={(f) => {
                  setCheckPassword(f.target.value);
                  if (checkPasswordTouched) {
                    if (f.target.value === password) setConfirmPassword(true);
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
                <p style={{ color: "red" }}>"Make sure passwords match!"</p>
              )}
            </div>
          </Form.Group>
          <div className="d-grid gap-2 mb-3">
            <Button
              className="lg"
              type="submit"
              disabled={
                validation.length &&
                validation.number &&
                validation.special &&
                !validation.noSpace &&
                passwordTouched &&
                confirmPassword
                  ? false
                  : true
              }
            >
              Sign Up
            </Button>
          </div>
        </Form>
      </Card.Body>
    </>
  );
}
