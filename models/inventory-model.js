const pool = require("../database/")

/* ***************************
 * Get all classification data
 * ************************** */
async function getClassifications(){
  // Using public.classification for clarity, though it's optional if public is in the search path
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 * Insert new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *"
    return await pool.query(sql, [classification_name])
  } catch (error) {
    // SECURITY IMPROVEMENT: Log the full error but throw a generic one back to the controller
    console.error("addClassification error: " + error);
    throw new Error("Failed to add new classification.");
  }
}

/* ***************************
 * Check for existing classification name
 * ************************** */
async function checkExistingClassification(classification_name) {
  try {
    const sql = "SELECT * FROM classification WHERE classification_name = $1"
    const classification = await pool.query(sql, [classification_name])
    return classification.rowCount
  } catch (error) {
    // Log the full error for debugging but let the calling code handle the response
    console.error("checkExistingClassification error: " + error);
    throw new Error("Database check failed.");
  }
}

/* ***************************
 * Insert new inventory item
 * ************************** */
async function addInventory(
  inv_make,
  inv_model,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_year,
  inv_miles,
  inv_color,
  classification_id
) {
  try {
    const sql = "INSERT INTO inventory (inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color, classification_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
    const result = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_year,
      inv_miles,
      inv_color,
      classification_id,
    ])
    return result
  } catch (error) {
    // SECURITY IMPROVEMENT: Log the full error but throw a generic one back to the controller
    console.error("addInventory error: " + error);
    throw new Error("Failed to add new inventory item.");
  }
}


/* ***************************
 * Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getInventoryByClassificationId error: " + error) 
  }
}

/* ***************************
 * Get inventory data by ID
 * ************************** */
async function getInventoryById(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory
      WHERE inv_id = $1`,
      [inv_id]
    );
    // Improvement: Return the single object (or undefined if not found), not an array.
    return data.rows[0]; 
  } catch (error) {
    console.error("getInventoryById error: " + error);
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById,
  addClassification, 
  checkExistingClassification,
  addInventory
}