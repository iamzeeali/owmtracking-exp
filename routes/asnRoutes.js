const multer = require("multer");
const express = require("express");
const ASN = require("../models/asnModel");
const asnController = require("../controllers/asnController");
const authController = require("../controllers/authController");

const excelToJson = require("convert-excel-to-json");
const router = express.Router();
router.route("/").get(asnController.getAllAsns);

//Protect all routes after this middleware
router.use(authController.protect);

global.__basedir = __dirname;

// -> Multer Upload Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// -> Express Upload RestAPIs
router.route("/").post(upload.single("ecciFile"), (req, res) => {
  if (req.file && req.file.originalname === "asn_rep22246.xlsx") {
    convertEcciExcelToJson(
      __basedir + "/uploads/" + req.file.filename,
      req.user
    );
    res.json({
      msg: "File uploaded/import successfully!",
      file: req.file,
    });
  } else {
    res.status(500).send("Incorrect Document");
  }
});

// -> Import Excel File to MongoDB database
function convertEcciExcelToJson(filePath, user) {
  // console.log(user);
  // -> Read Excel File to Json Data
  const excelData = excelToJson({
    sourceFile: filePath,
    sheets: [
      {
        // Excel Sheet Name
        name: "Sheet1",

        // Header Row -> be skipped and will not be present at our result object.
        header: {
          rows: 1,
        },

        // Mapping columns to keys
        columnToKey: {
          A: "ecciNumber",
          D: "asnUploadDate",
          I: "vendorCode",
          J: "vendorName",
        },
      },
    ],
  });

  // -> Add user details
  var asnData = excelData.Sheet1.map(function (el) {
    var o = Object.assign({}, el);
    o.user = user._id;
    return o;
  });

  ASN.insertMany(asnData, function (err, docs) {
    if (err) {
      return console.error(err);
    } else {
      console.log("Multiple documents inserted to Collection");
    }
  });
}
router.route("/create").post(asnController.createAsn);
router.route("/limited").get(asnController.getLimitedAsns);

module.exports = router;
