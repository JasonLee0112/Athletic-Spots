import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  data,
  useActionData,
  useLoaderData,
  useLocation,
  useSubmit,
} from "@remix-run/react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Tab,
  Tabs,
} from "react-bootstrap";
import { updateProfileImage, updateUser } from "~/models/server/users.server";
import { GeospatialObject } from "~/models/types/spot.types";
import { User } from "~/models/types/user.types";
import { connectToDatabase } from "~/utils/server/db.server";
import { fetchCreatedSpots } from "~/utils/server/fetchSpots.server";
import { getLoggedInUser } from "~/utils/server/session.server";

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

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

interface ActionData {
  success: boolean;
  message: string;
}

// TODO: Make Request to Backend for userId, username, profile picture, user memeber since date, settings, and user-created spots/reviews
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    console.log("Database connected, checking for user session");
    const user = await getLoggedInUser(request);
    console.log(
      "User profile check result:",
      user ? "User found" : "No user found"
    );

    const serializedUser = user ? JSON.parse(JSON.stringify(user)) : null;
    // const createdSpots = spots ? JSON.parse(JSON.stringify(spots)) : null;
    if (serializedUser) {
      const currentUser: User = JSON.parse(JSON.stringify(user));
      const spots = await fetchCreatedSpots(currentUser._id!);
      const serializedSpots = spots ? JSON.parse(JSON.stringify(spots)) : null;
      return data({
        user: serializedUser,
        spots: serializedSpots,
      });
    } else {
      return data({
        user: serializedUser,
        spots: null,
      });
    }
  } catch (error) {
    console.error("Error in root loader: ", error);
    return data({ user: null });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    await connectToDatabase();

    const MAX_FILE_SIZE = 2 * 1024 * 1024;

    const uploadHandler = unstable_createMemoryUploadHandler({
      maxPartSize: MAX_FILE_SIZE,
      filter(args) {
        return Boolean(
          args.contentType && args.contentType.startsWith("image")
        );
      },
    });

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler
    );

    console.log(formData);
    const file: any = formData.get("file");

    if (!file) {
      return Response.json(
        { success: false, message: "No file uploaded" },
        { status: 500 }
      );
    }
    const user = await getLoggedInUser(request);
    if (!user) {
      return Response.json({ success: false, message: "No user detected" });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(buffer.toJSON());
    console.log(`File Type: ${file.type}`);
    console.log(`File Name: ${file.name}`);
    console.log(`userId: ${user._id}`);
    await updateProfileImage(user._id.toString(), buffer, file.type);

    return Response.json({
      success: true,
      message: "Profile image updated successfully",
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return Response.json(
      { success: false, message: `Error uploading image: ${error.message}` },
      { status: 500 }
    );
  }
};

// TODO: Clean up Profile Page
// TODO: How do images?????
export default function Profile() {
  const { user, spots } = useLoaderData<{
    user: User;
    spots: GeospatialObject[];
  }>();
  const isMounted = useIsMounted();
  const location = useLocation();
  const { activeTab = "reviews" } = location.state || {};
  const submit = useSubmit();

  if (!user) {
    return (
      <Container fluid>
        <Row className="d-flex justify-content-center align-items-center p-5">
          <Col className="text-center">
            <h2>User not found or not logged in</h2>
            <Button href="/login" className="mt-3">
              Log In
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }

  // const userId = user._id;
  const username = user.username;
  const joinDate = user.profile?.joinDate || "";
  const accountStatuses = user.meta?.accountStatus || "";
  const [showProfilePopUp, setShowProfilePopUp] = useState(false);
  const [imageBuffer, setImageBuffer] = useState<File | null>(null);
  const actionData = useActionData<ActionData>();
  const [imageUpdated, setImageUpdated] = useState(false);

  console.log(`Action Data: ${JSON.stringify(actionData)}`);

  const profileImageUrl = user?._id
    ? `/api/profileImage/${user._id}?t=${new Date().getTime()}`
    : "/default-profile-image.jpg";

  console.log(`Profile pic route: ${profileImageUrl}`);

  const formattedDate = joinDate
    ? new Date(joinDate).toLocaleDateString()
    : "Unknown";

  const openProfilePopup = () => {
    console.log("opening Profile Picture Updater");
    setShowProfilePopUp(true);
  };
  const closeProfilePopup = () => {
    setShowProfilePopUp(false);
  };
  const handleImageBuffer = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large, make sure your file is less than 2MB!");
      } else {
        setImageBuffer(file);
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPG, PNG, and GIF files are allowed.");
        return;
      }

      // setImagePreview(URL.createObjectURL(file));
      // setImageBuffer(file);
    }
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (imageBuffer) {
      const formData = new FormData();
      formData.append("file", imageBuffer);

      try {
        submit(formData, {
          method: "post",
          encType: "multipart/form-data",
        });
      } catch (error) {
        console.error("Upload error: ", error);
      }
    }
  };

  return (
    <Container fluid>
      {/* TODO: Implement uploading binary images functionality */}
      <Modal show={showProfilePopUp} onHide={closeProfilePopup} centered>
        <Modal.Header closeButton>Change Profile Image</Modal.Header>
        <Modal.Body>
          {actionData && (
            <Alert variant={actionData.success ? "success" : "warning"}>
              {actionData.message}
            </Alert>
          )}
          <Row>
            <img
              src={profileImageUrl}
              onError={(e) => {
                // If the image fails to load, replace with default
                e.currentTarget.src = "/default-profile-image.jpg";
              }}
              style={{ height: "100px", width: "125px" }}
            ></img>
            <Form onSubmit={handleProfileSubmit}>
              <InputGroup>
                <Form.Control
                  type="file"
                  id="profilePhoto"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageBuffer}
                  required
                ></Form.Control>
                <Button type="submit">
                  {user.profileImage?.image ? "Change" : "Add"} Profile Picture
                </Button>
              </InputGroup>
            </Form>
          </Row>
        </Modal.Body>
      </Modal>
      <Row className="d-flex h-32 align-items-center p-2">
        <Col className="d-flex align-items-center p-3">
          <img
            src={profileImageUrl}
            onError={(e) => {
              // If the image fails to load, replace with default
              e.currentTarget.src = "/default-profile-image.jpg";
            }}
            onClick={openProfilePopup}
            className="rounded-circle border"
            key={imageUpdated ? new Date().getTime() : user._id}
            style={{ height: "65px", width: "65px", objectFit: "cover" }}
          ></img>
          <div className="d-flex align-items-center">
            <h4
              className="ps-3"
              style={{ fontSize: "35px", fontStyle: "bold" }}
            >
              {username}
            </h4>
          </div>
        </Col>
        <Col>Member since {formattedDate}</Col>
        {user.permissions?.level !== "Administrator" &&
        user.permissions?.level !== "VerifiedUser" ? (
          <Col>
            <Button>Request to be Verified?</Button>
          </Col>
        ) : (
          <Col>
            <p>{user.permissions.lastPromoted?.toString()}</p>
          </Col>
        )}
      </Row>
      <Row>
        <Tabs
          fill
          variant="tabs"
          className="d-flex"
          defaultActiveKey={activeTab}
        >
          <Tab
            title="Reviews"
            eventKey="reviews"
            className="w-1/4 centered justify-items-center"
          >
            Review
          </Tab>
          <Tab
            title="Submitted Spots"
            eventKey="spots"
            className="w-1/4 centered justify-items-center"
          >
            {isMounted && spots && spots.length > 0 ? (
              <div className="justify-center">
                {spots.map((spot) => (
                  <Card key={spot._id} className="mb-3">
                    <Card.Header>
                      <Card.Title>{spot.name}</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Card.Text>{spot.description}</Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              <p>No spots found.</p>
            )}
          </Tab>

          <Tab
            title="Settings"
            eventKey="settings"
            className="w-1/4 centered justify-items-center"
          >
            Settings
          </Tab>
        </Tabs>
      </Row>
    </Container>
  );
}
