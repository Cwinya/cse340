const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities/")
// CORRECTED: All validation rules and checks are now imported from utilities/index.js
// We keep the alias to minimize changes to the route definitions.
const regValidate = utilities 

// Route to build the login view
router.get("/login", utilities.handleErrors(accountController.buildLogin))

// Route to process the login attempt
router.post(
    "/login",
    regValidate.loginRules(),
    regValidate.checkLoginData,
    utilities.handleErrors(accountController.accountLogin)
)

// Route to build the registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister))

// Route to process the registration attempt
router.post(
    "/register",
    regValidate.registationRules(),
    regValidate.checkRegData,
    utilities.handleErrors(accountController.registerAccount)
)

// Route to build the account management view
// MANDATORY SECURITY: Requires login
router.get(
    "/", 
    utilities.checkLogin, // <<-- RE-ADDED SECURITY MIDDLEWARE
    utilities.handleErrors(accountController.buildAccountManagement)
)


// NEW ROUTES START HERE (Task 5 & 6)
// Route to process logout (Task 6)
router.get("/logout", utilities.handleErrors(accountController.accountLogout))

// Route to build account update view (Task 5)
// MANDATORY SECURITY: Requires login
router.get(
    "/update/:account_id", 
    utilities.checkLogin, // <<-- RE-ADDED SECURITY MIDDLEWARE
    utilities.handleErrors(accountController.buildUpdateAccountView)
)

// Route to process account information update (Task 5)
router.post(
    "/update-account",
    // MANDATORY SECURITY: Requires login before validating/updating
    utilities.checkLogin, // <<-- RE-ADDED SECURITY MIDDLEWARE
    regValidate.updateAccountRules(), 
    regValidate.checkUpdateData,      
    utilities.handleErrors(accountController.updateAccount)
)

// Route to process password change (Task 5)
router.post(
    "/change-password",
    // MANDATORY SECURITY: Requires login before validating/updating
    utilities.checkLogin, // <<-- RE-ADDED SECURITY MIDDLEWARE
    regValidate.changePasswordRules(), 
    regValidate.checkPasswordData,     
    utilities.handleErrors(accountController.changePassword)
)

module.exports = router;