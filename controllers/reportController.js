const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");

const AsnModel = mongoose.model("ASN");
const GrnModel = mongoose.model("GRN");

const DAY_MS = 1000 * 60 * 60 * 24;
const SUMMARY_CACHE_TTL_MS = 60 * 1000;

let summaryCache = null;
let summaryCacheTime = 0;

const buildDateFilter = (period, fromDate, toDate) => {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (fromDate || toDate) {
    if (fromDate) startDate = new Date(fromDate);
    if (toDate) {
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }
  } else if (period === "weekly") {
    startDate = new Date(now.getTime() - 7 * DAY_MS);
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "date") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  const range = {};
  if (startDate && !Number.isNaN(startDate.getTime())) range.$gte = startDate;
  if (endDate && !Number.isNaN(endDate.getTime())) range.$lte = endDate;
  return range;
};

const clampLimit = (raw, fallback, max) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
};

const safeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + value * DAY_MS);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;
  return null;
};

const dayLabel = (d) => {
  if (!d) return null;
  const dt = safeDate(d);
  if (!dt) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

exports.getMaterialAgeReport = catchAsync(async (req, res) => {
  const dateRange = buildDateFilter(req.query.period, req.query.fromDate, req.query.toDate);
  const limit = clampLimit(req.query.limit, 2000, 10000);

  const matchStage = { ecciNumber: { $nin: [null, ""] } };
  if (req.query.warehouse) matchStage.warehouse = req.query.warehouse;
  if (Object.keys(dateRange).length) matchStage.asnUploadDate = dateRange;

  const asnDocs = await AsnModel.collection
    .find(matchStage, {
      projection: { ecciNumber: 1, asnUploadDate: 1, vendorName: 1, warehouse: 1, deliveryLocation: 1, vehicleNumber: 1 },
    })
    .sort({ asnUploadDate: -1 })
    .limit(limit)
    .toArray();

  if (!asnDocs.length) {
    return res.status(200).json({ status: "success", results: 0, data: [] });
  }

  const ecciList = [...new Set(asnDocs.map((d) => d.ecciNumber).filter(Boolean))];

  const grnDocs = await GrnModel.collection
    .find(
      { ecciNumber: { $in: ecciList }, transDate: { $ne: null } },
      { projection: { ecciNumber: 1, transDate: 1, deliveryLocation: 1, vehicleNumber: 1 } }
    )
    .sort({ transDate: -1 })
    .toArray();

  const grnByEcci = new Map();
  grnDocs.forEach((g) => {
    if (!g.ecciNumber || !g.transDate) return;
    if (!grnByEcci.has(g.ecciNumber)) grnByEcci.set(g.ecciNumber, g);
  });

  const rows = [];
  asnDocs.forEach((asn) => {
    const dispatch = grnByEcci.get(asn.ecciNumber);
    if (!dispatch) return;
    const receivedAt = safeDate(asn.asnUploadDate);
    const dispatchedAt = safeDate(dispatch.transDate);
    if (!receivedAt || !dispatchedAt) return;
    const ageInDays = (dispatchedAt.getTime() - receivedAt.getTime()) / DAY_MS;
    if (ageInDays < 0) return;

    rows.push({
      ecciNumber: asn.ecciNumber,
      vendorName: asn.vendorName || "",
      warehouse: asn.warehouse || "",
      deliveryLocation: dispatch.deliveryLocation || asn.deliveryLocation || "",
      transporter: dispatch.vehicleNumber || asn.vehicleNumber || "",
      receivedAt,
      dispatchedAt,
      ageInDays: Number(ageInDays.toFixed(2)),
    });
  });

  res.status(200).json({ status: "success", results: rows.length, data: rows });
});

exports.getDispatchReport = catchAsync(async (req, res) => {
  const dateRange = buildDateFilter(req.query.period, req.query.fromDate, req.query.toDate);
  const limit = clampLimit(req.query.limit, 3000, 10000);

  const filter = { active: { $ne: false } };
  if (req.query.deliveryPlant) filter.deliveryLocation = req.query.deliveryPlant;
  if (req.query.transporter) filter.vehicleNumber = req.query.transporter;
  if (Object.keys(dateRange).length) filter.transDate = dateRange;

  const docs = await GrnModel.collection
    .find(filter, {
      projection: { ecciNumber: 1, giNumber: 1, transactionType: 1, modeOfDelivery: 1, vendorName: 1, deliveryLocation: 1, vehicleNumber: 1, transDate: 1, warehouse: 1 },
    })
    .sort({ transDate: -1 })
    .limit(limit)
    .toArray();

  const data = docs.map((r) => ({
    ecciNumber: r.ecciNumber || "",
    giNumber: r.giNumber || "",
    transactionType: r.transactionType || "",
    modeOfDelivery: r.modeOfDelivery || "",
    vendorName: r.vendorName || "",
    deliveryPlant: r.deliveryLocation || "",
    transporter: r.vehicleNumber || "",
    dispatchDate: r.transDate || null,
    warehouse: r.warehouse || "",
  }));

  res.status(200).json({ status: "success", results: data.length, data });
});

exports.getCollectionReport = catchAsync(async (req, res) => {
  const dateRange = buildDateFilter(req.query.period, req.query.fromDate, req.query.toDate);
  const limit = clampLimit(req.query.limit, 3000, 10000);

  const filter = { active: { $ne: false } };
  if (req.query.zone) filter.warehouse = req.query.zone;
  if (req.query.vendor) filter.vendorName = req.query.vendor;
  if (req.query.transporter) filter.vehicleNumber = req.query.transporter;
  if (Object.keys(dateRange).length) filter.inDate = dateRange;

  const docs = await GrnModel.collection
    .find(filter, {
      projection: { ecciNumber: 1, vendorName: 1, vendorCode: 1, warehouse: 1, vehicleNumber: 1, inDate: 1, deliveryLocation: 1, transactionType: 1 },
    })
    .sort({ inDate: -1 })
    .limit(limit)
    .toArray();

  const data = docs.map((r) => ({
    ecciNumber: r.ecciNumber || "",
    vendorName: r.vendorName || "",
    vendorCode: r.vendorCode || "",
    zone: r.warehouse || "",
    transporter: r.vehicleNumber || "",
    pickedDate: r.inDate || null,
    deliveryPlant: r.deliveryLocation || "",
    transactionType: r.transactionType || "",
  }));

  res.status(200).json({ status: "success", results: data.length, data });
});

exports.getReport = catchAsync(async (req, res, next) => {
  const type = (req.query.type || "").toString().trim().toLowerCase();

  if (type === "material-age") return exports.getMaterialAgeReport(req, res, next);
  if (type === "dispatch") return exports.getDispatchReport(req, res, next);
  if (type === "collection") return exports.getCollectionReport(req, res, next);

  return res.status(400).json({
    status: "fail",
    message: "Invalid report type. Use material-age, dispatch, or collection.",
  });
});

exports.getOperationsSummary = catchAsync(async (req, res) => {
  if (summaryCache && Date.now() - summaryCacheTime < SUMMARY_CACHE_TTL_MS) {
    return res.status(200).json(summaryCache);
  }

  const emptyResponse = {
    status: "success",
    data: {
      totals: {
        totalShipments: 0,
        inTransitShipments: 0,
        deliveredShipments: 0,
        pendingOrders: 0,
        avgDeliveryTimeDays: null,
        activeWarehouses: 0,
        activeVehicles: 0,
      },
      statusBreakdown: {},
      volumeLast7Days: [],
      generatedAt: new Date().toISOString(),
    },
  };

  let result;
  try {
    result = await computeOperationsSummary();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("OPERATIONS_SUMMARY_ERROR", err && err.message ? err.message : err);
    summaryCache = emptyResponse;
    summaryCacheTime = Date.now();
    return res.status(200).json(emptyResponse);
  }

  const response = {
    status: "success",
    data: result,
  };

  summaryCache = response;
  summaryCacheTime = Date.now();
  return res.status(200).json(response);
});

async function computeOperationsSummary() {
  const asnCol = AsnModel.collection;
  const grnCol = GrnModel.collection;
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * DAY_MS);

  const [asnGrouped, grnGrouped] = await Promise.all([
    asnCol
      .aggregate([
        { $match: { ecciNumber: { $nin: [null, ""] } } },
        { $group: { _id: "$ecciNumber", latestAsnUploadDate: { $max: "$asnUploadDate" } } },
      ])
      .toArray(),
    grnCol
      .aggregate([
        { $match: { ecciNumber: { $nin: [null, ""] } } },
        {
          $group: {
            _id: "$ecciNumber",
            hasMovement: { $sum: 1 },
            latestDispatchDate: { $max: "$transDate" },
            giSample: { $first: "$giNumber" },
          },
        },
      ])
      .toArray(),
  ]);

  const asnMap = new Map();
  asnGrouped.forEach((r) => asnMap.set(r._id, r));

  const grnMap = new Map();
  grnGrouped.forEach((r) => {
    r.hasGi = Boolean(r.giSample && String(r.giSample).trim());
    grnMap.set(r._id, r);
  });

  const allEccis = new Set([...asnMap.keys(), ...grnMap.keys()]);

  const counts = { delivered: 0, expected_delivery: 0, picked: 0, planned: 0, unknown: 0 };
  let totalAge = 0;
  let ageCount = 0;

  allEccis.forEach((ecci) => {
    const asn = asnMap.get(ecci);
    const grn = grnMap.get(ecci);
    const hasAsn = Boolean(asn && asn.latestAsnUploadDate);
    const hasMovement = Boolean(grn && grn.hasMovement > 0);
    const hasGi = Boolean(grn && grn.hasGi);
    const dispDate = safeDate(grn && grn.latestDispatchDate);
    const asnDate = safeDate(asn && asn.latestAsnUploadDate);

    let stage = "unknown";
    if (hasGi) {
      const elapsed = dispDate ? (now - dispDate.getTime()) / DAY_MS : 0;
      stage = elapsed > 2 ? "delivered" : "expected_delivery";
    } else if (hasMovement) {
      stage = "picked";
    } else if (hasAsn) {
      stage = "planned";
    }
    counts[stage] = (counts[stage] || 0) + 1;

    if (asnDate && dispDate) {
      const age = (dispDate.getTime() - asnDate.getTime()) / DAY_MS;
      if (age >= 0) {
        totalAge += age;
        ageCount += 1;
      }
    }
  });

  let activeWarehouses = 0;
  let activeVehicles = 0;
  try {
    const [wh, vh] = await Promise.all([
      grnCol.distinct("warehouse", { warehouse: { $nin: [null, ""] } }),
      grnCol.distinct("vehicleNumber", { vehicleNumber: { $nin: [null, ""] } }),
    ]);
    activeWarehouses = wh.length;
    activeVehicles = vh.length;
  } catch (_) {
    /* non-critical */
  }

  let volumeLast7Days = [];
  try {
    const [recentAsns, recentGrns] = await Promise.all([
      asnCol.find({ date: { $gte: sevenDaysAgo } }, { projection: { date: 1 } }).toArray(),
      grnCol.find({ transDate: { $gte: sevenDaysAgo } }, { projection: { transDate: 1 } }).toArray(),
    ]);

    const volMap = new Map();
    recentAsns.forEach((r) => {
      const key = dayLabel(r.date);
      if (!key) return;
      if (!volMap.has(key)) volMap.set(key, { day: key, asnCount: 0, dispatchCount: 0 });
      volMap.get(key).asnCount += 1;
    });
    recentGrns.forEach((r) => {
      const key = dayLabel(r.transDate);
      if (!key) return;
      if (!volMap.has(key)) volMap.set(key, { day: key, asnCount: 0, dispatchCount: 0 });
      volMap.get(key).dispatchCount += 1;
    });
    volumeLast7Days = Array.from(volMap.values()).sort((a, b) => a.day.localeCompare(b.day));
  } catch (_) {
    /* non-critical */
  }

  return {
    totals: {
      totalShipments: allEccis.size,
      inTransitShipments: counts.expected_delivery + counts.picked,
      deliveredShipments: counts.delivered,
      pendingOrders: counts.planned,
      avgDeliveryTimeDays:
        ageCount > 0 ? Number((totalAge / ageCount).toFixed(2)) : null,
      activeWarehouses,
      activeVehicles,
    },
    statusBreakdown: counts,
    volumeLast7Days,
    generatedAt: new Date().toISOString(),
  };
}
