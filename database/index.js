const { Pool } = require("pg")
require("dotenv").config() 

let pool
/* ***************
 * Connection Pool
 * SSL Object is required for local testing against a remote database (e.g., Render)
 * The conditional logic below ensures we only force SSL in the local "development"
 * environment, and rely on Render's configuration for "production."
 * *************** */
if (process.env.NODE_ENV === "development") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Allows local dev to connect to Render's self-signed certs
    },
  }) 

  // In development, export both the pool instance and a custom query wrapper
  module.exports = {
    pool, // Export the pool object (needed by connect-pg-simple)
    query: async (text, params) => {
      try {
        const res = await pool.query(text, params)
        console.log("executed query", { text: text.slice(0, 50) }) // Log first 50 chars of query
        return res
      } catch (error) {
        // Logging the original error helps trace the SSL/ECONNRESET issue.
        console.error("error in query (DEV)", { text: text.slice(0, 50) }, error)
        throw error
      }
    },
  }
} else {
  // Production configuration (Render handles SSL/TLS automatically when the app is hosted there)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
  // In production, we export the pg.Pool object directly, as it includes the .query() method.
  module.exports = pool
}