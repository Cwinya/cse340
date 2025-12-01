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
// FIX: Changed './route/accountRoute' to './routes/accountRoute' 
const accountRoute = require("./routes/accountRoute") 
const utilities = require("./utilities")
// npm install express-session cookie-parser connect-flash
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash"); 
// NEW: Import Utility functions and middleware
const Util = require("./utilities/")


// --- MIDDLEWARE SETUP ---
// 1. Session Middleware (REQUIRED by connect-flash)
// app.use(
//     session({
//         secret: process.env.SESSION_SECRET || "supersecret-key", 
//         resave: true,
//         saveUninitialized: true,
//         name: 'sessionId', 
//     })
// );


app.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecret-key",
        resave: false, // Change from true
        saveUninitialized: false, // Change from true
        name: 'sessionId',
        cookie: {
            secure: process.env.NODE_ENV === 'production', // Enable for HTTPS
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            sameSite: 'lax' // Important for cross-site requests
        }
    })
);



// 2. Cookie Parser Middleware
app.use(cookieParser());
// 3. Flash Message Middleware
app.use(flash());

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true })) 
// Middleware to parse JSON data 
app.use(express.json())

// The following block is typically replaced by the 'express-messages' middleware below, 
// which is simpler and more reliable for rendering flash messages in EJS.
/*
// 4. Local Variables Middleware (Defines the messages() helper)
app.use(async (req, res, next) => {
    // Define a res.locals.messages function that renders all flash messages
    res.locals.messages = () => {
        let output = '';
        const success = req.flash('success');
        if (success && success.length > 0) {
            output += `<div class="notice success">${success.join('<br>')}</div>`;
        }
        const error = req.flash('error');
        if (error && error.length > 0) {
            output += `<div class="notice error">${error.join('<br>')}</div>`;
        }
        return output;
    };
    next();
});
*/

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