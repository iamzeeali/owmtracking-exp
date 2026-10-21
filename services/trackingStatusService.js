const Asn = require("../models/asnModel");
const Grn = require("../models/grnModel");
const { getCurrentVehicleLocation } = require("./wheelseyeLocationService");

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

const formatShortDate = (date) => {
  if (!date) return null;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const monthName = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${String(day).padStart(2, "0")}-${monthName}-${year}`;
};

const increaseDateBy1 = (value, manual) => {
  const date = toDate(value);
  if (!date) return null;
  if (manual) return date;
  return addDays(date, 1);
};

const sourceItem = (record) => record || null;

const pickValue = (sources, keys, fallback = "N/A") => {
  for (const src of sources) {
    const item = sourceItem(src);
    if (!item) continue;
    for (const key of keys) {
      if (item[key]) return item[key];
    }
  }
  return fallback;
};

const pickSourceDate = (sources) => {
  for (const src of sources) {
    const item = sourceItem(src);
    if (!item) continue;
    if (item.transDate) return item.transDate;
    if (item.inDate) return item.inDate;
  }
  return null;
};

const isAfterByDay = (leftDate, rightDate) => {
  if (!leftDate || !rightDate) return false;
  const left = new Date(leftDate.getFullYear(), leftDate.getMonth(), leftDate.getDate());
  const right = new Date(
    rightDate.getFullYear(),
    rightDate.getMonth(),
    rightDate.getDate()
  );
  return left.getTime() > right.getTime();
};

const computeTrackingFromRecords = ({ ecciNumber, asn, received, mrTransit, ddTransit, ddDo }) => {
  const primarySources = [asn, received, mrTransit, ddTransit, ddDo];
  const giNumbers = [
    received && received.giNumber,
    mrTransit && mrTransit.giNumber,
    ddTransit && ddTransit.giNumber,
    ddDo && ddDo.giNumber,
  ];
  const hasAnyGi = giNumbers.some(Boolean);

  const vendorName = pickValue(primarySources, ["vendorName"], null);
  const deliveryLocation = pickValue(primarySources, [
    "deliveryLocation",
    "deliveryLocationName",
    "pickupLocation",
    "pickupAddress",
    "vendorAddress",
  ]);
  const store = pickValue(primarySources, ["store", "storeName"]);
  const warehouse = pickValue(primarySources, [
    "warehouse",
    "collectionLocation",
    "pickupLocation",
    "pickupAddress",
    "vendorAddress",
  ]);
  let vehicleNumber = pickValue(
    [ddDo, ddTransit, mrTransit, received, asn],
    ["vehicleNumber", "vehicleNo", "vechileNumber"],
    null
  );
  if (!vehicleNumber) {
    for (const src of [ddDo, ddTransit, mrTransit, received, asn]) {
      if (src && src.details && src.details.vehicleNumber) {
        vehicleNumber = src.details.vehicleNumber;
        break;
      }
    }
  }
  if (!vehicleNumber) vehicleNumber = "N/A";

  const collectionLocationCode =
    warehouse && warehouse !== "N/A"
      ? String(warehouse).toUpperCase().includes("JSR")
        ? "JSR"
        : "KOL"
      : "N/A";

  const asnUploadDate = asn ? asn.asnUploadDate : null;
  const plannedDate = increaseDateBy1(asnUploadDate, asn && asn.manual);

  const pickedSource = mrTransit || received || ddTransit || ddDo || null;
  const pickedDate = pickedSource
    ? increaseDateBy1(pickedSource.inDate, pickedSource.manual)
    : null;

  const receivedSource = mrTransit || received || null;
  const receivedDate = receivedSource
    ? increaseDateBy1(receivedSource.inDate, receivedSource.manual)
    : null;

  const dispatchedSource = mrTransit || received || null;
  const dispatchedDate = dispatchedSource
    ? increaseDateBy1(dispatchedSource.transDate, dispatchedSource.manual)
    : null;

  const transDate =
    (mrTransit && mrTransit.transDate) ||
    (received && received.transDate) ||
    (ddDo && ddDo.transDate) ||
    (ddTransit && ddTransit.transDate) ||
    null;
  let deliveryDate = null;
  if (transDate) {
    const stage1 = increaseDateBy1(transDate, false);
    if (stage1) {
      deliveryDate = addDays(stage1, stage1.getDay() === 6 ? 2 : 1);
    }
  }

  let comparisonDate = deliveryDate;
  if (deliveryLocation && String(deliveryLocation).toUpperCase().includes("TSM")) {
    const dispatchFallback = pickSourceDate([mrTransit, received, ddTransit, ddDo, asn]);
    if (dispatchFallback) {
      const parsed = toDate(dispatchFallback);
      comparisonDate = parsed ? addDays(parsed, 3) : comparisonDate;
    } else if (deliveryDate) {
      comparisonDate = addDays(deliveryDate, 3);
    }
  }

  const now = new Date();
  const isDelivered = Boolean(comparisonDate && isAfterByDay(now, comparisonDate));

  const timeline = [
    {
      key: "planned",
      label: "Planned for Picking",
      isVisible: true,
      isComplete: Boolean(asnUploadDate),
      date: plannedDate,
      source: asn ? "asn" : null,
    },
    {
      key: "picked",
      label: "Picked from Vendor Location",
      isVisible: true,
      isComplete: Boolean(pickedSource),
      date: pickedDate,
      source: pickedSource ? "grn" : null,
    },
    {
      key: "receivedAtCrossDock",
      label: "Received at OWM Cross-dock",
      isVisible: !(ddTransit || ddDo),
      isComplete: Boolean(receivedSource),
      date: receivedDate,
      source: receivedSource ? "grn" : null,
    },
    {
      key: "dispatched",
      label: "Dispatched from OWM Cross-dock",
      isVisible: true,
      isComplete: Boolean(hasAnyGi && !(ddTransit || ddDo) && (mrTransit || received)),
      date: dispatchedDate,
      source: dispatchedSource ? "grn" : null,
    },
    {
      key: "delivery",
      label: isDelivered
        ? "Delivered at Tata Steel"
        : "Expected Delivery at Tata Steel",
      isVisible: true,
      isComplete: isDelivered,
      date: comparisonDate,
      source: hasAnyGi ? "computed" : null,
    },
  ];

  let currentStage = "not_found";
  if (isDelivered) currentStage = "delivered";
  else if (hasAnyGi) currentStage = "expected_delivery";
  else if (receivedSource) currentStage = "received";
  else if (pickedSource) currentStage = "picked";
  else if (asnUploadDate) currentStage = "planned";

  return {
    ecciNumber,
    summary: {
      currentStage,
      isDelivered,
      statusLabel: timeline[4].label,
      statusCode: currentStage.toUpperCase(),
    },
    timeline: timeline.map((step) => ({
      ...step,
      date: step.date ? step.date.toISOString() : null,
      displayDate: step.date ? formatShortDate(step.date) : null,
    })),
    dates: {
      asnUploadDate: asnUploadDate ? new Date(asnUploadDate).toISOString() : null,
      pickedDate: pickedDate ? pickedDate.toISOString() : null,
      receivedDate: receivedDate ? receivedDate.toISOString() : null,
      dispatchedDate: dispatchedDate ? dispatchedDate.toISOString() : null,
      expectedDeliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
      actualComparisonDate: comparisonDate ? comparisonDate.toISOString() : null,
      expectedDeliveryDisplay: comparisonDate ? formatShortDate(comparisonDate) : null,
    },
    details: {
      vendorName,
      collectionLocationCode,
      warehouse,
      deliveryLocation,
      store,
      vehicleNumber,
    },
    legacy: {
      giNoForGRN: received && received.giNumber ? received.giNumber : "",
      giNoForDO: mrTransit && mrTransit.giNumber ? mrTransit.giNumber : "",
      giNoForDD: ddTransit && ddTransit.giNumber ? ddTransit.giNumber : "",
      giNoForDODD: ddDo && ddDo.giNumber ? ddDo.giNumber : "",
    },
    sources: {
      asnId: asn ? String(asn._id) : null,
      receivedId: received ? String(received._id) : null,
      mrTransitId: mrTransit ? String(mrTransit._id) : null,
      ddTransitId: ddTransit ? String(ddTransit._id) : null,
      ddDoId: ddDo ? String(ddDo._id) : null,
    },
    meta: {
      computedAt: new Date().toISOString(),
      rulesVersion: "trackstatus-v1",
    },
  };
};

const findOneLatest = (model, filter) => model.findOne(filter).sort({ date: -1 }).lean();

const getTrackingByEcci = async (ecciNumber) => {
  const asn = await findOneLatest(Asn, { ecciNumber });
  const received = await findOneLatest(Grn, {
    ecciNumber,
    transactionType: "GRN",
    modeOfDelivery: "MILK RUN",
  });
  const mrTransit = await findOneLatest(Grn, {
    ecciNumber,
    transactionType: "DO",
    modeOfDelivery: "MILK RUN",
  });
  const ddTransit = await findOneLatest(Grn, {
    ecciNumber,
    transactionType: "GRN",
    modeOfDelivery: "DIRECT DELIVERY",
  });
  const ddDo = await findOneLatest(Grn, {
    ecciNumber,
    transactionType: "DO",
    modeOfDelivery: "DIRECT DELIVERY",
  });

  const payload = computeTrackingFromRecords({
    ecciNumber,
    asn,
    received,
    mrTransit,
    ddTransit,
    ddDo,
  });

  let gpsDiagnostic = null;
  const onGpsDiagnostic = (diagnostic) => {
    gpsDiagnostic = diagnostic;
    console.info("[OWM GPS] Lookup result:", JSON.stringify({ ecciNumber, ...diagnostic }));
  };

  try {
    payload.location = await getCurrentVehicleLocation(payload.details.vehicleNumber, {
      onDiagnostic: onGpsDiagnostic,
    });
  } catch (error) {
    // GPS availability must not prevent the rest of the shipment status loading.
    gpsDiagnostic = error.gpsDiagnostic || { code: "GPS_LOOKUP_FAILED" };
    console.error(
      "[OWM GPS] Location lookup failed:",
      JSON.stringify({ ecciNumber, ...gpsDiagnostic, message: error.message })
    );
    payload.location = null;
  }

  // Diagnostics are opt-in because they can contain a shipment vehicle identifier.
  if (process.env.GPS_DEBUG === "true") payload.gpsDebug = gpsDiagnostic;

  return payload;
};

module.exports = {
  getTrackingByEcci,
  computeTrackingFromRecords,
  formatShortDate,
  increaseDateBy1,
};
