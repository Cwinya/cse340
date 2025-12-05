/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const app = express()
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const accountRoute = require("./routes/accountRoute")
const reviewRoute = require("./routes/reviewRoute") // Now correctly imported
const utilities = require("./utilities")
// npm install express-session cookie-parser connect-flash connect-pg-simple
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash"); 

const pgSession = require('connect-pg-simple')(session);
const db = require("./database/") // Import the SSL-configured database object

// NEW: Import Utility functions and middleware
const Util = require("./utilities/")


// --- MIDDLEWARE SETUP ---
// 1. Session Middleware (REQUIRED by connect-flash)

// Define production status helper
const isProduction = process.env.NODE_ENV === 'production'

app.use(
    session({
        // 1. Explicitly set the secret
        secret: process.env.SESSION_SECRET || "default_secret_fallback", 
        
        // 2. Configure the session store to use the PRE-CONFIGURED PostgreSQL pool
        store: new pgSession({
            // Pass the already configured pool instance
            pool: db.pool || db, 
            tableName: 'session', 
        }),

        // 3. Essential for production environments behind a proxy like Render
        resave: true, 
        saveUninitialized: true, 
        name: 'sessionId',
        cookie: {
            // FIX: Set secure to true in production
            secure: isProduction, 
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            // CRITICAL RENDER FIX: Must be 'none' when secure is true (behind proxy)
            sameSite: isProduction ? 'none' : 'lax'
        }
    })
)

// 4. Tell Express to trust the Render proxy, necessary for 'secure: true' to work
app.set('trust proxy', 1)


// 2. Cookie Parser Middleware
app.use(cookieParser());
// 3. Flash Message Middleware
app.use(flash());

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true })) 
// Middleware to parse JSON data 
app.use(express.json())

// Express Messages Middleware (Simplified method for rendering flash messages)
app.use(function(req, res, next){
    res.locals.messages = require("express-messages")(req, res)
    next()
})

// NEW: Middleware to check for JWT token and set res.locals (Task 1, 3, 5 Prep)
app.use(Util.checkLogin)


/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") //not at view root


/* ***********************
 * Routes
 *************************/
app.use(static)
// Index route
app.get("/", utilities.handleErrors(baseController.buildHome))
// Inventory routes
app.use("/inv", inventoryRoute)
// Account routes
app.use("/account", accountRoute) // Uses the corrected accountRoute import

// Review routes (CRITICAL: Must be placed before the 404 handler)
app.use('/review', reviewRoute); 

// File Not Found Route - must be last route in list
app.use(async (_req, _res, next) => {
    next({status: 404, message: 'Sorry, we appear to have lost that page.'})
})


/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT
const host = process.env.HOST


/* ***********************
* Express Error Handler
* Place after all other middleware
*************************/
app.use(async (err, req, res, next) => {
    let nav = await utilities.getNav()
    // Determine the status code, defaulting to 500 if not set
    const status = err.status || 500
    console.error(`Error [${status}] at: "${req.originalUrl}": ${err.message}`)
    let message
    if(status == 404){
        message = err.message // Use the custom message from the 404 route
    } else {
        // Generic 500 message for unhandled server-side errors
        message = "Oh no! There was a crash. Maybe try a different route?"
    }
    // Set the status code and render the error view
    res.status(status).render("errors/error", {
        title: status === 500 ? 'Server Error' : err.status,
        message,
        nav
    })
})


/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
    console.log(`app listening on ${host}:${port}`)
})