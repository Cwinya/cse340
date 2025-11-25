// Needed Resources 
const express = require("express")
const router = new express.Router() 
// This variable name is used consistently below: invController
const invController = require("../controllers/invController") 
const utilities = require("../utilities/");

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route to build the specific inventory item detail view
// This handles the URL /inv/detail/:invId (or /inv/detail/5)
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInvId));

// Task 3: Intentional 500-error route
// router.get("/trigger-error", utilities.handleErrors(invController.throwIntentionalError));

module.exports = router;