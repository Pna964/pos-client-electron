let shoppingCart = {
  employee: null,
  employeeID: null,
  items: [],
  total: 0,
  payment: 0,
  change: 0
  }
let serverUrl;
let totalPrice = 0;

// DOM Nodes
const mainContents = document.getElementById("main");
const loadingSpinner = document.getElementById("loading");

const itemInput = document.getElementById("item-input");
const addItemBtn = document.getElementById("add-item");
const searchBtn = document.getElementById("search-item");
const addFeesBtn = document.getElementById("add-fees");
const givenAmountInput = document.getElementById("given-amount");
const checkoutBtn = document.getElementById("checkout-btn");
const dismisCheckoutErrorButton = document.getElementById("dismiss-checkout-error");
const discardBtn = document.getElementById("discard-btn");
const printBtn = document.getElementById("print-btn");
const checkoutModal = document.getElementById("checkout-modal");
const errorProductScan = document.getElementById("product-scan-error");
const errorSearchItem = document.getElementById("search-item-error");



/**
# Once the window loads up, disable all three action buttons and hide what's necessary
**/

onLoadPage(mainContents, loadingSpinner);
showErrorMessage(errorProductScan, show=false);
showErrorMessage(errorSearchItem, show=false);

toggleButtonState(checkoutBtn, false);
toggleButtonState(printBtn, false);
toggleButtonState(discardBtn, false);


window.cashierAPI.receive("user-details", details => {

  try {
    const loginTimeDOM = document.getElementById("login-time");
    displayLoginTime(loginTimeDOM);

    const employeeNameDOM = document.getElementById("employee-name");
    setEmployeeDetails(employeeNameDOM, details.name, details.id);

    if (localStorage.getItem("serverUrl"))
      serverUrl = localStorage.getItem("serverUrl");
    else
      throw new Error ("Server Url not found!");

    onDidLoadedPage(mainContents, loadingSpinner);
  }
  catch (error) {
    console.error(error);
  }
});


/** display logged in employee name **/
function setEmployeeDetails (dom, name, id) {
  dom.innerHTML = name;
  shoppingCart.employee = name;
  shoppingCart.employeeID = id;
}


/** set/display login time **/
function displayLoginTime (dom) {
  const now = new Date();
  dom.innerHTML = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}


/***
# Remove All Event Listeners when the window is unloaded
**/
window.onUnload = () => cleanUp();


function logoutToMainMenu() {
  window.cashierAPI.send('cashier-close', 'cart');
}


itemInput.addEventListener("keyup", async e => {
  try {
    if (e.target.value === '')
      return;

    if (e.key === "Enter") {
      await enterOrScanProductCode(e.target.value, addItemBtn);
      e.target.value = "";
    }
  }
  catch (error) {
    showErrorMessage('Application Error. Contact Administrator!');
  }
});


/**
# add medicines to cart
**/
addItemBtn.addEventListener("click", async e => {
  try {
    const itemInput = document.getElementById("item-input");

    if (!itemInput || itemInput.value === '')
      return;

    await enterOrScanProductCode(itemInput.value, e.target);

    itemInput.value = "";
  }
  catch (error) {
    showErrorMessage('Application Error. Contact Administrator!')
  }
});


// scan or enter product code to add item to cart
async function enterOrScanProductCode (value, button) {

  try {
    toggleAddButton(button, done=false);

    const response = await getItemByProductCode(value);

    if (response && response.ok) {
      showErrorMessage(errorProductScan, show=false);
      const product = await response.json();
      addItemToCart(product);
    }
    else {
      const { message } = await response.json();

      const errorMessage = message ? message : "Error: code 500!";
      showErrorMessage(errorProductScan, show=true, errorMessage);
    }
  }
  catch (error) {
    console.log("Error Scanning Product Code", error);
    showErrorMessage(errorProductScan, show=true, "Error: code 300!");
  }
  finally {
    toggleAddButton(button, done=true);
  }
}


function toggleAddButton (button, done) {
  if (done) {
    button.innerHTML = "Add item";
    button.removeAttribute("disabled");
  }
  else {
    button.innerHTML = "Loading...";
    button.setAttribute("disabled", true);
  }
}


searchBtn.addEventListener("click", async e => {
  try {
    const searchInput = document.getElementById("item-search-input");

    if (!searchInput || searchInput.value === '')
      return;

    toggleSearchButton(e.target, done=false);

    const response = await searchProducts(searchInput.value);

    if (response && response.ok) {
      const products = await response.json();

      displaySearchResults(products, searchInput.value);
    }
    else {
      const { message } = await response.json();
      const errorMessage = message ? message : "Error: Code 500!";
      showErrorMessage(errorSearchItem, show=true, errorMessage);
    }

  }
  catch (error) {
    console.error("Error Searching Items\n", error);
    showErrorMessage(errorSearchItem, show=true, "Error: code 300!");
  }
  finally {
    toggleSearchButton(e.target, done=true);
  }
});


function toggleSearchButton (button, done) {
  if (done) {
    button.innerHTML = "Search";
    button.removeAttribute("disabled");
  }
  else {
    button.innerHTML = "Loading...";
    button.setAttribute("disabled", true);
  }
}

/** Enter the amount given from the customer **/
givenAmountInput.addEventListener("keyup", event => {
  try {
    if (event.target.value === '')
      return;

    if (event.key === "Enter") {
      shoppingCart.payment = parseInt(event.target.value);
      calculateReturnChange (parseInt(event.target.value));
    }
  }
  catch (error) {
    console.error(error);
  }
});


/** calculate return change to the customer **/
function calculateReturnChange (givenAmount) {
  const total = parseInt(shoppingCart.total);

  const change = givenAmount - total;

  const changeReturnDOM = document.getElementById("change-return");
  changeReturnDOM.style.color = (parseInt(change) < 0) ? "red" : "dodgerblue";
  changeReturnDOM.innerHTML = change;

  shoppingCart.change = parseInt(change);
}


/**
# Clear the cart when discard button is pressed
**/
discardBtn.addEventListener("click", e => {
  clearCart();

  totalPrice = 0;
  (document.getElementById("total-price")).innerHTML = totalPrice;

  addEmptyMessageBox();
});


/**
# Checkout
**/
checkoutBtn.addEventListener("click", e => {

  const postPaymentLoadingDOM = document.getElementById("post-payment");
  showHidePostPaymentLoading(postPaymentLoadingDOM, "show");
  console.log("show checkout page");

  try {
    console.log(shoppingCart);
    const { error, message } = validateCheckOut();

    if (error) {
      displayCheckOutError(message);
      return;
    }

    // clear Cart
    // send checkout process network request
    showHidePostPaymentLoading(postPaymentLoadingDOM, "hide");
  }
  catch (error) {
    console.error(error);
  }
});

dismisCheckoutErrorButton.addEventListener("click", e => {
  const postPaymentLoadingDOM = document.getElementById("post-payment");
  removeCheckOutError();
  showHidePostPaymentLoading(postPaymentLoadingDOM, "hide");
});


/**
# Add Items to the Cart
**/
function addItemToCart ({productNumber, name, price}) {

  removeMessageBoxesFromCart();

  const cart = document.getElementById("cart");

  const itemsUpdated = updateExistingItemsInCart(productNumber, price);
  // console.log(itemsUpdated);

  if (itemsUpdated == 0) {
    /** create new cart item */
    const cartItem = document.createElement("div");
    cartItem.setAttribute("class", "p-2 bg-light my-1 row");
    cartItem.setAttribute("id", `data-item-${productNumber}`);

    const quantityDiv = document.createElement("div");
    quantityDiv.setAttribute("id", "item-qty-div");
    quantityDiv.setAttribute("class", "col");
    cartItem.appendChild(quantityDiv);

    const itemNameDiv = document.createElement("div");
    itemNameDiv.setAttribute("class", "col-5");
    cartItem.appendChild(itemNameDiv);

    const priceDiv = document.createElement("div");
    priceDiv.setAttribute("class", "col");
    cartItem.appendChild(priceDiv);

    // item quantity
    const itemQty = createQuantityDivision(1, productNumber, price);
    quantityDiv.appendChild(itemQty);

    // item name
    const itemName = document.createElement("h6");
    itemName.setAttribute("class", "text-muted mx-1 my-2");
    itemName.innerHTML = name;
    itemNameDiv.appendChild(itemName);

    // item price
    const itemPrice = document.createElement("h6");
    itemPrice.setAttribute("class", "text-muted mx-1 my-2");
    itemPrice.setAttribute("id", `item-price-${productNumber}`);
    itemPrice.setAttribute("data-price-item-id", productNumber);
    itemPrice.innerHTML = `${price} ks`;
    priceDiv.appendChild(itemPrice);

    cart.appendChild(cartItem);

    totalPrice += parseInt(price);
    (document.getElementById("total-price")).innerHTML = totalPrice;

    /** Enable Pay and Discard Button once there is at least one item in the cart */
    toggleButtonState(checkoutBtn, true);
    toggleButtonState(discardBtn, true);

    /* update the shopping cart object */
    updateShoppingCart({productNumber, name, price}, "add");
  }
}


/**
# If the item added to the cart is already existed in the cart, increase the item quantity.
# @param item -> item to be updated
# return int -> 0 if there is no existing item, non-zero positive number if the item exists and successfully updated
# return -> number of updated existing items
**/
function updateExistingItemsInCart (productNumber, price) {

  // get reference of cart dom
  const cart = document.getElementById("cart");
  // get qty element
  const existingItems = cart.querySelectorAll(`[data-qty-item-id="${productNumber}"]`);

  if (existingItems.length > 0) {
    const currentQty = existingItems[0].innerHTML;

    existingItems[0].innerHTML = parseInt(currentQty) + 1;

    // update price for the cart item
    const priceDOM = cart.querySelectorAll(`[data-price-item-id="${productNumber}"]`)[0].innerHTML;

    const priceTag = (priceDOM.split('').slice(0, priceDOM.length - 3)).join('');

    (document.getElementById(`item-price-${productNumber}`)).innerHTML = `${parseInt(price) + parseInt(priceTag)} ks`;

    // update total price for the cart
    totalPrice += price;
    (document.getElementById("total-price")).innerHTML = totalPrice;

    /* update the shopping cart object */
    updateShoppingCart({productNumber, price}, "add");

    return parseInt(currentQty);
  }

  return 0;
}


/**
# Create Quantity Division with increment/decrement actions
**/
function createQuantityDivision (qty, productNumber, price) {

  const div = document.createElement("div");
  div.setAttribute("class", "d-flex justify-content-between align-items-center");

  const decrementButton = document.createElement("button");
  decrementButton.setAttribute("class", "btn btn-secondary text-white");
  decrementButton.setAttribute("onclick", reduceQuantityInCart());
  decrementButton.innerHTML = `<i class="fas fa-minus"></i>`;
  div.appendChild(decrementButton);

  const qtyText = document.createElement("h6");
  qtyText.setAttribute("class", "px-2 text-muted");
  qtyText.setAttribute("data-qty-item-id", productNumber);
  qtyText.innerHTML = qty;
  div.appendChild(qtyText);

  const incrementButton = document.createElement("button");
  incrementButton.setAttribute("class", "btn btn-secondary text-white");
  // incrementButton.setAttribute("onclick", "increaseQuantityInCart()");
  incrementButton.innerHTML = `<i class="fas fa-plus"></i>`;
  div.appendChild(incrementButton);


  incrementButton.addEventListener("click", e => {
    increaseQuantityInCart(productNumber, price);
  });


  decrementButton.addEventListener("click", e => {
    reduceQuantityInCart(productNumber, price);
  })

  return div;
}


/**
# Reduce Item Quantity in cart
**/
function reduceQuantityInCart (productNumber, price) {
  const existingItems = cart.querySelectorAll(`[data-qty-item-id="${productNumber}"]`);

  if (existingItems.length > 0) {
    const currentQty = existingItems[0].innerHTML;

    existingItems[0].innerHTML = parseInt(currentQty) - 1;

    if ((currentQty - 1) === 0) {
      // remove product from cart
      const cartItem = document.getElementById(`data-item-${productNumber}`);
      if (cartItem) cartItem.remove();
    }
    else {
      // update price for the cart item
      const priceDOM = cart.querySelectorAll(`[data-price-item-id="${productNumber}"]`)[0].innerHTML;

      const priceTag = (priceDOM.split('').slice(0, priceDOM.length - 3)).join('');

      (document.getElementById(`item-price-${productNumber}`)).innerHTML = `${parseInt(priceTag) - price} ks`;
    }

    updateShoppingCart({productNumber, price}, "remove");

    totalPrice -= price;
    (document.getElementById("total-price")).innerHTML = totalPrice;
  }
}


/**
# Increase Item Quantity in cart
**/
function increaseQuantityInCart (productNumber, price) {
  const existingItems = cart.querySelectorAll(`[data-qty-item-id="${productNumber}"]`);

  if (existingItems.length > 0) {
    const currentQty = existingItems[0].innerHTML;

    existingItems[0].innerHTML = parseInt(currentQty) + 1;

    // update price for the cart item
    const priceDOM = cart.querySelectorAll(`[data-price-item-id="${productNumber}"]`)[0].innerHTML;

    const priceTag = (priceDOM.split('').slice(0, priceDOM.length - 3)).join('');

    (document.getElementById(`item-price-${productNumber}`)).innerHTML = `${parseInt(priceTag) + price} ks`;

    updateShoppingCart({productNumber, price}, "add");

    totalPrice += price;
    (document.getElementById("total-price")).innerHTML = totalPrice;
  }
}



/**
# Update Shopping Cart
**/
function updateShoppingCart (newItem, method) {

  // check if the new Item is already exists in the cart
  // if then increase the qty and price, otherwise add new
  const item = shoppingCart.items.find( i => i.productNumber === newItem.productNumber);

  if (item) {
    if (method === "add") {
      // increase the qty
      // re-calculate the price
      shoppingCart.items = shoppingCart.items.map (
        i => i.productNumber === newItem.productNumber
        ? {
          ...i,
          qty: (i.qty + 1),
          price: (i.price + newItem.price)
        }
        : i
      );
    }
    else {
      // Remove item from shopping cart
      // console.log("Remove Existing Items");
      const currentQty = item.qty;

      if (currentQty > 1) {
        shoppingCart.items = shoppingCart.items.map (
          i =>
          i.productNumber === newItem.productNumber
          ? {
            ...i,
            qty: (i.qty - 1),
            price: (i.price - newItem.price)
          }
          : i
        );
      }
      else {
        // remove item from array
        shoppingCart.items = shoppingCart.items.filter (
          i => i.productNumber !== newItem.productNumber
        );
      }

    }

  }
  else {
    // add new
    shoppingCart.items.push({
      productNumber: newItem.productNumber,
      name: newItem.name,
      qty: 1,
      price: parseInt(newItem.price)
    });
  }

  // update total
  if (method === "add")
    shoppingCart.total += parseInt(newItem.price);
  else
    shoppingCart.total -= parseInt(newItem.price);
}

/**
# Toggle Button State -> Disabled/enabled
**/
function toggleButtonState(btn, enabled) {

  if (enabled) {
    if (btn) btn.removeAttribute("disabled"); // enable
  }
  else {
    if (btn) btn.setAttribute("disabled", true); // disable
  }
}


/**
# Show or Hide buttons
**/
function showHideButtons(btn, show) {
  if (show) {
    if (btn) btn.style.display = "block";
  }
  else {
    if (btn) btn.style.display = "none";
  }
}


/*=============================================================
==================== Show Search Results ======================
=============================================================*/

function displaySearchResults (products, q) {
  const container = document.getElementById("search-results");

  clearSearchContainer(container);

  if (products.length === 0) {
    showEmptyResult (container, q);
  }
  else {
    products.forEach(
      product => {
        const div = document.createElement("div");
        const h6 = document.createElement("h6");
        h6.setAttribute("class", "text-muted mb-3");
        h6.innerHTML = product.name;
        div.appendChild(h6);

        createSingleRow(div, "Category", product.category);

        createSingleRow(div, "Ingredients", product.description);

        createRow(div, ["Location", "Product Number", "Price"], [product.location, product.productNumber, product.price]);

        createRow(div,
          ["Quantity", "Doctor Approve", "Expiry"],
          [product.qty, product.approve, (new Date(product.expiry)).toLocaleDateString()]);

        container.appendChild(div);
        container.appendChild(document.createElement("hr"));
      }
    );
  }
}

function createSingleRow (parent, title, value) {
  const div = document.createElement("div");
  div.setAttribute("class", "mb-3");

  const titleDOM = document.createElement("h6");
  titleDOM.setAttribute("class", "text-muted");
  titleDOM.innerHTML = title;

  const valueDOM = document.createElement("span");
  valueDOM.setAttribute("class", "mb-3");
  valueDOM.innerHTML = value;

  div.appendChild(titleDOM);
  div.appendChild(valueDOM);

  parent.appendChild(div);
}


function createRow (parent, titles, values) {
  const row = document.createElement("div");
  row.setAttribute("class", "row mb-3");

  for (let i = 0; i < 3; i++) {
    createCol(row, titles[i], values[i]);
  }

  parent.appendChild(row);
}

function createCol (parent, title, value) {
  const col = document.createElement("div");
  col.setAttribute("class", "col");

  const titleDOM = document.createElement("h6");
  titleDOM.setAttribute("class", "text-muted");
  titleDOM.innerHTML = title;

  const valueDOM = document.createElement("span");
  valueDOM.innerHTML = value;

  col.appendChild(titleDOM);
  col.appendChild(valueDOM);

  parent.appendChild(col);
}


function showEmptyResult (container, q) {
  if (container) {
    const emptyAlert = document.createElement("div");
    emptyAlert.setAttribute("class", "alert alert-info");
    emptyAlert.innerHTML = `No product(s) found with keyword, ${q}`;

    container.appendChild(emptyAlert);
  }
}


/** clear results container to make room for new results **/
function clearSearchContainer (container) {
  if (container) {
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
  }
}


/*=============================================================
======================== Validations ==========================
=============================================================*/

/**
# Validate Shopping Cart Before Checkout
@return -> object: {error: boolean, message: string}
**/
function validateCheckOut () {

  const { change, employee, employeeID, payment, total } = shoppingCart;
  console.log(change, parseInt(change) < 0)
  if (!total || parseInt(total) <= 0)
    return { error: true, message: "Invalid Total Price. Please Check the Cart."};

  if (!payment || parseInt(payment) <= 0)
    return { error: true, message: "Invalid Price. Please Check the give amount."};

  if (parseInt(change) < 0)
    return { error: true, message: "Incorrect Payment. Please check the given amount and change."};

  if (employee === null || employee === '')
    return { error: true, message: "Invalid Employee Name. Empty Name or Not Valid!"};

  if (employeeID === null || employeeID === '')
    return { error: true, message: "Invalid Employee ID. Empty ID or Not Valid!"};

  return { error: false };
}


/*=============================================================
====================== Alerts and Errors ======================
=============================================================*/


function onLoadPage (content, loading) {
  content.style.display = "none";
  loading.style.display = "flex";
}

function onDidLoadedPage (content, loading) {
  content.style.display = "block";
  loading.remove();
}

/**
 Clear cart
**/
function clearCart() {

  const cart = document.getElementById("cart");
  
  // remove all child nodes
  while (cart.lastChild) {
    cart.removeChild(cart.lastChild);
  }

  //reload change due and given amount
  reloadAmount();
  

  /** disable all actions buttons */
  toggleButtonState(checkoutBtn, enabled=false);
  toggleButtonState(printBtn, enabled=false);
  toggleButtonState(discardBtn, enabled=false);
}

//reload givenAmount, changeDue after cart is cleared
function reloadAmount() {

  var givenAmount = document.getElementById('given-amount');
  var changeDue = document.getElementById('change-return');
  
  shoppingCart.total = 0;
  shoppingCart.payment = 0;
  shoppingCart.change = 0;
  
  givenAmount.value = shoppingCart.payment;
  changeDue.innerHTML = shoppingCart.change;
  //console.log(givenAmount);


}


/**
# Add Empty Message Box
**/
function addEmptyMessageBox() {
  const msgBox = document.createElement("div");
  msgBox.setAttribute("class", "alert alert-info text-center");
  msgBox.setAttribute("id", "empty-msg-box");
  msgBox.setAttribute("role", "alert");
  msgBox.innerHTML = "Card is Cleared!";

  const cart = document.getElementById("cart");
  cart.appendChild(msgBox);
}

/** Remove Informative message box from shopping cart if any **/
function removeMessageBoxesFromCart () {
  const emptyMessageBox = document.getElementById("empty-msg-box");
  if (emptyMessageBox)
    emptyMessageBox.remove();
}


function showErrorMessage (container, show, message) {
  if (container) {
    if (show) {
      container.style.display = "block";
      container.innerHTML = message;
    }
    else {
      container.style.display = "none";
    }
  }
}


function showHidePostPaymentLoading (dom, state) {
  // removeCheckOutError();
  dom.style.display = (state === "show") ? "flex" : "none";
}


function displayCheckOutError (message) {

  const loadingCheckout = document.getElementById("check-out-loading");
  if (loadingCheckout)
    loadingCheckout.style.display = "none";

  const checkoutError = document.getElementById("checkout-error");
  checkoutError.style.display = "block";

  const checkOutErrorMessage = document.getElementById("checkout-error-msg");
  checkOutErrorMessage.innerHTML = message;
}

function removeCheckOutError () {
  const checkOutError = document.getElementById("checkout-error");
  if (checkOutError)
    checkOutError.style.display = "none";
}


/*=============================================================
======================= Network Requests ======================
=============================================================*/

// get item by product code
async function getItemByProductCode (code) {
  try {
    const response = await fetch(`${serverUrl}/api/meds/exact-search?productNumber=${code}`, {
      method: "GET",
      headers: {
        "Content-Type" : "application/json",
        "Accept" : "application/json"
      }
    });

    return response;
  }
  catch (error) {
    console.error("Error getting item by product code", error);
  }
}


// search products
async function searchProducts (q) {
  try {
    const response = await fetch(`${serverUrl}/api/meds/checkout?q=${q}`, {
      method: "GET",
      headers: {
        "Content-Type" : "application/json",
        "Accept" : "application/json"
      }
    });

    return response;
  }
  catch (error) {
    console.error("Error searching items", error);
  }
}


/*=============================================================
===================== Clean Up Functions ======================
=============================================================*/

function cleanUp() {
  window.cashierAPI.removeListeners();
}
