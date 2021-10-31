// alert(`Welcome. Check in time: ${new Date()}\nPlease check if date and time are correct.`);


// DUMMY Data
const items = [
  {
    id: "1234ac",
    name: "Panadol",
    price: 1200
  },
  {
    id: "1231ac",
    name: "Dicogen",
    price: 1000
  },
  {
    id: "1214ac",
    name: "Biogesic",
    price: 800
  },
  {
    id: "1235ac",
    name: "Fluza",
    price: 1300
  },
  {
    id: "2234ac",
    name: "Konidin",
    price: 1600
  },
  {
    id: "1634ac",
    name: "Oramin-G",
    price: 2000
  },
  {
    id: "1114ac",
    name: "Surgical Mask",
    price: 1500
  },
]

// DOM Nodes
const addItemBtn = document.getElementById("add-item");
const addFeesBtn = document.getElementById("add-fees");
const checkoutBtn = document.getElementById("checkout-btn");
const payBtn = document.getElementById("pay-btn");
const discardBtn = document.getElementById("discard-btn");
const printBtn = document.getElementById("print-btn");
const checkoutModal = document.getElementById("checkout-modal");
const memberCheckoutBtn = document.getElementById("member-checkout-btn");
const normalCheckoutBtn = document.getElementById("normal-checkout-btn");
let totalPrice = 0;


/**
# Once the window loads up, disable all three action buttons
**/
showHideButtons(payBtn, show=false); // hide the paybtn
toggleButtonState(checkoutBtn, false);
toggleButtonState(payBtn, false);
toggleButtonState(printBtn, false);
toggleButtonState(discardBtn, false);


function logoutToMainMenu() {
  window.cashierAPI.send('cashier-close', 'cart');
}



/**
# add medicines to cart
**/
addItemBtn.addEventListener("click", e => {

  const itemInput = document.getElementById("item-input").value;

  if (!itemInput || itemInput === '')
    return;

  // disable the button to prevent the user's multiple click actions
  addItemBtn.setAttribute("disabled", true);
  addItemBtn.innerHTML = "Loading...";
  removeMessageBox();

  const item = getItem (itemInput);
  if (item !== null) {
    addItemToCart(item);
  }


  addItemBtn.removeAttribute("disabled");
  addItemBtn.innerHTML = "Add Item";
});


/**
# add clinic fees
**/
addFeesBtn.addEventListener("click", e => {
  // console.log("clicl");
  removeMessageBox();

});


/**
# Clear the cart when discard button is pressed
**/
discardBtn.addEventListener("click", e => {
  clearCart();
});


/**
# Checkout
**/
checkoutBtn.addEventListener("click", e => {
  checkoutModal.style.display = "flex";
});


/**
# Member Checkout
**/
memberCheckoutBtn.addEventListener("click", e => {
  /** request for member checkout(information) window */
  checkoutModal.style.display = "none";
  window.cashierAPI.send("member-checkout-window", "");
});


/**
# Normal Checkout
**/
normalCheckoutBtn.addEventListener("click", e => {
  /** Just dismiss the modal and proceed */
  checkoutModal.style.display = "none";
  showHideButtons(payBtn, show=true);
  showHideButtons(checkoutBtn, show=false);
  toggleButtonState(payBtn, enabled=true);
  toggleButtonState(printBtn, enabled=true); // enable print btn to print receipt
  toggleButtonState(checkoutBtn, enabled=false); // disable pay button
  toggleButtonState(discardBtn, enabled=false); // disable discard Button
});



/**
# Remove Cart Empty Message
**/
function removeMessageBox() {
  const messageBox = document.getElementsByClassName("alert")[0];

  if (messageBox) messageBox.remove();
}



/**
# Add Items to the Cart
**/
function addItemToCart ({id, name, price}) {
  const cart = document.getElementById("cart");

  const itemsUpdated = updateExistingItemsInCart({id, price});
  // console.log(itemsUpdated);

  if (itemsUpdated == 0) {
    /** create new cart item */
    const cartItem = document.createElement("div");
    cartItem.setAttribute("class", "p-2 bg-light my-1 row");
    cartItem.setAttribute("id", `data-item-${id}`);

    const quantityDiv = document.createElement("div");
    quantityDiv.setAttribute("id", "item-qty-div");
    quantityDiv.setAttribute("class", "col");
    cartItem.appendChild(quantityDiv);

    const itemNameDiv = document.createElement("div");
    itemNameDiv.setAttribute("class", "col-6");
    cartItem.appendChild(itemNameDiv);

    const priceDiv = document.createElement("div");
    priceDiv.setAttribute("class", "col");
    cartItem.appendChild(priceDiv);

    // item quantity
    const itemQty = createQuantityDivision(1, id, price);
    quantityDiv.appendChild(itemQty);

    // item name
    const itemName = document.createElement("h6");
    itemName.setAttribute("class", "text-muted mx-1 my-2");
    itemName.innerHTML = name;
    itemNameDiv.appendChild(itemName);

    // item price
    const itemPrice = document.createElement("h6");
    itemPrice.setAttribute("class", "text-muted mx-1 my-2");
    itemPrice.setAttribute("id", `item-price-${id}`);
    itemPrice.setAttribute("data-price-item-id", id);
    itemPrice.innerHTML = `${price} ks`;
    priceDiv.appendChild(itemPrice);

    cart.appendChild(cartItem);

    totalPrice += parseInt(price);
    (document.getElementById("total-price")).innerHTML = totalPrice;

    /** Enable Pay and Discard Button once there is at least one item in the cart */
    toggleButtonState(checkoutBtn, true);
    toggleButtonState(discardBtn, true);
  }
}


/**
# If the item added to the cart is already existed in the cart, increase the item quantity.
# @param item -> item to be updated
# return int -> 0 if there is no existing item, non-zero positive number if the item exists and successfully updated
# return -> number of updated existing items
**/
function updateExistingItemsInCart ({id, price}) {

  // get reference of cart dom
  const cart = document.getElementById("cart");

  const existingItems = cart.querySelectorAll(`[data-qty-item-id="${id}"]`);

  if (existingItems.length > 0) {
    const currentQty = existingItems[0].innerHTML;
    console.log(currentQty);

    existingItems[0].innerHTML = parseInt(currentQty) + 1;

    // update price for the cart item
    const priceDOM = cart.querySelectorAll(`[data-price-item-id="${id}"]`)[0].innerHTML;

    const priceTag = (priceDOM.split('').slice(0, priceDOM.length - 3)).join('');

    (document.getElementById(`item-price-${id}`)).innerHTML = `${2 * parseInt(priceTag)} ks`;

    // update total price for the cart
    totalPrice += price;
    (document.getElementById("total-price")).innerHTML = totalPrice;

    return parseInt(currentQty);
  }

  return 0;
}


/**
# Create Quantity Division with increment/decrement actions
**/
function createQuantityDivision (qty, id, price) {

  const div = document.createElement("div");
  div.setAttribute("class", "d-flex justify-content-between align-items-center");

  const decrementButton = document.createElement("button");
  decrementButton.setAttribute("class", "btn btn-primary");
  decrementButton.setAttribute("onclick", reduceQuantityInCart());
  decrementButton.innerHTML = `<i class="fas fa-minus"></i>`;
  div.appendChild(decrementButton);

  const qtyText = document.createElement("h6");
  qtyText.setAttribute("class", "text-muted");
  qtyText.setAttribute("data-qty-item-id", id);
  qtyText.innerHTML = qty;
  div.appendChild(qtyText);

  const incrementButton = document.createElement("button");
  incrementButton.setAttribute("class", "btn btn-primary");
  // incrementButton.setAttribute("onclick", "increaseQuantityInCart()");
  incrementButton.innerHTML = `<i class="fas fa-plus"></i>`;
  div.appendChild(incrementButton);


  incrementButton.addEventListener("click", e => {
    increaseQuantityInCart(id, price);
  });


  decrementButton.addEventListener("click", e => {
    reduceQuantityInCart(id, price);
  })

  return div;
}


/**
# Reduce Item Quantity in cart
**/
function reduceQuantityInCart (id, price) {
  const existingItems = cart.querySelectorAll(`[data-qty-item-id="${id}"]`);

  if (existingItems.length > 0) {
    const currentQty = existingItems[0].innerHTML;
    console.log(currentQty);

    existingItems[0].innerHTML = parseInt(currentQty) - 1;

    if ((currentQty - 1) === 0) {
      // remove product from cart
      const cartItem = document.getElementById(`data-item-${id}`);
      if (cartItem) cartItem.remove();
    }

    // update price for the cart item
    const priceDOM = cart.querySelectorAll(`[data-price-item-id="${id}"]`)[0].innerHTML;

    const priceTag = (priceDOM.split('').slice(0, priceDOM.length - 3)).join('');
    console.log(parseInt(priceTag));

    (document.getElementById(`item-price-${id}`)).innerHTML = `${parseInt(priceTag) - price} ks`;

    totalPrice -= price;
    (document.getElementById("total-price")).innerHTML = totalPrice;
  }
}


/**
# Increase Item Quantity in cart
**/
function increaseQuantityInCart (id, price) {
  const existingItems = cart.querySelectorAll(`[data-qty-item-id="${id}"]`);

  if (existingItems.length > 0) {
    const currentQty = existingItems[0].innerHTML;
    console.log(currentQty);

    existingItems[0].innerHTML = parseInt(currentQty) + 1;

    // update price for the cart item
    const priceDOM = cart.querySelectorAll(`[data-price-item-id="${id}"]`)[0].innerHTML;

    const priceTag = (priceDOM.split('').slice(0, priceDOM.length - 3)).join('');

    (document.getElementById(`item-price-${id}`)).innerHTML = `${parseInt(priceTag) + price} ks`;

    totalPrice += price;
    (document.getElementById("total-price")).innerHTML = totalPrice;
  }
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

  /** disable all actions buttons */
  toggleButoonState(checkoutBtn, enabled=false);
  toggleButtonState(printBtn, enabled=false);
  toggleButtonState(payBtn, enabled=false);
  toggleButtonState(discardBtn, enabled=false);
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


/**
# Get item from the database
**/
function getItem (itemCode) {
  let item = null;
  for (let i of items) {
    console.log(i.id, itemCode, i.id===itemCode);
    if (i.id === itemCode) {
      item = i;
      break;
    }
  }

  return item;
}
