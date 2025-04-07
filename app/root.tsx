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
} from "@remix-run/react";

import { LoaderFunctionArgs } from "@remix-run/node";
import { getLoggedInUser } from "./utils/server/session.server";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import ButtonGroup from "react-bootstrap/ButtonGroup";

import "./tailwind.css";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";
import { User } from "./models/types/user.types";
import { useEffect } from "react";

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
    const { connectToDatabase } = await import("~/utils/server/db.server");
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

  console.log("HeadNavigationBar rendering with user:", user);
  console.log("userLoggedIn value:", userLoggedIn);

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
    <Navbar key="false" expand="false" className="bg-body-tertiary">
      <Container fluid>
        <Navbar.Brand href="/" className="me-3 align-center">
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
        </Nav>
        <Form className="me-3">
          <InputGroup className="search-container">
            <Form.Control
              placeholder="Search"
              className="no-border"
            ></Form.Control>
            <Button variant="outline-light" type="button" href="search">
              <img
                className="search-icon"
                src="searchIcon.svg"
                alt="search"
                width="20"
                height="20"
              ></img>
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
              "Sign In"
            </Button>
            <Button
              type="button"
              variant="outline-dark"
              className="me-3"
              href="/register"
            >
              "Register"
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

export default function App() {
  const { user } = useLoaderData<{ user: User }>();
  const location = useLocation();

  console.log("App component loaded with user data:", user);

  const isAuthPage =
    location.pathname.includes("/login") ||
    location.pathname.includes("/register") ||
    location.pathname.includes("/forgot_password");

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
