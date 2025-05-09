import type {
  ActionFunctionArgs,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  ChangeEvent,
  FormEvent,
  RefAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Modal,
  OverlayTrigger,
  Row,
  Stack,
  Tooltip,
  TooltipProps,
} from "react-bootstrap";

import { Map, QuestionCircle } from "react-bootstrap-icons";
import { JSX } from "react/jsx-runtime";
import { createObject } from "~/models/server/spot.server";
import { GeospatialObject } from "~/models/types/spot.types";
import { connectToDatabase } from "~/utils/server/db.server";
import { getLoggedInUser } from "~/utils/server/session.server";
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  MapCameraChangedEvent,
  MapMouseEvent,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

type Poi = { key: string; location: google.maps.LatLngLiteral | null };
type ActionData = {
  success: boolean;
  message: string;
};

export const loader = async () => {
  return Response.json({
    MAPS_API_KEY: process.env.MAPS_API_KEY,
  });
};

function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

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

interface DaySchedule {
  day: string;
  id: string;
  enabled: boolean;
  allDay: boolean;
  openTime: string;
  closingTime: string;
}

interface SpotFormData {
  name: string;
  description: string;
  coordinates: [number, number]; // [longitude, latitude]
  isPublic: boolean;
  isRestricted: boolean;
  restrictionDetails?: string;
  days: DaySchedule[];
}

export default function Upload() {
  const isMounted = useIsMounted();
  const { MAPS_API_KEY } = useLoaderData<typeof loader>();
  const [center, setCenter] = useState({ lat: 38.8951, lng: -77.0364 }); // Default to DC
  const [permissionSet, setPermissionSet] = useState(false);
  const [status, setErrorStatus] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Poi>({
    key: "",
    location: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<SpotFormData>({
    name: "",
    description: "",
    coordinates: [0, 0],
    isPublic: true,
    isRestricted: false,
    restrictionDetails: "",
    days: [
      {
        day: "Monday",
        id: "monday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
      {
        day: "Tuesday",
        id: "tuesday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
      {
        day: "Wednesday",
        id: "wednesday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
      {
        day: "Thursday",
        id: "thursday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
      {
        day: "Friday",
        id: "friday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
      {
        day: "Saturday",
        id: "saturday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
      {
        day: "Sunday",
        id: "sunday",
        enabled: false,
        allDay: false,
        openTime: "",
        closingTime: "",
      },
    ],
  });
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const actionData = useActionData<ActionData>();
  const [submitEnabler, setSubmitEnabler] = useState(false);

  const MapController = () => {
    // Use the useMap hook to get the map instance
    const map = useMap();

    // Effect to set the map reference when available
    useEffect(() => {
      if (map) {
        setMapRef(map);
        console.log("Map loaded");
      }
    }, [map]);

    // This component doesn't render anything
    return null;
  };

  const renderTooltip = (
    props: JSX.IntrinsicAttributes &
      TooltipProps &
      RefAttributes<HTMLDivElement>
  ) => (
    <Tooltip id="format-guide-tooltip" {...props}>
      Click here to open the formatting guide
    </Tooltip>
  );
  useEffect(() => {
    if (actionData) {
      setSubmitEnabler(true);
    }
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(userLocation);
          setPermissionSet(true);
        },
        (error) => {
          if (error.code !== 1) {
            console.error("Error getting location:", error);
            setErrorStatus(`Error accessing location: ${error.message}`);
            setPermissionSet(true);
          }
        }
      );
    } else {
      setPermissionSet(true);
    }
  }, []);

  useEffect(() => {
    if (
      permissionSet &&
      mapRef &&
      (center.lat !== 38.8951 || center.lng !== -77.0364)
    ) {
      console.log("Panning to user location", center);
      mapRef.panTo(center);
    }
  }, [permissionSet, mapRef, center]);

  const renderModal = () => setShowModal(true);
  const hideModal = () => setShowModal(false);

  const handleInputChange = (field: keyof SpotFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleDayChange = (
    index: number,
    field: keyof DaySchedule,
    value: boolean | string
  ) => {
    const updatedDays = [...formData.days];
    updatedDays[index] = { ...updatedDays[index], [field]: value };
    setFormData({
      ...formData,
      days: updatedDays,
    });
  };

  const handleAddMarker = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;

    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;

    console.log(`Map clicked at lat: ${lat}, lng: ${lng}`);

    // Update the selected location for marker display
    setSelectedLocation({
      key: "current marker",
      location: { lat, lng } as google.maps.LatLngLiteral,
    });

    setFormData({
      ...formData,
      coordinates: [lng, lat],
    });

    console.log(`Something happened, woah!, Clicked on: ${lat}, ${lng}`);
  };

  const submit = useSubmit();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const backendFormData = new FormData();
    backendFormData.append(
      "spot",
      JSON.stringify(formatFormDataForBackend(formData))
    );
    console.log(JSON.stringify(backendFormData));
    submit(backendFormData, { method: "POST" });
  };

  const formatFormDataForBackend = (data: SpotFormData) => {
    return {
      name: data.name,
      description: data.description,
      location: {
        type: {
          type: "Point",
        },
        coordinates: data.coordinates,
      },
      access: {
        isPublic: data.isPublic,
        isRestricted: data.isRestricted,
        restrictionDetails: data.isRestricted
          ? data.restrictionDetails
          : undefined,
      },
      hours: {
        is24Hours: data.days.every((day) => day.enabled && day.allDay),
        regularHours: {
          monday: data.days[0].enabled
            ? {
                open: data.days[0].allDay ? "00:00" : data.days[0].openTime,
                close: data.days[0].allDay ? "23:59" : data.days[0].closingTime,
              }
            : undefined,
          tuesday: data.days[1].enabled
            ? {
                open: data.days[1].allDay ? "00:00" : data.days[1].openTime,
                close: data.days[1].allDay ? "23:59" : data.days[1].closingTime,
              }
            : undefined,
          wednesday: data.days[2].enabled
            ? {
                open: data.days[2].allDay ? "00:00" : data.days[2].openTime,
                close: data.days[2].allDay ? "23:59" : data.days[2].closingTime,
              }
            : undefined,
          thursday: data.days[3].enabled
            ? {
                open: data.days[3].allDay ? "00:00" : data.days[3].openTime,
                close: data.days[3].allDay ? "23:59" : data.days[3].closingTime,
              }
            : undefined,
          friday: data.days[4].enabled
            ? {
                open: data.days[4].allDay ? "00:00" : data.days[4].openTime,
                close: data.days[4].allDay ? "23:59" : data.days[4].closingTime,
              }
            : undefined,
          saturday: data.days[5].enabled
            ? {
                open: data.days[5].allDay ? "00:00" : data.days[5].openTime,
                close: data.days[5].allDay ? "23:59" : data.days[5].closingTime,
              }
            : undefined,
          sunday: data.days[6].enabled
            ? {
                open: data.days[6].allDay ? "00:00" : data.days[6].openTime,
                close: data.days[6].allDay ? "23:59" : data.days[6].closingTime,
              }
            : undefined,
        },
      },
      // Set verification status to false for new submissions
      verification: {
        isVerified: false,
        verificationDate: undefined,
      },
    };
  };

  return (
    <Container fluid>
      <Modal size="xl" show={showModal} onHide={hideModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Formatting Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Stack gap={2}>
            <h4 className="border-bottom">Names</h4>
            <p>
              Make sure to include the full name of the park, or name the spot
              with a family friendly name!
            </p>
            <h4 className="border-bottom">Descriptions</h4>
            <p>
              Provide plenty of details about when the spot is available, when
              the spot is most/least occupied, types of sports that can be
              played on the fields (football, soccer, baseball, etc...), other
              amenities, available (or unavailable) bathrooms, and other
              important facts about the spot that you think everyone should
              know! Most importantly,{" "}
              <b>
                {" "}
                DO NOT RECOMMEND SPOTS THAT MAY BE UNSAFE OR HARMFUL TO
                CHILDREN!
              </b>
            </p>
            <h4 className="border-bottom">Map Coordinates/Google Maps</h4>
            <p>
              Place a pointer on the map to indicate where the park is located!
              Try and center this on the point as best as possible.
            </p>
            <h4 className="border-bottom">Public Park</h4>
            <p>
              Is the park owned by a county or city government? Is it available
              for everyone?
            </p>
            <h4 className="border-bottom">Restricted Area</h4>
            <p>
              Is this restricted to a certain number of people or residents in a
              certain area?
            </p>
            <h4 className="border-bottom">Open Hours</h4>
            <p>
              What hours of the day is the spot accessible? What hours of the
              day is the spot <i> safe </i> to access?
            </p>
            <h4 className="border-bottom">Submissions</h4>
            <p>
              Once you submit this spot, a verified user or administrator will
              review your submission and either approve or reject it based on
              several factors. We'll get back to you in at least 5 - 10 business
              days!
            </p>
          </Stack>
        </Modal.Body>
      </Modal>
      <Row className="d-flex content-area">
        <Col xs={12} md={8} className="h-full p-0">
          {isMounted ? (
            <APIProvider
              apiKey={MAPS_API_KEY || ""}
              onLoad={() => console.log("Maps API has loaded.")}
            >
              <GoogleMap
                className="h-full w-full"
                defaultZoom={13}
                defaultCenter={center}
                mapId="DEMO_MAP_ID"
                onCameraChanged={(ev: MapCameraChangedEvent) =>
                  console.log(
                    "camera changed:",
                    ev.detail.center,
                    "zoom:",
                    ev.detail.zoom
                  )
                }
                onClick={handleAddMarker}
              >
                <MapController></MapController>
                <PoiMarkers poi={selectedLocation}></PoiMarkers>
              </GoogleMap>
            </APIProvider>
          ) : (
            <div className="h-full w-full d-flex justify-center align-middle">
              <p>Loading Map...</p>
            </div>
          )}
        </Col>
        <Col
          xs={6}
          md={4}
          className="border-start flex-column d-flex h-100 overflow-auto"
        >
          <Stack gap={2} className="flex-grow-1 pt-2">
            <Row className="justify-content-end pr-2 pt-2">
              <p className="mr-2 p-0" style={{ width: "auto" }}>
                Formatting Guide
              </p>
              <OverlayTrigger
                delay={{ show: 250, hide: 400 }}
                overlay={renderTooltip}
              >
                <QuestionCircle
                  className="mr-5 mt-1 p-0"
                  style={{ width: "auto" }}
                  onClick={renderModal}
                ></QuestionCircle>
              </OverlayTrigger>
            </Row>
            <Form onSubmit={handleSubmit}>
              {actionData && (
                <Alert
                  variant={actionData.success ? "success" : "danger"}
                  className="mb-4"
                >
                  {actionData.message}
                </Alert>
              )}
              {status && (
                <Alert variant="danger" className="mb-4">
                  {status}
                </Alert>
              )}
              <Form.Group className="p-3 pt-0" controlId="formGroupSpotName">
                <Form.Label>Name the Spot!</Form.Label>
                <Form.Control
                  placeholder="Name Your Spot!"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                ></Form.Control>
              </Form.Group>
              <Form.Group className="p-3" controlId="formGroupDescription">
                <Form.Label> Description </Form.Label>
                <Form.Control
                  type="textarea"
                  placeholder="Include details on availability, which sports fit the best, pitfalls/balltraps/creeks/holes etc..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  required
                ></Form.Control>
              </Form.Group>
              <Form.Group className="p-3" controlId="formGroupCoordinates">
                <Form.Label> Click on the Map for Coords! </Form.Label>
                <Form.Control
                  readOnly
                  value={
                    formData.coordinates[0] !== 0 ||
                    formData.coordinates[1] !== 0
                      ? `Longitude: ${formData.coordinates[0].toFixed(6)}, Latitude: ${formData.coordinates[1].toFixed(6)}`
                      : "Click on the map to set coordinates"
                  }
                ></Form.Control>
              </Form.Group>
              <Form.Group className="p-3" controlId="formGroupPublicPrivate">
                <Form.Switch
                  label="Public Park?"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    handleInputChange("isPublic", e.target.checked)
                  }
                ></Form.Switch>
              </Form.Group>
              <Form.Group className="p-3" controlId="formGroupRestricted">
                <Form.Switch
                  label="Restricted?"
                  checked={formData.isRestricted}
                  onChange={(e) =>
                    handleInputChange("isRestricted", e.target.checked)
                  }
                ></Form.Switch>
              </Form.Group>
              {formData.isRestricted && (
                <Form.Group
                  className="p-3 pt-0"
                  controlId="formGroupRestrictionDetails"
                >
                  <Form.Label>Restriction Details</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Explain who can access this spot and any conditions..."
                    value={formData.restrictionDetails}
                    onChange={(e) =>
                      handleInputChange("restrictionDetails", e.target.value)
                    }
                  />
                </Form.Group>
              )}
              <Form.Group className="p-3" controlId="DateRange">
                <Form.Label> When is it Open? </Form.Label>
                <div className="justify-content-evenly">
                  {formData.days.map((day, index) => (
                    <div key={day.id}>
                      <Form.Check
                        id={`${day.id}Exists`}
                        label={day.day}
                        checked={day.enabled}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleDayChange(index, "enabled", e.target.checked)
                        }
                      />
                      {day.enabled && (
                        <Stack
                          direction="horizontal"
                          className="justify-content-evenly mb-2"
                        >
                          <Form.Group controlId={`${day.id}AllDay`}>
                            <Form.Check
                              label="All day?"
                              checked={day.allDay}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleDayChange(
                                  index,
                                  "allDay",
                                  e.target.checked
                                )
                              }
                            />
                          </Form.Group>
                          <Form.Group
                            className="w-1/3"
                            controlId={`${day.id}OpenTime`}
                          >
                            <Form.Control
                              type="time"
                              value={day.openTime}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleDayChange(
                                  index,
                                  "openTime",
                                  e.target.value
                                )
                              }
                              disabled={day.allDay}
                            />
                          </Form.Group>
                          <Form.Group
                            className="w-1/3"
                            controlId={`${day.id}CloseTime`}
                          >
                            <Form.Control
                              type="time"
                              value={day.closingTime}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleDayChange(
                                  index,
                                  "closingTime",
                                  e.target.value
                                )
                              }
                              disabled={day.allDay}
                            />
                          </Form.Group>
                        </Stack>
                      )}
                    </div>
                  ))}
                </div>
              </Form.Group>
              <div className="d-flex p-3 justify-content-end mr-3">
                <Button className="lg" type="submit" disabled={submitEnabler}>
                  Submit
                </Button>
              </div>
            </Form>
          </Stack>
        </Col>
      </Row>
    </Container>
  );
}

const PoiMarkers = (props: { poi: Poi }) => {
  const map = useMap();
  const currentPoi = props.poi;

  const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
    if (!map) return;
    if (!ev.latLng) return;
    console.log("marker clicked:", ev.latLng.toString());
    map.panTo(ev.latLng);
  }, []);

  return (
    <>
      <AdvancedMarker
        key={currentPoi.key}
        position={currentPoi.location}
        clickable={true}
        onClick={handleClick}
      >
        <Pin></Pin>
      </AdvancedMarker>
    </>
  );
};

// TODO: Implement input sanitization into the system to make sure there's no risk of Reflected XSS or Stored XSS
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, message: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    // Connect to the database
    await connectToDatabase();

    // Get the current user (to track who submitted the spot)
    const user = await getLoggedInUser(request);

    if (!user) {
      return Response.json(
        { success: false, message: "You must be logged in to submit a spot" },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const spotDataStr = formData.get("spot") as string;

    if (!spotDataStr) {
      return Response.json(
        { success: false, message: "No spot data provided" },
        { status: 400 }
      );
    }
    console.log(spotDataStr);
    // Parse the JSON string back to an object
    const spotData = JSON.parse(spotDataStr) as Partial<GeospatialObject>;

    // Add metadata
    spotData.metadata = {
      dateCreated: new Date(),
      lastUpdated: new Date(),
      lastUpdatedBy: user.id, // assuming user.id exists
    };

    console.log(JSON.stringify(spotData.metadata));
    // Set verification status to false for new submissions
    spotData.verification = {
      isVerified: false, // All new submissions start unverified
    };
    console.log(JSON.stringify(spotData.verification));
    // Create the spot in the database
    const newSpot = await createObject(spotData as GeospatialObject);

    return Response.json({
      success: true,
      message: "Your spot has been submitted and is pending approval",
      spotId: newSpot.id,
    });
  } catch (error) {
    console.error("Error submitting spot:", error);

    return Response.json(
      { success: false, message: `Error submitting spot: ${error.message}` },
      { status: 500 }
    );
  }
};
