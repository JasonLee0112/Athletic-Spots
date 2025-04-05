import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

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

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    },
  ];
}

let userLoggedIn = false;

// If logged in, display profile
// If not logged in, display log-in system
// Navbar contains Home page and logo, Links to an about section (which also has contact us), and a Dropdown (for future use)
// Navbar also includes a search bar
export function HeadNavigationBar() {
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
              <img src="userIcon.png" height="30" width="30"></img>
            </Navbar.Toggle>
            {/* This component will become an offcanvas on smaller screens */}
            <Navbar.Offcanvas id="navbar-nav" placement="end">
              <Offcanvas.Header closeButton>
                <Offcanvas.Title id="offcanvasNavbarLabel-expand-false">
                  UserID Placeholder
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Nav className="me-auto">
                  <Nav.Link href="#home">Profile</Nav.Link>
                  <Nav.Link href="#about">Settings</Nav.Link>
                  <NavDropdown
                    title="More"
                    id="offcanvasNavbarDropdown-expand-false"
                  >
                    <NavDropdown.Item href="#action3"></NavDropdown.Item>
                    <NavDropdown.Item href="#action4">
                      Another action
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#action5">
                      Something else here
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
  return (
    <html lang="en" className="bg-light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-light">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
