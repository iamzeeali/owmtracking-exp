const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  vendorCode: {
    type: String,
  },
  vendorName: {
    type: String,
  },
  subject: {
    type: String,
  },
  message: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

module.exports = Feedback = mongoose.model("Feedback", feedbackSchema);
