const express = require("express");
const trackingController = require("../controllers/trackingController");

const router = express.Router();

router.route("/:ecciNumber").get(trackingController.getTrackingStatusByEcci);

module.exports = router;
