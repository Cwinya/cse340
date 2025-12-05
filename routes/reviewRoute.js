const express = require("express")
const router = new express.Router()
const reviewController = require("../controllers/reviewController")
const utilities = require("../utilities/")
const reviewValidate = require("../utilities/reviewValidator") // New validator needed

// Route to handle review submission (POST)
router.post(
    "/submit",
    utilities.checkLogin, // Must be logged in
    reviewValidate.reviewRules(), // New validation rules
    reviewValidate.checkReviewData,
    utilities.handleErrors(reviewController.addReview)
)

module.exports = router