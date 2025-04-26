import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  data,
  useLocation,
  useSubmit,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";

import { LoaderFunctionArgs } from "@remix-run/node";
import { getLoggedInUser } from "./utils/server/session.server";

import {
  Form,
  InputGroup,
  ButtonGroup,
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Button,
  Offcanvas,
} from "react-bootstrap";

import "./tailwind.css";
import { User } from "./models/types/user.types";
import { useEffect } from "react";
import { logError } from "./models/server/error.model.server";
import { Alert } from "react-bootstrap";
import { getErrorType } from "./routes/api.log-error";
import { Search } from "react-bootstrap-icons";
import { connectToDatabase } from "~/utils/server/db.server";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    },
  ];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await connectToDatabase();

    console.log("Database connected, checking for user session");
    const user = await getLoggedInUser(request);
    console.log(
      "User session check result:",
      user ? "User found" : "No user found"
    );

    const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;
    return data({ user: serializedUser });
  } catch (error) {
    console.error("Error in root loader: ", error);

    await logError(error, request);

    return data({ user: null });
  }
};

// If logged in, display profile
// If not logged in, display log-in system
// Navbar contains Home page and logo, Links to an about section (which also has contact us), and a Dropdown (for future use)
// Navbar also includes a search bar
export function HeadNavigationBar({ user }: any) {
  const userLoggedIn = !!user;
  const submit = useSubmit();

  // console.log("HeadNavigationBar rendering with user:", user);
  // console.log("userLoggedIn value:", userLoggedIn);

  const handleLogout = (event: any) => {
    event.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
      submit(null, {
        method: "POST",
        action: "/logout",
      });
    }
  };

  return (
    <Navbar
      key="false"
      expand="false"
      className="bg-body-tertiary border-bottom"
    >
      <Container fluid>
        <Navbar.Brand href="/" className="d-flex me-3 align-items-center">
          <img
            alt=""
            src="/NavBarLogo.png"
            width="30"
            height="30"
            className="d-inline-block align-middle me-2"
          />
          <p className="d-inline-block align-middle">Athletic Spots</p>
        </Navbar.Brand>
        <Nav className="me-auto d-flex flex-row">
          <Nav.Link className="me-3" href="map">
            Maps
          </Nav.Link>
          <Nav.Link className="me-3" href="contact">
            Contact
          </Nav.Link>
          <Nav.Link className="me-3" href="about">
            About Us
          </Nav.Link>
          {userLoggedIn ? (
            <Nav.Link className="me-3" href="upload">
              Know a Spot?
            </Nav.Link>
          ) : null}
        </Nav>
        <Form className="me-3">
          <InputGroup className="search-container">
            <Form.Control
              placeholder="Search"
              className="no-border"
            ></Form.Control>
            <Button variant="light" type="button" href="search">
              <Search></Search>
            </Button>
          </InputGroup>
        </Form>
        {userLoggedIn ? (
          <>
            {/* This toggle button will control the offcanvas */}
            <Navbar.Toggle aria-controls="navbar-nav" className="me-3">
              <img
                src={
                  user.profileImage?.imageUrl || "/default-profile-image.jpg"
                }
                height="30"
                width="30"
                alt="Profile"
              ></img>
            </Navbar.Toggle>
            {/* This component will become an offcanvas on smaller screens */}
            <Navbar.Offcanvas id="navbar-nav" placement="end">
              <Offcanvas.Header closeButton>
                <Offcanvas.Title id="offcanvasNavbarLabel-expand-false">
                  {user.username || "User Profile"}
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Nav className="me-auto">
                  <Nav.Link
                    href={user?._id ? `/profile/${user._id}` : "#"}
                    onClick={(e) => {
                      if (!user?._id) {
                        e.preventDefault();
                        console.log("No user ID available for profile link");
                      }
                    }}
                  >
                    Profile
                  </Nav.Link>
                  <Nav.Link href="/settings">Settings</Nav.Link>
                  <NavDropdown
                    title="More"
                    id="offcanvasNavbarDropdown-expand-false"
                  >
                    <NavDropdown.Item href="#action3">...</NavDropdown.Item>
                    <NavDropdown.Item href="#action4">...</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </Nav>
              </Offcanvas.Body>
            </Navbar.Offcanvas>
          </>
        ) : (
          <ButtonGroup size="sm">
            <Button type="button" variant="outline-success" href="/login">
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline-dark"
              className="me-3"
              href="/register"
            >
              Register
            </Button>
          </ButtonGroup>
        )}
      </Container>
    </Navbar>
  );
}

export function LoginNavigator() {
  return (
    <Navbar key="false" expand="false" className="bg-body-tertiary">
      <Button type="button" variant="outline-danger" href="/" className="ms-2">
        Back
      </Button>
    </Navbar>
  );
}
export function ErrorBoundary() {
  const error: any = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  // Log client-side errors to console
  useEffect(() => {
    if (isRouteError) {
      if (error.status === 404) {
        console.log(`404 error:`);
      } else {
        console.error(`Route error ${error.status}: ${error.statusText}`);
      }
    } else {
      console.error("Client-side error:", error);

      if (!isRouteError) {
        // If we have access to the window object, we can log this to the server
        if (typeof window !== "undefined") {
          // Create a simple POST request to log the error
          const errorMessage = error.message || "Application error";
          const errorType = getErrorType(error);
          fetch("/api/log-error", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: errorMessage,
              stack: error.stack,
              type: errorType,
              url: window.location,
            }),
          }).catch((err) => {
            console.error("Failed to log error to server:", err);
          });
        }
      }
    }
  }, [error, isRouteError]);

  return (
    <html lang="en" className="bg-light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Error - Athletic Spots</title>
      </head>
      <body className="bg-light">
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>
              {isRouteError
                ? `${error.status} ${error.statusText}`
                : "An unexpected error occurred"}
            </Alert.Heading>
            <p>
              {isRouteError
                ? error.status === 404
                  ? "The page you're looking for doesn't exist."
                  : error.data
                : "Our team has been notified of this issue."}
            </p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button
                variant="outline-danger"
                onClick={() => (window.location.href = "/")}
              >
                Return Home
              </Button>
            </div>
          </Alert>
        </Container>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData<{ user: User }>();
  const location = useLocation();

  // console.log("App component loaded with user data:", user);

  const isAuthPage =
    location.pathname.includes("/login") ||
    location.pathname.includes("/register") ||
    location.pathname.includes("/forgot_password") ||
    location.pathname.includes("/reset_password");

  // useEffect(() => {
  //   console.log("App useEffect - user data:", user);
  // }, [user]);

  return (
    <html lang="en" className="bg-light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-light">
        {isAuthPage ? <LoginNavigator /> : <HeadNavigationBar user={user} />}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
