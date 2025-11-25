const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 * Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)
    
    // Check if data was found
    if (!data || data.length === 0) {
        let nav = await utilities.getNav();
        res.status(404).render("errors/error", {
            title: "404 Not Found",
            message: `Sorry, no vehicles found for classification ID: ${classification_id}.`,
            nav
        });
        return;
    }
    
    const grid = await utilities.buildClassificationGrid(data)
    let nav = await utilities.getNav()
    const className = data[0].classification_name
    res.render("./inventory/classification", {
        title: className + " vehicles",
        nav,
        grid,
    })
}

/* ****************************************
 * Deliver inventory item detail view
 * **************************************** */
invCont.buildByInvId = async function(req, res, next) {
  const inv_id = req.params.invId;
  const data = await invModel.getInventoryById(inv_id);
  const item = data[0]
  const itemName = `${item.inv_make} ${item.inv_model}`;
  let nav = await utilities.getNav(); // Assuming a navigation helper exists

  // Check if data was found
  if (data.length > 0) {
    const detailView = await utilities.buildItemDetail(data[0]); // Pass the single item object
    res.render("./inventory/detail", {
      title: itemName + " Details",
      nav,
      detailView,
      errors: null,
    });
  } else {
    // Handle case where inventory item is not found
    // You might want to build a custom error page here
    let nav = await utilities.getNav();
    res.render("errors/error", {
      title: "Vehicle Not Found",
      message: "Sorry, we could not find the requested vehicle.",
      nav,
    });
  }
}

// Export the entire invCont object
module.exports = invCont;