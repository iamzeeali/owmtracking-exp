const express = require("express");
const authController = require("../controllers/authController");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.use(authController.protect);

router.route("/").get(reportController.getReport);
router.route("/material-age").get(reportController.getMaterialAgeReport);
router.route("/dispatch").get(reportController.getDispatchReport);
router.route("/collection").get(reportController.getCollectionReport);
router.route("/operations-summary").get(reportController.getOperationsSummary);

module.exports = router;
