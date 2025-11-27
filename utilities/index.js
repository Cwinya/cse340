const invModel = require("../models/inventory-model")
const { body, validationResult } = require("express-validator"); 
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (_req, _res, _next) {
    let data = await invModel.getClassifications()
    // NOTE: data.rows is correct here based on typical pg pool query results
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'
    data.rows.forEach((row) => {
        list += "<li>"
        list +=
        '<a href="/inv/type/' + // Use absolute path
        row.classification_id +
        '" title="See our inventory of ' +
        row.classification_name +
        ' vehicles">' +
        row.classification_name +
        "</a>"
        list += "</li>"
    })
    list += "</ul>"
    return list
}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
    let grid
    if(data.length > 0){
        grid = '<ul id="inv-display">'
        data.forEach(vehicle => { 
            const detailUrl = '/inv/detail/' + vehicle.inv_id;
            const cardTitle = 'View ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' details';

            grid += '<li>'
            
            // --- START: Single Anchor Tag Wrapping ALL Card Content ---
            // This entire block is now the clickable link.
            grid += 	'<a href="' + detailUrl + '" title="' + cardTitle + '">'
            
            // 1. Image
            grid += 	'<img src="' + vehicle.inv_thumbnail 
            + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model 
            + ' on CSE Motors" />'
            
            // 2. Name and Price Block
            grid += '<div class="namePrice">'
            grid += '<hr />'
            grid += '<h2>'
            // Title text
            grid += 	vehicle.inv_make + ' ' + vehicle.inv_model
            grid += '</h2>'
            
            // Price text
            grid += '<span>' 
            + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(vehicle.inv_price) + 
            '</span>'
            
            grid += '</div>'
            
            // --- END: Close the Single Anchor Tag ---
            grid += '</a>'

            grid += '</li>'
        })
        grid += '</ul>'
    } else { 
        grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
    }
    return grid
}

/* ****************************************
 * Build the HTML for the item detail view
 * *************************************** */
Util.buildItemDetail = async function(item) {  
  // Helper to format price to USD
  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.inv_price);

  // Helper to format mileage with commas
  const mileageFormatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    useGrouping: true,
  }).format(item.inv_miles);

  let detailView = '<div class="item-detail-container">';

  // Image and Description/Details for side-by-side layout
  detailView += '<div class="detail-content-wrapper">';

  // --- Image Section ---
  detailView += '<div class="detail-image-area">';
  // Use the full-size image path
  detailView += `<img src="${item.inv_image}" alt="${item.inv_make} ${item.inv_model} on sale" class="detail-image">`; 
  detailView += '</div>';

  // --- Details Section ---
  detailView += '<div class="detail-info-area">';
  detailView += `<h2 class="detail-heading">${item.inv_make} ${item.inv_model}</h2>`; 

  detailView += '<div class="prominent-details">';
  detailView += `
    <div class="detail-item price-block">
        <p class="label">Our Price</p>
        <p class="value price">${priceFormatted}</p>
    </div>
    <div class="detail-item">
        <p class="label">Model Year</p>
        <p class="value year">${item.inv_year}</p>
    </div>
    <div class="detail-item">
        <p class="label">Mileage</p>
        <p class="value mileage">${mileageFormatted}</p>
    </div>`;
  detailView += '</div>'; // End prominent-details

  // --- Descriptive Data ---
  detailView += '<div class="descriptive-data">';
  detailView += `<h3>Vehicle Specifications</h3>`;
  detailView += `
    <dl>
        <dt>Make</dt>
        <dd>${item.inv_make}</dd>
        <dt>Model</dt>
        <dd>${item.inv_model}</dd>
        <dt>Color</dt>
        <dd>${item.inv_color}</dd>
        <dt>Description</dt>
        <dd>${item.inv_description}</dd>
    </dl>`;
  detailView += '</div>'; // End descriptive-data

  detailView += '</div>'; // End detail-info-area
  detailView += '</div>'; // End detail-content-wrapper

  detailView += '</div>'; // End item-detail-container

  return detailView;
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)


// WEEK 4
/* ************************
 * Constructs the Classification List HTML
 * for the Add Inventory Form (Task 3)
 * *********************** */
Util.buildClassificationList = async function (classification_id = null) {
  let data = await invModel.getClassifications()
  let classificationList =
    '<select name="classification_id" id="classificationList" required>'
  classificationList += "<option value=''>Choose a Classification</option>"
  
  // Use data.rows if your model returns an array of row objects
  data.rows.forEach((row) => { 
    classificationList += `<option value="${row.classification_id}"`
    if (
      classification_id != null &&
      row.classification_id == classification_id
    ) {
      classificationList += " selected "
    }
    classificationList += `>${row.classification_name}</option>`
  })
  classificationList += "</select>"
  return classificationList
}

/* ****************************************
 * Validation Rules for New Classification
 * *************************************** */
Util.classificationRules = () => {
    // This array of validations is what gets returned to the router.
    // Express-Validator automatically looks for fields in req.body.
    return [
        // Classification name is required and must be alphanumeric (no spaces/symbols)
        body("classification_name")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a classification name.") 
            .isAlphanumeric() // Ensures only letters and numbers (no spaces, dashes, etc.)
            .withMessage("Classification name must contain only letters and numbers and cannot have spaces.")
            .escape(), // Sanitize input
    ];
};

/* ****************************************
 * Check Classification Data
 * *************************************** */
Util.checkClassificationData = async (req, res, next) => {
    const { classification_name } = req.body;
    let nav = await Util.getNav(); // Assuming getNav is available in your full utilities file
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        let className = classification_name || '';
        // If validation fails, re-render the form with errors
        res.render("inventory/add-classification", {
            errors: errors.array(),
            title: "Add New Classification",
            nav,
            className
        });
        return;
    }
    next();
};

/* ****************************************
 * Validation Rules for New Inventory Item
 * *************************************** */
Util.inventoryRules = () => {
    return [
        // classification_id is required and must be an integer
        body("classification_id")
            .isInt({ min: 1 })
            .withMessage("Please select a valid classification."),

        // inv_make is required
        body("inv_make")
            .trim()
            .isLength({ min: 3 })
            .withMessage("Please provide a vehicle make (min 3 characters).")
            .escape(),

        // inv_model is required
        body("inv_model")
            .trim()
            .isLength({ min: 3 })
            .withMessage("Please provide a vehicle model (min 3 characters).")
            .escape(),

        // inv_description is required
        body("inv_description")
            .trim()
            .isLength({ min: 10 })
            .withMessage("Please provide a vehicle description (min 10 characters).")
            .escape(),
            
        // inv_image is required
        body("inv_image")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide an image path.")
            .matches(/^\/images\/vehicles\//) // Simple check for a specific path format
            .withMessage("Image path must start with /images/vehicles/"),

        // inv_thumbnail is required
        body("inv_thumbnail")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a thumbnail path.")
            .matches(/^\/images\/vehicles\//) // Simple check for a specific path format
            .withMessage("Thumbnail path must start with /images/vehicles/"),

        // inv_price is required and must be a number
        body("inv_price")
            .trim()
            .isFloat({ min: 0 })
            .withMessage("Please provide a valid price (must be a positive number).")
            .escape(),

        // inv_year is required and must be a 4-digit number
        body("inv_year")
            .trim()
            .isLength({ min: 4, max: 4 })
            .withMessage("Please provide a 4-digit year.")
            .isInt()
            .withMessage("Year must be a number.")
            .escape(),

        // inv_miles is required and must be an integer
        body("inv_miles")
            .trim()
            .isInt({ min: 0 })
            .withMessage("Please provide a valid mileage (must be an integer).")
            .escape(),

        // inv_color is required
        body("inv_color")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a vehicle color.")
            .escape(),
    ];
};

/* ****************************************
 * Check Inventory Item Data
 * *************************************** */
Util.checkInventoryData = async (req, res, next) => {
    const { 
      classification_id, inv_make, inv_model, 
      inv_description, inv_image, inv_thumbnail, 
      inv_price, inv_year, inv_miles, inv_color 
    } = req.body;

    let nav = await Util.getNav(); // Assuming getNav is available in your full utilities file
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // If validation fails, re-render the form with errors
      res.render("inventory/add-inventory", {
          errors: errors.array(),
          title: "Add New Inventory Item",
          nav,
          // Pass back previously entered values
          classification_id, inv_make, inv_model, 
          inv_description, inv_image, inv_thumbnail, 
          inv_price, inv_year, inv_miles, inv_color
        });
        return;
    }
    next();
};

module.exports = Util; 