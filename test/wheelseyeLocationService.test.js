const test = require("node:test");
const assert = require("node:assert/strict");
const { getCurrentVehicleLocation } = require("../services/wheelseyeLocationService");

test("returns the live location for the matching vehicle", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      data: {
        list: [
          { vehicleNumber: "JH05DS0979", latitude: 22.878, longitude: 86.191, speed: 0 },
          {
            vehicleNumber: "JH05DS2047",
            latitude: 22.8778,
            longitude: 86.1914,
            dttimeInEpoch: 1788874327,
            speed: 14,
            ignition: true,
          },
        ],
      },
    }),
  });

  const location = await getCurrentVehicleLocation("JH 05 DS-2047", {
    accessToken: "test-token",
    fetchImpl,
  });

  assert.equal(location.vehicleNumber, "JH05DS2047");
  assert.equal(location.latitude, 22.8778);
  assert.equal(location.speed, 14);
  assert.equal(location.ignition, true);
  assert.equal(location.source, "wheelseye");
});

test("returns null when the vehicle is absent from the GPS response", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => ({ data: { list: [] } }) });
  const location = await getCurrentVehicleLocation("JH05DS2047", {
    accessToken: "test-token",
    fetchImpl,
  });
  assert.equal(location, null);
});
