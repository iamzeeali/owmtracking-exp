const Grn = require("../models/grnModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllGrns = factory.getAll(Grn);
exports.createGrn = catchAsync(async (req, res, next) => {
  const newGrn = new Grn({
    ecciNumber: req.body.ecciNumber,
    giNumber: req.body.giNumber,
    transactionType: req.body.transactionType,
    modeOfDelivery: req.body.modeOfDelivery,
    inDate: req.body.inDate,
    transDate: req.body.transDate,
    vendorCode: req.body.vendorCode,
    warehouse: req.body.warehouse,
    deliveryLocation: req.body.deliveryLocation,
    vehicleNumber: req.body.vehicleNumber,
    store: req.body.store,
    vendorName: req.body.vendorName,
    manual: req.body.manual,
    user: req.user.id,
  });

  const doc = await newGrn.save();

  res.status(201).json({
    status: "success",
    data: doc,
  });
});

exports.getLimitedGrns = catchAsync(async (req, res, next) => {
  const numberOfDaysToLookBack = 7;

  const features = await new APIFeatures(
    Grn.find({
      date: {
        $gte: new Date(
          new Date().getTime() - numberOfDaysToLookBack * 24 * 60 * 60 * 1000
        ),
      },
    }),
    req.query
  ).sort({
    date: -1,
  });

  const docs = await features.query;
  res.status(200).json({
    status: "success",
    result: docs.length,
    data: {
      data: docs,
    },
  });
});

exports.getGrn = factory.getOne(Grn);
exports.updateGrn = factory.updateOne(Grn);
exports.deleteGrn = factory.deleteOne(Grn);
