const reviewModel = require("../models/reviewModel")
const utilities = require("../utilities/")
const invModel = require("../models/inventory-model") // Needed to fetch vehicle name for flash message

/* ****************************************
 * Process New Review Submission
 * *************************************** */
async function addReview(req, res) {
    const { review_text, review_rating, inv_id, account_id } = req.body
    const accountData = res.locals.accountData // Assuming middleware sets this
    let nav = await utilities.getNav()
    
    // Safety check for user ID
    if (!accountData || accountData.account_id != account_id) {
        req.flash("error", "You must be logged in to submit a review.")
        return res.redirect(`/inv/detail/${inv_id}`)
    }

    const reviewResult = await reviewModel.submitReview(
        review_text,
        review_rating,
        inv_id,
        account_id
    )

    // Fetch the vehicle data again to re-render the detail view correctly
    const itemData = await invModel.getInventoryById(inv_id)
    const reviews = await reviewModel.getReviewsByInventoryId(inv_id)
    const reviewDisplay = await utilities.buildReviewDisplay(reviews)
    
    if (reviewResult.rowCount) {
        req.flash("success", `Review submitted successfully for the ${itemData.inv_make} ${itemData.inv_model}.`)
        res.redirect(`/inv/detail/${inv_id}`)
    } else {
        req.flash("error", "Sorry, the review submission failed.")
        // Re-render the detail page with the error
        res.status(501).render("inventory/detail", {
            title: `${itemData.inv_make} ${itemData.inv_model}`,
            nav,
            inventory: itemData,
            reviewDisplay,
            errors: null,
            // Re-passing submitted data for sticky form (optional, but good practice)
            review_text,
            review_rating
        })
    }
}

module.exports = {
    addReview
}