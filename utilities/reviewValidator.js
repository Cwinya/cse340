const { body, validationResult } = require("express-validator")
const utilities = require(".")
const reviewModel = require("../models/reviewModel") // Assuming this model is defined

/* ****************************************
 * Review submission validation rules (for new reviews)
 * *************************************** */
const reviewRules = () => {
    return [
        // review_rating is required and must be an integer between 1 and 5
        body("review_rating")
            .trim()
            .isInt({ min: 1, max: 5 })
            .withMessage("Rating must be a whole number between 1 and 5."),

        // review_text is required and cannot be empty (min 10 characters)
        body("review_text")
            .trim()
            .isLength({ min: 10 })
            .withMessage("Review must be at least 10 characters long.")
            .escape(), // Sanitize input
        
        // inv_id is required
        body("inv_id")
            .trim()
            .isInt()
            .withMessage("Invalid vehicle ID."),

        // account_id is required
        body("account_id")
            .trim()
            .isInt()
            .withMessage("Invalid account ID."),
    ]
}

/* ****************************************
 * Check submission data and return to view or continue
 * *************************************** */
async function checkReviewData(req, res, next) {
    const { inv_id } = req.body
    let errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        const invModel = require("../models/inventory-model") // Import model locally to avoid circular dependency
        
        // 1. Fetch item data
        const itemData = await invModel.getInventoryById(inv_id) 
        
        // Check 1: If itemData is not found, handle the error gracefully.
        if (!itemData) {
            req.flash("notice", "Sorry, the vehicle associated with this review could not be found.")
            return res.redirect("/inv/") 
        }

        // 2. Fetch existing reviews
        const reviews = await reviewModel.getReviewsByInventoryId(inv_id)
        const reviewDisplay = await utilities.buildReviewDisplay(reviews)

        // 3. Render the detail view with sticky data and errors
        res.status(400).render("inventory/detail", {
            title: `${itemData.inv_make} ${itemData.inv_model}`,
            nav,
            inventory: itemData,
            reviewDisplay,
            errors,
            // Pass back submitted values for sticky form
            ...req.body, 
            
            // Critical: Pass account/login data from res.locals for EJS template integrity
            accountData: res.locals.accountData,
            loggedin: res.locals.loggedin,
        })
        return
    }
    next()
}

/* ****************************************
 * Review update validation rules
 * *************************************** */
const reviewUpdateRules = () => {
    return [
        // review_id is required for updates
        body("review_id")
            .trim()
            .isInt()
            .withMessage("Invalid review ID."),

        // review_rating is required and must be an integer between 1 and 5
        body("review_rating")
            .trim()
            .isInt({ min: 1, max: 5 })
            .withMessage("Rating must be a whole number between 1 and 5."),

        // review_text is required and cannot be empty (min 10 characters)
        body("review_text")
            .trim()
            .isLength({ min: 10 })
            .withMessage("Review must be at least 10 characters long.")
            .escape(), // Sanitize input
    ]
}

/* ****************************************
 * Check update data and return to view or continue
 * *************************************** */
async function checkUpdateData(req, res, next) {
    const { review_id } = req.body
    let errors = validationResult(req)
    
    // If validation fails, re-render the edit view with sticky data and errors
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        
        // Fetch the original review data to pass back to the view
        const reviewData = await reviewModel.getReviewById(review_id) 

        // FIX: Check if the review exists before attempting to render the form
        if (!reviewData) {
            req.flash("notice", "Sorry, the review you attempted to update could not be found.")
            // Redirect to a safe page, like the account management page
            return res.redirect("/account/") 
        }

        res.status(400).render("review/edit", {
            title: "Edit Review",
            nav,
            errors,
            reviewData, 
            
            // Pass back submitted values for sticky form (this overrides reviewData if present)
            ...req.body, 
            
            // Critical: Pass account/login data from res.locals for EJS template integrity
            accountData: res.locals.accountData,
            loggedin: res.locals.loggedin,
        })
        return
    }
    next()
}


module.exports = {
    reviewRules,
    checkReviewData,
    reviewUpdateRules,
    checkUpdateData
}