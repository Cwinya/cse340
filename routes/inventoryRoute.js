// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController") 
const utilities = require("../utilities/");

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route to build the specific inventory item detail view
// This handles the URL /inv/detail/:invId (or /inv/detail/5)
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInvId));

// Task 3: Intentional 500-error route
// router.get("/trigger-error", utilities.handleErrors(invController.throwIntentionalError));

// ****************************************
// TASK 1: Route to deliver Inventory Management View
// ****************************************
router.get("/", utilities.handleErrors(invController.buildManagement));

// ****************************************
// TASK 2: Add New Classification Routes
// ****************************************
// GET route to deliver the add classification form
router.get("/add-classification", utilities.handleErrors(invController.buildAddClassification));

// POST route to process the new classification data
router.post(
    "/add-classification", 
    utilities.classificationRules(),
    utilities.checkClassificationData,
    utilities.handleErrors(invController.processAddClassification)
);

// ****************************************
// TASK 3: Add New Inventory Item Routes
// ****************************************
// GET route to deliver the add inventory form
router.get("/add-inventory", utilities.handleErrors(invController.buildAddInventory));

// POST route to process the new inventory item data
router.post(
    "/add-inventory", 
    utilities.inventoryRules(),
    utilities.checkInventoryData,
    utilities.handleErrors(invController.processAddInventory)
);

module.exports = router;