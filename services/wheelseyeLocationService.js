const DEFAULT_ENDPOINT = "https://api.wheelseye.com/currentLoc";
const http = require("http");
const https = require("https");

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

// Node 18+ has global fetch. This fallback keeps the GPS integration working
// when a hosting platform runs an older Node version.
const requestJsonWithNode = (url, timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.get(url, { headers: { Accept: "application/json" } }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("error", reject);
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          json: async () => JSON.parse(body),
        });
      });
    });

    request.setTimeout(timeoutMs, () => {
      const error = new Error("Wheelseye GPS request timed out.");
      error.name = "AbortError";
      request.destroy(error);
    });
    request.on("error", reject);
  });

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

  const url = new URL(endpoint);
  url.searchParams.set("accessToken", accessToken);

  try {
    let response;
    if (typeof fetchImpl === "function") {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        response = await fetchImpl(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    } else {
      response = await requestJsonWithNode(url);
    }
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
  }
};

module.exports = {
  getCurrentVehicleLocation,
  normalizeVehicleNumber,
  toCurrentLocation,
};
