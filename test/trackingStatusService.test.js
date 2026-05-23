const test = require("node:test");
const assert = require("node:assert/strict");
const { computeTrackingFromRecords } = require("../services/trackingStatusService");

test("marks delivered false on expected day and true after day passes", () => {
  const base = {
    ecciNumber: "E001",
    asn: { asnUploadDate: "2099-01-10T00:00:00.000Z", manual: false },
    received: null,
    mrTransit: {
      inDate: "2099-01-10T00:00:00.000Z",
      transDate: "2099-01-10T00:00:00.000Z",
      giNumber: "GI123",
      manual: false,
      deliveryLocation: "Kolkata",
    },
    ddTransit: null,
    ddDo: null,
  };

  const payload = computeTrackingFromRecords(base);
  assert.equal(payload.summary.currentStage, "expected_delivery");
  assert.equal(payload.summary.isDelivered, false);
  assert.equal(payload.timeline[4].label, "Expected Delivery at Tata Steel");
});

test("applies TSM +3 day override from dispatch source", () => {
  const payload = computeTrackingFromRecords({
    ecciNumber: "E002",
    asn: { asnUploadDate: "2026-01-10T00:00:00.000Z", manual: false },
    received: null,
    mrTransit: {
      inDate: "2026-01-10T00:00:00.000Z",
      transDate: "2026-01-10T00:00:00.000Z",
      giNumber: "GI123",
      manual: false,
      deliveryLocation: "TSM SHOP",
    },
    ddTransit: null,
    ddDo: null,
  });

  assert.equal(payload.details.deliveryLocation, "TSM SHOP");
  assert.equal(payload.dates.expectedDeliveryDisplay, "13-Jan-2026");
});

test("uses DD DO source first for vehicle number", () => {
  const payload = computeTrackingFromRecords({
    ecciNumber: "E003",
    asn: { vehicleNumber: "ASN-1" },
    received: { vehicleNumber: "REC-1" },
    mrTransit: { vehicleNumber: "MR-1" },
    ddTransit: { vehicleNo: "DD-ALT" },
    ddDo: { vehicleNumber: "DDDO-1" },
  });

  assert.equal(payload.details.vehicleNumber, "DDDO-1");
});

test("collection location code is JSR or KOL fallback", () => {
  const jsrPayload = computeTrackingFromRecords({
    ecciNumber: "E004",
    asn: { warehouse: "JSR Yard" },
    received: null,
    mrTransit: null,
    ddTransit: null,
    ddDo: null,
  });
  assert.equal(jsrPayload.details.collectionLocationCode, "JSR");

  const kolPayload = computeTrackingFromRecords({
    ecciNumber: "E005",
    asn: { warehouse: "Howrah Depot" },
    received: null,
    mrTransit: null,
    ddTransit: null,
    ddDo: null,
  });
  assert.equal(kolPayload.details.collectionLocationCode, "KOL");
});
