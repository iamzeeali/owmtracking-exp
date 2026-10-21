const DEFAULT_ENDPOINT = "https://api.wheelseye.com/currentLoc";

const normalizeVehicleNumber = (value) =>
  value ? String(value).toUpperCase().replace(/[^A-Z0-9]/g, "") : "";

const getVehicleList = (payload) => {
  if (payload && payload.data && Array.isArray(payload.data.list)) return payload.data.list;
  if (payload && Array.isArray(payload.list)) return payload.list;
  return [];
};

const reportDiagnostic = (options, diagnostic) => {
  if (typeof options.onDiagnostic === "function") options.onDiagnostic(diagnostic);
};

const createGpsError = (message, diagnostic) => {
  const error = new Error(message);
  error.gpsDiagnostic = diagnostic;
  return error;
};

const toIsoDate = (epochSeconds) => {
  const epoch = Number(epochSeconds);
  return Number.isFinite(epoch) ? new Date(epoch * 1000).toISOString() : null;
};

const toCurrentLocation = (record) => {
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    vehicleNumber: record.vehicleNumber,
    latitude,
    longitude,
    updatedAt: toIsoDate(record.dttimeInEpoch || record.createdDate),
    updatedAtLabel: record.dttime || record.createdDateReadable || null,
    speed: Number.isFinite(Number(record.speed)) ? Number(record.speed) : null,
    ignition: typeof record.ignition === "boolean" ? record.ignition : null,
    source: "wheelseye",
  };
};

const getCurrentVehicleLocation = async (vehicleNumber, options = {}) => {
  const accessToken = options.accessToken || process.env.WHEELSEYE_ACCESS_TOKEN;
  if (!accessToken) {
    reportDiagnostic(options, { code: "GPS_TOKEN_MISSING" });
    return null;
  }

  if (!normalizeVehicleNumber(vehicleNumber)) {
    reportDiagnostic(options, { code: "GPS_VEHICLE_NUMBER_MISSING" });
    return null;
  }

  const endpoint = options.endpoint || process.env.WHEELSEYE_API_URL || DEFAULT_ENDPOINT;
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== "function") {
    throw createGpsError("A fetch implementation is required for Wheelseye GPS requests.", {
      code: "GPS_FETCH_UNAVAILABLE",
    });
  }

  const url = new URL(endpoint);
  url.searchParams.set("accessToken", accessToken);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw createGpsError(`Wheelseye GPS request failed (${response.status}).`, {
        code: "GPS_PROVIDER_HTTP_ERROR",
        httpStatus: response.status,
      });
    }

    const payload = await response.json();
    const wantedVehicle = normalizeVehicleNumber(vehicleNumber);
    const vehicles = getVehicleList(payload);
    const record = vehicles.find(
      (item) => normalizeVehicleNumber(item.vehicleNumber) === wantedVehicle
    );
    if (!record) {
      reportDiagnostic(options, {
        code: "GPS_VEHICLE_NOT_FOUND",
        normalizedVehicleNumber: wantedVehicle,
        providerRecordCount: vehicles.length,
      });
      return null;
    }

    const location = toCurrentLocation(record);
    reportDiagnostic(options, {
      code: location ? "GPS_LOCATION_FOUND" : "GPS_COORDINATES_INVALID",
      providerRecordCount: vehicles.length,
    });
    return location;
  } catch (error) {
    if (!error.gpsDiagnostic) {
      error.gpsDiagnostic = {
        code: error.name === "AbortError" ? "GPS_PROVIDER_TIMEOUT" : "GPS_PROVIDER_NETWORK_ERROR",
      };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  getCurrentVehicleLocation,
  normalizeVehicleNumber,
  toCurrentLocation,
};
