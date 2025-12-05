const invModel = require("../models/inventory-model") // CORRECTED import path
const reviewModel = require("../models/reviewModel")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 * Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)
    
    // Check if data was found
    if (!data || data.length === 0) {
        let nav = await utilities.getNav();
        res.status(404).render("errors/error", {
            title: "404 Not Found",
            message: `Sorry, no vehicles found for classification ID: ${classification_id}.`,
            nav,
            errors: null, // Ensure errors is passed to the error view
        });
        return;
    }
    
    const grid = await utilities.buildClassificationGrid(data)
    let nav = await utilities.getNav()
    const className = data[0].classification_name
    res.render("./inventory/classification", {
        title: className + " vehicles",
        nav,
        grid,
        errors: null, // Ensure errors is passed
    })
}

/* ****************************************
 * Deliver inventory item detail view
 * (Updated to fetch and pass review data)
 * **************************************** */
invCont.buildByInvId = async function(req, res, next) {
    const inv_id = req.params.invId;
    
    // FIX: Assign the result directly to 'inventory'. 
    // This assumes getInventoryById returns the single object or null.
    const inventory = await invModel.getInventoryById(inv_id); 

    // 1. CRITICAL FIX: Check if the item exists immediately.
    if (!inventory) {
        let nav = await utilities.getNav();
        req.flash("notice", "Sorry, we could not find the requested vehicle.");
        res.status(404).render("errors/error", {
            title: "Vehicle Not Found",
            message: "Sorry, we could not find the requested vehicle.",
            nav,
            errors: null,
        });
        return;
    }
    
    // Now we know 'inventory' exists, we can safely access its properties
    const itemName = `${inventory.inv_make} ${inventory.inv_model}`;
    
    // Fetch and build reviews
    const reviews = await reviewModel.getReviewsByInventoryId(inv_id) 
    const reviewDisplay = await utilities.buildReviewDisplay(reviews)

    // Build the formatted HTML for the vehicle details (description, price, etc.)
    const detailHTML = await utilities.buildItemDetailHTML(inventory); 

    let nav = await utilities.getNav();
    
    // Pass the item data, the formatted detail HTML, and the review display
    res.render("./inventory/detail", {
        title: itemName + " Details",
        nav,
        inventory, // Raw data for dynamic use (e.g., in the review form)
        detailHTML, // Formatted HTML for display
        reviewDisplay, 
        errors: null,
        // Spread operator includes any submitted data (review_text, review_rating) 
        // for sticky forms/validation failures
        ...req.body,
    });
}


/* ***************************
 * Task 1: Deliver Management View 
 * Route: /inv/
 * ************************** */
invCont.buildManagement = async function (req, res) {
    let nav = await utilities.getNav()
    res.render("inventory/management", {
        title: "Inventory Management",
        nav,
        errors: null,
    })
}

/* ***************************
 * Task 2: Deliver Add Classification View
 * Route: /inv/add-classification
 * ************************** */
invCont.buildAddClassification = async function (req, res) {
    let nav = await utilities.getNav()
    res.render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null,
        classification_name: "", // Initialize empty for sticky form
    })
}

/* ***************************
 * Task 2: Process Add New Classification
 * Route: /inv/add-classification (POST)
 * ************************** */
invCont.processAddClassification = async function (req, res) {
    const { classification_name } = req.body
    const classificationResult = await invModel.addClassification(classification_name)

    if (classificationResult && classificationResult.rowCount > 0) {
        req.flash("notice", `New classification ${classification_name} added successfully.`)
        let nav = await utilities.getNav() // Rebuild nav for immediate display
        res.status(201).render("inventory/management", {
            title: "Inventory Management",
            nav,
            errors: null,
        })
    } else {
        req.flash("notice", "Sorry, adding the classification failed.")
        let nav = await utilities.getNav()
        res.status(501).render("inventory/add-classification", {
            title: "Add New Classification",
            nav,
            errors: null,
            classification_name,
        })
    }
}

/* ***************************
 * Task 3: Deliver Add Inventory View
 * Route: /inv/add-inventory
 * ************************** */
invCont.buildAddInventory = async function (req, res) {
    let nav = await utilities.getNav()
    let classificationList = await utilities.buildClassificationList() 
    
    res.render("inventory/add-inventory", {
        title: "Add New Inventory Item",
        nav,
        errors: null,
        classificationList,
        // Initialize empty or default values for sticky form fields
        inv_make: "", inv_model: "", inv_description: "", inv_price: "", 
        inv_year: "", inv_miles: "", inv_color: "", 
        inv_image: "/images/vehicles/no-image.png", 
        inv_thumbnail: "/images/vehicles/no-image-tn.png",
    })
}

/* ***************************
 * Task 3: Process Add New Inventory Item
 * Route: /inv/add-inventory (POST)
 * ************************** */
invCont.processAddInventory = async function (req, res) {
    const { 
        inv_make, inv_model, inv_description, inv_image, inv_thumbnail, 
        inv_price, inv_year, inv_miles, inv_color, classification_id 
    } = req.body
    
    const invResult = await invModel.addInventory(
        inv_make, inv_model, inv_description, inv_image, inv_thumbnail, 
        inv_price, inv_year, inv_miles, inv_color, classification_id
    )

    if (invResult && invResult.rowCount > 0) {
        req.flash("notice", `New vehicle ${inv_make} ${inv_model} added successfully to inventory.`)
        let nav = await utilities.getNav()
        // Redirect to the management view on success
        res.status(201).render("inventory/management", {
            title: "Inventory Management",
            nav,
            errors: null,
        })
    } else {
        req.flash("notice", "Sorry, adding the vehicle failed.")
        let nav = await utilities.getNav()
        let classificationList = await utilities.buildClassificationList(Number(classification_id))

        res.status(501).render("inventory/add-inventory", {
            title: "Add New Inventory Item",
            nav,
            errors: null,
            classificationList,
            // Pass back all entered values (sticky form)
            inv_make, inv_model, inv_description, inv_price, 
            inv_year, inv_miles, inv_color, inv_image, inv_thumbnail,
        })
    }
}

// Export the entire invCont object
module.exports = invCont;