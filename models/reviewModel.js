const pool = require("../database/")

/* ****************************************
 * Get all reviews for a specific inventory item
 * *************************************** */
async function getReviewsByInventoryId(inv_id) {
    try {
        const data = await pool.query(
            `SELECT
                r.*,
                a.account_firstname,
                a.account_lastname
            FROM
                review AS r
            JOIN
                account AS a ON r.account_id = a.account_id
            WHERE
                r.inv_id = $1
            ORDER BY
                r.review_date DESC`,
            [inv_id]
        )
        return data.rows
    } catch (error) {
        console.error("getReviewsByInventoryId error:", error)
        return null
    }
}

/* ****************************************
 * Insert a new review
 * *************************************** */
async function submitReview(review_text, review_rating, inv_id, account_id) {
    try {
        const sql = `INSERT INTO review (review_text, review_rating, inv_id, account_id)
                     VALUES ($1, $2, $3, $4) RETURNING *`
        return await pool.query(sql, [review_text, review_rating, inv_id, account_id])
    } catch (error) {
        console.error("submitReview error:", error.message)
        return error.message
    }
}

// Add more functions (getReviewById, updateReview, deleteReview) if time permits for a full CRUD implementation

module.exports = {
    getReviewsByInventoryId,
    submitReview
}