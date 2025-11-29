const accountModel = require("../models/accountModel")
const utilities = require("../utilities/")
const bcrypt = require("bcryptjs") 
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
 * Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
    let nav = await utilities.getNav()
    res.render("account/login", {
        title: "Login",
        nav,
        errors: null,
    })
}

/* ****************************************
 * Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
    let nav = await utilities.getNav()
    res.render("account/register", {
        title: "Registration",
        nav,
        errors: null,
    })
}

/* ****************************************
 * Process Registration (UPDATED)
 * *************************************** */
async function registerAccount(req, res) {
    let nav = await utilities.getNav()
    const { 
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password,
        account_type // <-- NEW: Retrieve the selected type from the request body
    } = req.body

    // Hash the password before storing
    let hashedPassword
    try {
        // regular password and cost (salt rounds)
        hashedPassword = await bcrypt.hash(account_password, 10)
    } catch (error) {
        req.flash("notice", 'Sorry, there was an error processing the registration.')
        res.status(500).render("account/register", {
            title: "Registration",
            nav,
            errors: null,
            // Pass back current values on error
            account_firstname, account_lastname, account_email, account_type
        })
        return
    }

    const regResult = await accountModel.registerAccount(
        account_firstname,
        account_lastname,
        account_email,
        hashedPassword,
        account_type // <-- NEW: Pass the selected account_type to the model
    )

    if (regResult) {
        req.flash(
            "success",
            `Congratulations, ${account_firstname}! You're registered as a ${account_type}. Please log in.`
        )
        res.status(201).render("account/login", {
            title: "Login",
            nav,
            errors: null,
        })
    } else {
        req.flash("error", "Sorry, the registration failed.")
        res.status(501).render("account/register", {
            title: "Registration",
            nav,
            errors: null,
            // Pass back current values on error
            account_firstname, account_lastname, account_email, account_type
        })
    }
}

/* ****************************************
 * Process login request
 * *************************************** */
async function accountLogin(req, res) {
    let nav = await utilities.getNav()
    const { account_email, account_password } = req.body
    const accountData = await accountModel.getAccountByEmail(account_email)
    
    // Check if account exists
    if (!accountData) {
        req.flash("error", "Please check your credentials and try again.")
        return res.status(400).render("account/login", {
            title: "Login",
            nav,
            errors: null,
            account_email,
        })
    }
    
    // Check if password matches
    try {
        if (await bcrypt.compare(account_password, accountData.account_password)) {
            delete accountData.account_password
            let accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
            
            // Set success flash message and redirect to account management
            req.flash("success", "You have successfully logged in.")
            res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
            return res.redirect("/account/")
        }
    } catch (error) {
        return new Error('Access Forbidden')
    }
    
    // If login failed for any reason not caught above
    req.flash("error", "Please check your credentials and try again.")
    return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
    })
}

/* ****************************************
 * Deliver Account Management View (FIXED)
 * *************************************** */
async function buildAccountManagement(req, res) {
    let nav = await utilities.getNav()
    
    // CRITICAL FIX: Extract user data from res.locals
    const accountData = res.locals.accountData; 
    
    // Safety check (though checkLogin should handle auth)
    if (!accountData) {
        req.flash("error", "User session expired or data unavailable. Please log in.")
        return res.redirect("/account/login")
    }

    res.render("account/account-management", {
        title: "Account Management",
        nav,
        errors: null, // Clear any previous errors
        // CRITICAL: Pass the individual fields to the EJS view
        account_id: accountData.account_id,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
        account_type: accountData.account_type,
    })
}

/* ****************************************
 * Process Logout (Task 6)
 * *************************************** */
async function accountLogout(req, res) {
    // Clear the JWT cookie
    res.clearCookie("jwt"); 
    // Set a success message
    req.flash("success", "You have successfully logged out.");
    // Redirect to the home page
    res.redirect("/");
}

/* ****************************************
 * Deliver Update Account Information View (Task 5)
 * *************************************** */
async function buildUpdateAccountView(req, res) {
    const account_id = req.params.account_id
    
    // Check if the user is authorized to update this specific account (optional but good practice)
    if (req.params.account_id != res.locals.accountData.account_id) {
        req.flash("error", "You are not authorized to update this account.")
        return res.redirect("/account/")
    }

    const accountData = await accountModel.getAccountById(account_id)
    let nav = await utilities.getNav()

    if (!accountData) {
        req.flash("error", "Account not found.")
        return res.redirect("/account/")
    }

    res.render("account/update", {
        title: "Edit Account",
        nav,
        errors: null,
        passwordErrors: null,
        account_firstname: accountData.account_firstname,
        account_lastname: accountData.account_lastname,
        account_email: accountData.account_email,
        account_id: accountData.account_id,
    })
}

/* ****************************************
 * Process Account Update (Task 5)
 * *************************************** */
async function updateAccount(req, res) {
    let nav = await utilities.getNav()
    const { account_firstname, account_lastname, account_email, account_id } = req.body

    const updateResult = await accountModel.updateAccount(
        account_firstname,
        account_lastname,
        account_email,
        account_id
    )

    if (updateResult) {
        // Update successful, re-generate JWT with new details for the user's session
        const updatedAccountData = await accountModel.getAccountById(account_id)
        
        // Remove password before creating token
        delete updatedAccountData.account_password
        
        let accessToken = jwt.sign(updatedAccountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })

        req.flash("success", `Account information for ${account_firstname} updated successfully.`)
        res.redirect("/account/")
    } else {
        req.flash("error", "Sorry, the account update failed.")
        // Re-render the update view with existing data and error
        res.status(501).render("account/update", {
            title: "Edit Account",
            nav,
            errors: null,
            passwordErrors: null,
            account_firstname,
            account_lastname,
            account_email,
            account_id
        })
    }
}

/* ****************************************
 * Process Password Change (Task 5)
 * *************************************** */
async function changePassword(req, res) {
    const { account_password, account_id } = req.body

    // Hash the new password
    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(account_password, 10)
    } catch (error) {
        req.flash("error", 'Sorry, there was an error processing the password change.')
        return res.redirect(`/account/update/${account_id}`)
    }

    const updateResult = await accountModel.changePassword(
        hashedPassword,
        account_id
    )

    if (updateResult) {
        req.flash("success", "Password updated successfully.")
        res.redirect("/account/")
    } else {
        req.flash("error", "Sorry, the password change failed.")
        res.redirect(`/account/update/${account_id}`)
    }
}


module.exports = { 
    buildLogin, 
    buildRegister, 
    registerAccount, 
    accountLogin, 
    buildAccountManagement, // Export new function
    accountLogout,
    buildUpdateAccountView,
    updateAccount,
    changePassword
}