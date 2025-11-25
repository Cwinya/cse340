const invModel = require("../models/inventory-model")
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (_req, _res, _next) {
    let data = await invModel.getClassifications()
    // NOTE: data.rows is correct here based on typical pg pool query results
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'
    data.rows.forEach((row) => {
        list += "<li>"
        list +=
        '<a href="/inv/type/' + // Use absolute path
        row.classification_id +
        '" title="See our inventory of ' +
        row.classification_name +
        ' vehicles">' +
        row.classification_name +
        "</a>"
        list += "</li>"
    })
    list += "</ul>"
    return list
}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function(data){
    let grid
    if(data.length > 0){
        grid = '<ul id="inv-display">'
        data.forEach(vehicle => { 
            const detailUrl = '/inv/detail/' + vehicle.inv_id;
            const cardTitle = 'View ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' details';

            grid += '<li>'
            
            // --- START: Single Anchor Tag Wrapping ALL Card Content ---
            // This entire block is now the clickable link.
            grid += 	'<a href="' + detailUrl + '" title="' + cardTitle + '">'
            
            // 1. Image
            grid += 	'<img src="' + vehicle.inv_thumbnail 
            + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model 
            + ' on CSE Motors" />'
            
            // 2. Name and Price Block
            grid += '<div class="namePrice">'
            grid += '<hr />'
            grid += '<h2>'
            // Title text
            grid += 	vehicle.inv_make + ' ' + vehicle.inv_model
            grid += '</h2>'
            
            // Price text
            grid += '<span>' 
            + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(vehicle.inv_price) + 
            '</span>'
            
            grid += '</div>'
            
            // --- END: Close the Single Anchor Tag ---
            grid += '</a>'

            grid += '</li>'
        })
        grid += '</ul>'
    } else { 
        grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
    }
    return grid
}

/* ****************************************
 * Build the HTML for the item detail view
 * *************************************** */
Util.buildItemDetail = async function(item) {  
  // Helper to format price to USD
  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.inv_price); // Corrected from item.invPrice

  // Helper to format mileage with commas
  const mileageFormatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    useGrouping: true,
  }).format(item.inv_miles);

  let detailView = '<div class="item-detail-container">';

  // Image and Description/Details for side-by-side layout
  detailView += '<div class="detail-content-wrapper">';

  // --- Image Section ---
  detailView += '<div class="detail-image-area">';
  // Use the full-size image path
  detailView += `<img src="${item.inv_image}" alt="${item.inv_make} ${item.inv_model} on sale" class="detail-image">`; 
  detailView += '</div>';

  // --- Details Section ---
  detailView += '<div class="detail-info-area">';
  detailView += `<h2 class="detail-heading">${item.inv_make} ${item.inv_model}</h2>`; 

  detailView += '<div class="prominent-details">';
  detailView += `
    <div class="detail-item price-block">
        <p class="label">Our Price</p>
        <p class="value price">${priceFormatted}</p>
    </div>
    <div class="detail-item">
        <p class="label">Model Year</p>
        <p class="value year">${item.inv_year}</p>
    </div>
    <div class="detail-item">
        <p class="label">Mileage</p>
        <p class="value mileage">${mileageFormatted}</p>
    </div>`;
  detailView += '</div>'; // End prominent-details

  // --- Descriptive Data ---
  detailView += '<div class="descriptive-data">';
  detailView += `<h3>Vehicle Specifications</h3>`;
  detailView += `
    <dl>
        <dt>Make</dt>
        <dd>${item.inv_make}</dd>
        <dt>Model</dt>
        <dd>${item.inv_model}</dd>
        <dt>Color</dt>
        <dd>${item.inv_color}</dd>
        <dt>Description</dt>
        <dd>${item.inv_description}</dd>
    </dl>`;
  detailView += '</div>'; // End descriptive-data

  detailView += '</div>'; // End detail-info-area
  detailView += '</div>'; // End detail-content-wrapper

  detailView += '</div>'; // End item-detail-container

  return detailView;
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = {
  getNav: Util.getNav,
  buildClassificationGrid: Util.buildClassificationGrid,
  buildItemDetail: Util.buildItemDetail, 
  handleErrors: Util.handleErrors
}