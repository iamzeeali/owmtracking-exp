const DEFAULT_ENDPOINT = "https://api.wheelseye.com/currentLoc";

const normalizeVehicleNumber = (value) =>
  value ? String(value).toUpperCase().replace(/[^A-Z0-9]/g, "") : "";

const getVehicleList = (payload) => {
  if (payload && payload.data && Array.isArray(payload.data.list)) return payload.data.list;
  if (payload && Array.isArray(payload.list)) return payload.list;
  return [];
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
  if (!accessToken || !normalizeVehicleNumber(vehicleNumber)) return null;

  const endpoint = options.endpoint || process.env.WHEELSEYE_API_URL || DEFAULT_ENDPOINT;
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required for Wheelseye GPS requests.");
  }

  const url = new URL(endpoint);
  url.searchParams.set("accessToken", accessToken);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Wheelseye GPS request failed (${response.status}).`);

    const payload = await response.json();
    const wantedVehicle = normalizeVehicleNumber(vehicleNumber);
    const record = getVehicleList(payload).find(
      (item) => normalizeVehicleNumber(item.vehicleNumber) === wantedVehicle
    );
    return record ? toCurrentLocation(record) : null;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  getCurrentVehicleLocation,
  normalizeVehicleNumber,
  toCurrentLocation,
};
