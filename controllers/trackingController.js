const catchAsync = require("../utils/catchAsync");
const trackingStatusService = require("../services/trackingStatusService");

exports.getTrackingStatusByEcci = catchAsync(async (req, res) => {
  const payload = await trackingStatusService.getTrackingByEcci(req.params.ecciNumber);

  res.status(200).json({
    status: "success",
    data: payload,
  });
});
