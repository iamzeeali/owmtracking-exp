const Feedback = require("../models/feedbackModel");
const factory = require("./handlerFactory");
// const APIFeatures = require("../utils/apiFeatures");

exports.createFeedback = factory.createOne(Feedback);
exports.getAllFeedbacks = factory.getAll(Feedback);
