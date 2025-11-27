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
const utilities = require("./utilities")
// npm install express-session cookie-parser connect-flash
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash"); // Flash message management


// --- MIDDLEWARE SETUP ---
// 1. Session Middleware (REQUIRED by connect-flash)
app.use(
  session({
    secret: "supersecret-key", // IMPORTANT: Use a secure, secret string here
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Optional: customize the cookie name
  })
);
// 2. Cookie Parser Middleware
app.use(cookieParser());
// 3. Flash Message Middleware
app.use(flash());
// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true })) 
// Middleware to parse JSON data (recommended, even if not strictly needed yet)
app.use(express.json())
// 4. Local Variables Middleware (Defines the messages() helper)
// This is the CRITICAL block that defines the 'messages' function 
app.use(async (req, res, next) => {
  // Define a res.locals.messages function that renders all flash messages
  // This structure is compatible with the <%- messages() %> call in your EJS file.
  res.locals.messages = () => {
    // Collect all flash messages
    let output = '';
    
    // Check for success messages
    const success = req.flash('success');
    if (success && success.length > 0) {
      output += `<div class="notice success">${success.join('<br>')}</div>`;
    }
    // Check for error messages (often used for validation errors too)
    const error = req.flash('error');
    if (error && error.length > 0) {
      output += `<div class="notice error">${error.join('<br>')}</div>`;
    }
    return output;
  };
  next();
});



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