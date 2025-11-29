const pool = require("../database/") // Assumes you have a database connection pool exported from a file named 'database'

/* *****************************
* Register new account
* ***************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password, account_type = "Client"){
    try {
        const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, $5) RETURNING *"
        return await pool.query(sql, [account_firstname, account_lastname, account_email, account_password, account_type])
    } catch (error) {
        return error.message
    }
}

/* **********************
 * Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
    try {
        const sql = "SELECT * FROM account WHERE account_email = $1"
        const email = await pool.query(sql, [account_email])
        return email.rowCount
    } catch (error) {
        return error.message
    }
}

/* *****************************
 * Return account data using email address
 * ***************************** */
async function getAccountByEmail (account_email) {
    try {
        const result = await pool.query(
        'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1',
        [account_email])
        return result.rows[0]
    } catch (error) {
        return new Error("No matching email found")
    }
}

/* *****************************
 * Return account data using account ID
 * ***************************** */
async function getAccountById (account_id) {
    try {
        const result = await pool.query(
        'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_id = $1',
        [account_id])
        return result.rows[0]
    } catch (error) {
        return new Error("No matching account ID found")
    }
}


/* *****************************
 * Update account information
 * ***************************** */
async function updateAccount(account_firstname, account_lastname, account_email, account_id){
    try {
        const sql = 
            "UPDATE account SET account_firstname = $1, account_lastname = $2, account_email = $3 WHERE account_id = $4 RETURNING *"
        const result = await pool.query(sql, [
            account_firstname,
            account_lastname,
            account_email,
            account_id
        ])
        return result.rows[0]
    } catch (error) {
        console.error("model error: " + error)
        return null
    }
}

// FIX: Renamed from updatePassword to changePassword to match controller call
/* *****************************
 * Update account password
 * ***************************** */
async function changePassword(account_password, account_id){
    try {
        const sql = "UPDATE account SET account_password = $1 WHERE account_id = $2 RETURNING *"
        const result = await pool.query(sql, [account_password, account_id])
        return result.rowCount > 0
    } catch (error) {
        console.error("password update error: " + error)
        return false
    }
}


module.exports = {
    registerAccount, 
    checkExistingEmail, 
    getAccountByEmail,
    getAccountById, 
    updateAccount, 
    changePassword // FIX: Exported with the correct name
}