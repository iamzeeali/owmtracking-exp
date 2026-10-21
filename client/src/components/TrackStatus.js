import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./TrackStatus.css";

const STEP_ICON = {
  planned: "fa-map",
  picked: "fa-shopping-basket",
  receivedAtCrossDock: "fa-cube",
  dispatched: "fa-truck",
  delivery: "fa-dropbox",
};

const STEP_PILL = {
  planned: "pill-planned",
  picked: "pill-picked",
  receivedAtCrossDock: "pill-received",
  dispatched: "pill-dispatched",
  delivery: "pill-expected",
};

const safe = (value, fallback = "N/A") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const DetailRow = ({ label, value }) => (
  <div className="ts-api-detail-row">
    <dt className="ts-api-detail-label">{label}</dt>
    <dd className="ts-api-detail-value">{value}</dd>
  </div>
);

const vehicleIcon = L.divIcon({
  className: "ts-api-vehicle-marker",
  html: '<span class="ts-api-vehicle-marker-pin"><i class="fa fa-truck"></i></span>',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
});

const UpdateMapView = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 14);
    const resizeId = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(resizeId);
  }, [map, position]);

  return null;
};

const VehicleLocationMap = ({ location }) => {
  if (!location) {
    return (
      <div className="ts-api-location-empty">
        <i className="fa fa-map-marker" aria-hidden />
        <p>Live location is not available for this vehicle yet.</p>
      </div>
    );
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const position = [latitude, longitude];

  return (
    <>
      <div className="ts-api-location-map" aria-label={`Current location of vehicle ${location.vehicleNumber || ""}`}>
        <MapContainer center={position} zoom={14} scrollWheelZoom={false} className="ts-api-location-map-canvas">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={vehicleIcon} />
          <UpdateMapView position={position} />
        </MapContainer>
      </div>
      <div className="ts-api-location-meta">
        <span><i className="fa fa-circle ts-api-location-live-dot" aria-hidden /> Live GPS</span>
        {location.updatedAtLabel ? <span>Updated {location.updatedAtLabel}</span> : null}
        {location.speed !== null ? <span>{location.speed} km/h</span> : null}
      </div>
    </>
  );
};

const TrackStatus = ({ match }) => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [ecciInput, setEcciInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = ecciInput.trim();
    if (!val || isSearching) return;
    setIsSearching(true);
    setEcciInput("");
    history.push(`/trackStatus/${val}`);
  };

  useEffect(() => {
    let active = true;

    const loadTracking = async () => {
      setLoading(true);
      setIsSearching(false);
      setError("");
      try {
        const res = await axios.get(`/api/tracking/${match.params.id}`);
        if (!active) return;
        const data = res.data && res.data.data ? res.data.data : null;
        setTrackingData(data);
        console.groupCollapsed(`[OWM GPS] Tracking request: ${match.params.id}`);
        console.info("API request:", res.config.url);
        console.info("Shipment vehicle number:", data?.details?.vehicleNumber || "not available");
        console.info("GPS location:", data?.location || null);
        if (data?.gpsDebug) console.info("Backend GPS diagnostic:", data.gpsDebug);
        if (!data?.location) {
          console.warn(
            "GPS location is null. Enable GPS_DEBUG=true on the backend and inspect the backend diagnostic above or server logs."
          );
        }
        console.groupEnd();
      } catch (err) {
        if (!active) return;
        console.error("[OWM GPS] Tracking API request failed:", {
          url: `/api/tracking/${match.params.id}`,
          status: err.response?.status || null,
          response: err.response?.data || null,
          message: err.message,
        });
        setError("Unable to load tracking details right now.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTracking();
    const refreshId = window.setInterval(loadTracking, 60000);
    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, [match.params.id]);

  const timeline = useMemo(() => {
    if (!trackingData || !Array.isArray(trackingData.timeline)) return [];
    return trackingData.timeline.filter((step) => step && step.isVisible);
  }, [trackingData]);

  const details = trackingData ? trackingData.details || {} : {};
  const statusLabel =
    trackingData && trackingData.summary && trackingData.summary.statusLabel
      ? trackingData.summary.statusLabel
      : "N/A";

  return (
    <div className="status track-status-api">
      <div className="status-overlay">
        <div className="status-inner">
          <div className="container-fluid mt-3 ts-api-shell">

            <header className="ts-api-page-header">
              <div className="ts-api-page-header-text">
                <p className="ts-api-eyebrow">Shipment tracking</p>
                <h1 className="ts-api-page-title">Status overview</h1>
                <p className="ts-api-page-meta">
                  ECCI{" "}
                  <span className="ts-api-ecci-chip">#{match.params.id}</span>
                </p>
              </div>
              <Link to="/" className="ts-api-link-home">
                <i className="fa fa-arrow-left ts-api-link-home-icon" aria-hidden />
                Back to track
              </Link>
            </header>

            <form
              onSubmit={handleSearch}
              className="status-search-bar ts-api-search"
              aria-label="Search another ECCI"
            >
              <input
                type="number"
                className="form-control status-search-input"
                placeholder="Track another ECCI number…"
                value={ecciInput}
                onChange={(e) => setEcciInput(e.target.value)}
                aria-label="ECCI number"
                disabled={isSearching}
              />
              <button type="submit" className="btn status-search-btn" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <i className="fa fa-spinner fa-spin" aria-hidden />
                    <span className="ts-api-search-btn-text">Searching...</span>
                  </>
                ) : (
                  <>
                    <i className="fa fa-search" aria-hidden />
                    <span className="ts-api-search-btn-text">Search</span>
                  </>
                )}
              </button>
            </form>

            <div className="row ts-api-columns">
              <div className="col-lg-5 col-md-12 ts-api-col">
                <div className="timeline-inner ts-api-card ts-api-timeline-card">
                  <h2 className="ts-api-card-title">Timeline</h2>
                  <p className="ts-api-card-desc">
                    Milestones for this shipment. Completed steps are highlighted.
                  </p>

                  <div className="ts-api-timeline-body">
                    {loading ? (
                      <div className="ts-api-skeleton" aria-busy="true">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="ts-api-skel-step">
                            <div className="ts-api-skel-icon" />
                            <div className="ts-api-skel-lines">
                              <div className="ts-api-skel-line ts-api-skel-line--lg" />
                              <div className="ts-api-skel-line ts-api-skel-line--sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="ts-api-alert ts-api-alert--error" role="alert">
                        <i className="fa fa-exclamation-circle" aria-hidden />
                        {error}
                      </div>
                    ) : timeline.length === 0 ? (
                      <div className="ts-api-alert ts-api-alert--neutral">
                        <i className="fa fa-inbox" aria-hidden />
                        No tracking data found for this ECCI.
                      </div>
                    ) : (
                      timeline.map((step) => {
                        const iconClass = STEP_ICON[step.key] || "fa-circle";
                        const colorClass = step.isComplete ? "text-primary" : "text-danger";
                        const deliveryClass =
                          step.key === "delivery" && step.isComplete
                            ? "pill-delivered"
                            : STEP_PILL[step.key] || "pill-expected";

                        return (
                          <div className="step ts-api-step" key={step.key}>
                            <span className="ts-api-step-icon-wrap">
                              <i
                                className={`fa ${iconClass} ${colorClass} ts-api-step-icon`}
                                aria-hidden
                              />
                            </span>
                            <div className="step-body ts-api-step-body">
                              <span className={`pill ${deliveryClass}`}>
                                {safe(step.label, "Pending")}
                              </span>
                              {step.displayDate ? (
                                <time className="pill-date" dateTime={step.displayDate}>
                                  {safe(step.displayDate, "")}
                                </time>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-7 col-md-12 ts-api-col">
                <div className="ts-api-details-location-stack">
                  <div className="details-inner ts-api-card ts-api-details-card">
                    <h2 className="ts-api-card-title">Shipment details</h2>
                    <p className="ts-api-card-desc">
                      Origin, destination, and current status for this consignment.
                    </p>

                    <section className="ts-api-section">
                      <h3 className="ts-api-section-title">Pickup</h3>
                      <dl className="ts-api-dl">
                        <DetailRow label="Vendor" value={safe(details.vendorName)} />
                        <DetailRow
                          label="Collection location"
                          value={safe(details.collectionLocationCode)}
                        />
                      </dl>
                    </section>

                    <section className="ts-api-section">
                      <h3 className="ts-api-section-title">Delivery &amp; status</h3>
                      <dl className="ts-api-dl">
                        <DetailRow
                          label="Delivery location"
                          value={safe(details.deliveryLocation)}
                        />
                        <DetailRow label="Store" value={safe(details.store)} />
                        <DetailRow
                          label="Vehicle number"
                          value={safe(details.vehicleNumber)}
                        />
                        <DetailRow label="Current status" value={safe(statusLabel)} />
                      </dl>
                    </section>
                  </div>

                  <section className="ts-api-card ts-api-location-card" aria-label="Vehicle current location">
                    <div className="ts-api-location-heading">
                      <div>
                        <h2 className="ts-api-card-title">Current vehicle location</h2>
                        <p className="ts-api-card-desc">Live position from the vehicle GPS device.</p>
                      </div>
                      {trackingData && trackingData.location ? (
                        <span className="ts-api-location-vehicle">{trackingData.location.vehicleNumber}</span>
                      ) : null}
                    </div>
                    <VehicleLocationMap location={trackingData ? trackingData.location : null} />
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Link to="/" className="fab ts-api-fab" title="Back to home">
        <i className="fa fa-home my-fab" aria-hidden />
      </Link>
    </div>
  );
};

export default TrackStatus;
