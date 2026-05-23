import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import LogisticsBackground from "./LogisticsBackground";

const TrackHeroIcon = () => (
  <svg
    className="track-hero-icon"
    viewBox="0 0 120 132"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Pulsing signal rings */}
    <circle cx="60" cy="52" r="50" className="track-icon-ring track-icon-ring-1" />
    <circle cx="60" cy="52" r="42" className="track-icon-ring track-icon-ring-2" />

    {/* Soft backing disc */}
    <circle cx="60" cy="52" r="34" fill="rgba(4,94,132,0.15)" stroke="rgba(4,94,132,0.28)" strokeWidth="1.5" />

    {/* Location pin teardrop */}
    <path
      d="M60 18 C43 18 29 32 29 49 C29 68 60 96 60 96 C60 96 91 68 91 49 C91 32 77 18 60 18Z"
      fill="rgba(4,94,132,0.88)"
      stroke="rgba(125,211,248,0.22)"
      strokeWidth="1.5"
    />

    {/* Dark inner circle (cutout) */}
    <circle cx="60" cy="49" r="13" fill="rgba(11,25,41,0.95)" />

    {/* Amber center dot */}
    <circle cx="60" cy="49" r="4.5" fill="#feac00" />

    {/* Signal arc — inner pair */}
    <path d="M46 44 C46 36.5 52.5 30.5 60 30.5" stroke="rgba(125,211,248,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M74 44 C74 36.5 67.5 30.5 60 30.5" stroke="rgba(125,211,248,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

    {/* Signal arc — outer pair */}
    <path d="M40 40 C40 29.5 49.5 21 60 21" stroke="rgba(125,211,248,0.2)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M80 40 C80 29.5 70.5 21 60 21" stroke="rgba(125,211,248,0.2)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);
const Track = ({ auth: { isAuthenticated, role, username } }) => {
  const history = useHistory();
  const [ecci, setEcci] = useState("");
  const [notFoundInAsn, setNotFoundInAsn] = useState(false);
  const [notFoundInGrn, setNotFoundInGrn] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [opsSummary, setOpsSummary] = useState(null);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState("");

  const showOpsDashboard = Boolean(isAuthenticated && role === "admin");

  useEffect(() => {
    let active = true;
    if (!showOpsDashboard) return undefined;

    const loadSummary = async () => {
      setOpsLoading(true);
      setOpsError("");
      try {
        const response = await axios.get("/api/reports/operations-summary");
        if (!active) return;
        setOpsSummary(response?.data?.data || null);
      } catch (error) {
        if (!active) return;
        setOpsError("Operational summary is unavailable right now.");
      } finally {
        if (active) setOpsLoading(false);
      }
    };

    loadSummary();
    return () => {
      active = false;
    };
  }, [showOpsDashboard]);

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (!ecci || isSearching) return;
    setIsSearching(true);
    let completedChecks = 0;
    const finishSearchCheck = () => {
      completedChecks += 1;
      if (completedChecks >= 2) setIsSearching(false);
    };
    setNotFoundInAsn(false);
    setNotFoundInGrn(false);

    axios
      .get(`/api/asn?ecciNumber=${ecci}`)
      .then((response) => {
        if (response.data.results <= 0) {
          setNotFoundInAsn(true);
        } else {
          history.push(`/trackStatus/${ecci}`);
        }
      })
      .catch((error) => {
        console.log("Something went wrong!", error);
        setNotFoundInAsn(true);
      })
      .finally(() => {
        finishSearchCheck();
      });

    axios
      .get(`/api/grn/?ecciNumber=${ecci}`)
      .then((response) => {
        if (response.data.results <= 0) {
          setNotFoundInGrn(true);
        } else {
          history.push(`/trackStatus/${ecci}`);
        }
      })
      .catch((error) => {
        console.log("Something went wrong!", error);
        setNotFoundInGrn(true);
      })
      .finally(() => {
        finishSearchCheck();
      });
  };

  const handleKeypress = (e) => {
    //it triggers by pressing the enter key
    if (e.charCode === 13) {
      onSubmitHandler(e);
    }
  };

  const handleOpsCardClick = () => {
    history.push("/reports");
  };

  const handleOpsCardKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpsCardClick();
    }
  };

  const volumeSeries = useMemo(() => {
    if (!opsSummary || !Array.isArray(opsSummary.volumeLast7Days)) return [];
    return opsSummary.volumeLast7Days;
  }, [opsSummary]);

  const volumeMax = useMemo(() => {
    if (!volumeSeries.length) return 1;
    return Math.max(
      ...volumeSeries.map((item) => Math.max(item.asnCount || 0, item.dispatchCount || 0)),
      1
    );
  }, [volumeSeries]);

  const kpiCards = useMemo(() => {
    const totals = opsSummary?.totals || {};
    return [
      {
        label: "Total Shipments",
        value: totals.totalShipments ?? "—",
        icon: "fa-cubes",
      },
      {
        label: "In Transit",
        value: totals.inTransitShipments ?? "—",
        icon: "fa-truck",
      },
      {
        label: "Delivered",
        value: totals.deliveredShipments ?? "—",
        icon: "fa-check-circle",
      },
      {
        label: "Pending Orders",
        value: totals.pendingOrders ?? "—",
        icon: "fa-clock-o",
      },
      {
        label: "Avg Delivery Time",
        value:
          totals.avgDeliveryTimeDays === null || totals.avgDeliveryTimeDays === undefined
            ? "—"
            : `${totals.avgDeliveryTimeDays} days`,
        icon: "fa-line-chart",
      },
      {
        label: "Active Vehicles",
        value: totals.activeVehicles ?? "—",
        icon: "fa-bus",
      },
    ];
  }, [opsSummary]);

  return (
    <div className={`track-main ${showOpsDashboard ? "track-main--ops" : ""} ${darkTheme ? "track-theme-dark" : ""}`}>
      <LogisticsBackground />
      <div className="container track-main-inner">
        {showOpsDashboard && (
          <section
            className="track-ops-panel track-ops-panel--clickable mb-4 mt-4"
            aria-label="Operations snapshot"
            role="button"
            tabIndex={0}
            onClick={handleOpsCardClick}
            onKeyDown={handleOpsCardKeyDown}
          >
            <div className="track-ops-header">
              <div>
                <p className="track-ops-eyebrow">Operations Control</p>
                <h2 className="track-ops-title">Live logistics overview</h2>
                <p className="track-ops-subtitle">
                  Real-time visibility on shipment throughput and fulfillment stages.
                </p>
              </div>
              <span className="track-ops-chip">
                <i className="fa fa-shield mr-1" aria-hidden />
                Hi, {username || "User"}
              </span>
            </div>

            {opsLoading ? (
              <div className="track-ops-grid">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="track-kpi-card track-kpi-card--loading" />
                ))}
              </div>
            ) : opsError ? (
              <div className="track-ops-alert">
                <i className="fa fa-exclamation-circle mr-2" aria-hidden />
                {opsError}
              </div>
            ) : !opsSummary ? (
              <div className="track-ops-empty">
                <i className="fa fa-inbox mr-2" aria-hidden />
                No operational metrics available yet.
              </div>
            ) : (
              <>
                <div className="track-ops-grid">
                  {kpiCards.map((card) => (
                    <article className="track-kpi-card" key={card.label}>
                      <div className="track-kpi-icon">
                        <i className={`fa ${card.icon}`} aria-hidden />
                      </div>
                      <p className="track-kpi-label">{card.label}</p>
                      <p className="track-kpi-value">{card.value}</p>
                    </article>
                  ))}
                </div>

                <div className="row mt-3">
                  <div className="col-lg-6 mb-3 mb-lg-0">
                    <div className="track-mini-card">
                      <h3 className="track-mini-title">Shipment status mix</h3>
                      <div className="track-status-list">
                        {Object.entries(opsSummary.statusBreakdown || {}).length ? (
                          Object.entries(opsSummary.statusBreakdown).map(([key, value]) => (
                            <div key={key} className="track-status-item">
                              <span className="track-status-key">{key.replace(/_/g, " ")}</span>
                              <span className="track-status-value">{value}</span>
                            </div>
                          ))
                        ) : (
                          <p className="track-mini-empty">No status data available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="track-mini-card">
                      <h3 className="track-mini-title">7-day shipment volume</h3>
                      <div className="track-volume-list">
                        {volumeSeries.length ? (
                          volumeSeries.map((item) => (
                            <div className="track-volume-row" key={item.day}>
                              <span className="track-volume-day">{item.day.slice(5)}</span>
                              <div className="track-volume-bars">
                                <span
                                  className="track-volume-bar track-volume-bar--asn"
                                  style={{ width: `${((item.asnCount || 0) / volumeMax) * 100}%` }}
                                />
                                <span
                                  className="track-volume-bar track-volume-bar--dispatch"
                                  style={{
                                    width: `${((item.dispatchCount || 0) / volumeMax) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="track-mini-empty">No recent volume data available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="d-flex justify-content-end ">
              <button
                type="button"
                className="track-theme-toggle"
                onClick={() => setDarkTheme((prev) => !prev)}
                title={darkTheme ? "Switch to light hero theme" : "Switch to dark hero theme"}
                aria-label="Toggle landing page theme"
              >
                <i className={`fa ${darkTheme ? "fa-sun-o" : "fa-moon-o"}`} aria-hidden />
              </button>
            </div>

            {/* Hero icon */}
            <div className="text-center">
              <TrackHeroIcon />
            </div>

            {/* Badge + Heading */}
            <div className="text-center mb-1">
              <span className="track-badge">Real-Time Shipment Tracking</span>
              {/* <h1 className="track-title mt-3 mb-2">Track you shipment</h1> */}
              <p className="track-subtitle mt-3">
                Enter your ECCI number to get instant status updates on your delivery
              </p>
            </div>

            {/* Search Card */}
            <div className="track-search-card">
              <div className="d-flex align-items-center">
                <input
                  className="form-control track-input mr-2"
                  placeholder="Enter ECCI Number"
                  autoFocus
                  required
                  type="Number"
                  value={ecci}
                  onChange={(e) => setEcci(e.target.value)}
                  onKeyPress={(e) => handleKeypress(e)}
                  disabled={isSearching}
                />
                <button
                  onClick={(e) => onSubmitHandler(e)}
                  className="btn track-search-btn"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <i className="fa fa-spinner fa-spin mr-1" aria-hidden /> Searching...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-search mr-1" aria-hidden /> Track
                    </>
                  )}
                </button>
              </div>
              <p className="track-hint mt-3 mb-0">
                <i className="fa fa-info-circle mr-1"></i>
                Press <kbd>Enter</kbd> or click <strong>Track</strong> to search
              </p>
            </div>

            {/* Not found error */}
            {notFoundInAsn && notFoundInGrn && (
              <div className="track-not-found text-center mt-3">
                <i className="fa fa-exclamation-triangle mr-2"></i>
                No shipment found for ECCI number <strong>{ecci}</strong>
              </div>
            )}

            {/* Feature pills */}
            <div className="track-features text-center mt-2">
              <span className="track-feature-tag mr-2 mb-2 d-inline-block">
                <i className="fa fa-refresh mr-1"></i> Live Updates
              </span>
              <span className="track-feature-tag mr-2 mb-2 d-inline-block">
                <i className="fa fa-lock mr-1"></i> Secure Tracking
              </span>
              <span className="track-feature-tag mb-2 d-inline-block">
                <i className="fa fa-globe mr-1"></i> End-to-End Visibility
              </span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

Track.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(Track);
