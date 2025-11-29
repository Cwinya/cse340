const invModel = require("../models/inventory-model")
const accountModel = require("../models/accountModel")
const { body, validationResult } = require("express-validator"); 
const jwt = require("jsonwebtoken")
require("dotenv").config()
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
            grid +=     '<a href="' + detailUrl + '" title="' + cardTitle + '">'
            
            // 1. Image
            grid +=     '<img src="' + vehicle.inv_thumbnail 
            + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model 
            + ' on CSE Motors" />'
            
            // 2. Name and Price Block
            grid += '<div class="namePrice">'
            grid += '<hr />'
            grid += '<h2>'
            // Title text
            grid +=     vehicle.inv_make + ' ' + vehicle.inv_model
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
    let nav = await Util.getNav(); // Correct reference
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

    let nav = await Util.getNav(); // Correct reference
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

// WEEK 5

/* ****************************************
 * Validation Rules for Login
 * *************************************** */
Util.loginRules = () => {
    return [
        // valid email is required
        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail() 
            .withMessage("A valid email is required."),

        // password is required
        body("account_password")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Password is required."),
    ]
}

/* ****************************************
 * Check login data and return errors or continue to login
 * *************************************** */
Util.checkLoginData = async (req, res, next) => {
    const { account_email } = req.body
    let errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        let nav = await Util.getNav() // **FIXED: Changed utilities.getNav to Util.getNav**
        res.render("account/login", {
            errors,
            title: "Login",
            nav,
            account_email,
        })
        return
    }
    next()
}

/* ****************************************
 * Middleware to check token validity (Task 1, 3, 5 Prep)
 * Makes account data available in res.locals
 **************************************** */
Util.checkLogin = (req, res, next) => {
    if (req.cookies.jwt) {
        jwt.verify(
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            function (err, accountData) {
                if (err) {
                    req.flash("notice", "Please log in.")
                    res.clearCookie("jwt") // Clear invalid cookie
                    return res.redirect("/account/login")
                }
                res.locals.accountData = accountData
                res.locals.loggedin = 1
                next()
            })
    } else {
        // User is not logged in, but proceed
        res.locals.loggedin = 0
        next()
    }
}


/* ****************************************
 * Middleware to check authorization (Task 2)
 * Ensures account is "Admin" or "Employee"
 **************************************** */
Util.checkAdminOrEmployee = (req, res, next) => {
    if (res.locals.loggedin) {
        const accountType = res.locals.accountData.account_type
        if (accountType === "Admin" || accountType === "Employee") {
            next() // Authorized
            return
        }
    }
    // Not logged in or unauthorized account type
    req.flash("notice", "You are not authorized to access this page.")
    return res.redirect("/account/login")
}

/* ****************************************
 * Account Update Data Validation Rules (Task 5)
 * *************************************** */
Util.updateAccountRules = () => {
    return [
        body("account_firstname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name."),

        body("account_lastname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a last name."),

        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail() 
            .withMessage("A valid email is required.")
            .custom(async (account_email, { req }) => {
                const { account_id } = req.body
                const account = await accountModel.getAccountById(account_id)
                
                // Only check if email is different from current email
                if (account_email != account.account_email) {
                    const emailExists = await accountModel.checkExistingEmail(account_email)
                    if (emailExists) {
                        throw new Error("Email already exists. Please use a different email.")
                    }
                }
            }),
    ]
}

/* ****************************************
 * Change Password Data Validation Rules (Task 5)
 * *************************************** */
Util.changePasswordRules = () => {
    return [
        body("account_password")
            .trim()
            .isLength({ min: 12 })
            .withMessage("Password must be at least 12 characters.")
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{12,}$/)
            .withMessage("Password does not meet requirements (1 uppercase, 1 lowercase, 1 number, 1 special character)."),
    ]
}

/* ****************************************
 * Check data for account update and continue (Task 5)
 * *************************************** */
Util.checkUpdateData = async (req, res, next) => {
    const { account_firstname, account_lastname, account_email, account_id } = req.body
    let errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        let nav = await Util.getNav() // Correct reference
        res.render("account/update", {
            title: "Edit Account",
            nav,
            errors,
            account_firstname,
            account_lastname,
            account_email,
            account_id,
            // Pass back current password error state to ensure only account update form shows errors
            passwordErrors: null, 
        })
        return
    }
    next()
}

/* ****************************************
 * Check data for password change and continue (Task 5)
 * *************************************** */
Util.checkPasswordData = async (req, res, next) => {
    const { account_password, account_id } = req.body
    let errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        let nav = await Util.getNav() // Correct reference
        const accountData = await accountModel.getAccountById(account_id)

        // Render the update view, passing back the original account data for the update form fields
        res.render("account/update", {
            title: "Edit Account",
            nav,
            // Pass errors specific to the password form back
            passwordErrors: errors, 
            errors: null,
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_id,
        })
        return
    }
    next()
}


/* ****************************************
 * Validation Rules for Registration
 * *************************************** */
Util.registationRules = () => {
    return [
        // firstname is required and must be string
        body("account_firstname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name.")
            .escape(),

        // lastname is required and must be string
        body("account_lastname")
            .trim()
            .isLength({ min: 1 })
            .withMessage("Please provide a last name.")
            .escape(),
        
        // account_type is required and must be a valid value
        body("account_type")
            .trim()
            .isIn(["Client", "Employee", "Admin"])
            .withMessage("Please select a valid account type."),

        // valid email is required and cannot already exist in the DB
        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail() // refer to validator docs
            .withMessage("A valid email is required.")
            .custom(async (account_email) => {
                const emailExists = await accountModel.checkExistingEmail(account_email)
                if (emailExists) {
                    throw new Error("Email already exists. Please login or use a different email.")
                }
            }),

        // password is required and must meet complexity requirements
        body("account_password")
            .trim()
            .isLength({ min: 12 })
            .withMessage("Password must be at least 12 characters.")
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{12,}$/)
            .withMessage("Password does not meet requirements (1 uppercase, 1 lowercase, 1 number, 1 special character)."),
    ]
}

/* ****************************************
 * Check data and return errors or continue to registration
 * *************************************** */
Util.checkRegData = async (req, res, next) => {
    // Include account_type for sticky forms
    const { account_firstname, account_lastname, account_email, account_type } = req.body
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await Util.getNav() // **FIXED: Changed utilities.getNav to Util.getNav**
        res.render("account/register", {
            errors: errors.array(),
            title: "Registration",
            nav,
            account_firstname,
            account_lastname,
            account_email,
            account_type, // Pass back account_type for sticky form
        })
        return
    }
    next()
}


module.exports = {
    getNav: Util.getNav,
    buildClassificationGrid: Util.buildClassificationGrid,
    buildItemDetail: Util.buildItemDetail,
    handleErrors: Util.handleErrors,
    buildClassificationList: Util.buildClassificationList,
    classificationRules: Util.classificationRules,
    checkClassificationData: Util.checkClassificationData,
    inventoryRules: Util.inventoryRules,
    checkInventoryData: Util.checkInventoryData,
    registationRules: Util.registationRules,
    checkRegData: Util.checkRegData,
    loginRules: Util.loginRules,
    checkLoginData: Util.checkLoginData,
    checkLogin: Util.checkLogin, 
    checkAdminOrEmployee: Util.checkAdminOrEmployee,
    updateAccountRules: Util.updateAccountRules,
    changePasswordRules: Util.changePasswordRules,
    checkUpdateData: Util.checkUpdateData,
    checkPasswordData: Util.checkPasswordData
}