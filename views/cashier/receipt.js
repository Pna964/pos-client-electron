/**
# Script File for receipt
**/

// DOM Nodes
const invoiceNumber = document.getElementById("invoice-no");
const cashierName = document.getElementById("cashier-name");
const patientName = document.getElementById("patient-name");
const transactionDate = document.getElementById("transaction-date");
const transactionTime = document.getElementById("transaction-time");
const totalAmount = document.getElementById("total-amount");
const givenAmount = document.getElementById("given-amount");
const changeAmount = document.getElementById("change-due");


window.receiptAPI.receive("invoice", invoice => {

  loadHeader(invoiceNumber, invoice.invoiceNumber);
  loadHeader(cashierName, invoice.cashier);
  loadHeader(patientName, invoice.customerID);
  loadHeader(transactionDate, (new Date()).toLocaleDateString());
  loadHeader(transactionTime, (new Date()).toLocaleTimeString());

  invoice.cartItems.forEach( item => {
    createCartItem(item);
  });

  loadPrice(totalAmount, "Total Amount", invoice.payableAmount);
  loadPrice(givenAmount, "Given Amount", invoice.givenAmount);
  loadPrice(changeAmount, "Change Amount", invoice.changeAmount);

  const printOptions = JSON.parse(window.localStorage.getItem("printOptions"));

  window.receiptAPI.send("print", printOptions);
});


function loadHeader (dom, value) {
  dom.innerHTML = `${dom.innerHTML} <strong>${value}</strong>`;
}


function loadPrice (dom, title, value) {
  dom.innerHTML = `${value}ks : <strong>${value}ks</strong>`;
}


function createCartItem (item) {
  const tBody = document.getElementById("tbody");

  createDescTd(tBody, item.productName);
  createInfoTableCells(tBody, item);
}

function createDescTd (tBody, description) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.setAttribute("style", "width: 100px;");
  td.setAttribute("colspan", "3");
  td.innerHTML = `<small><strong>${description}</strong></small>`;

  tr.appendChild(td);
  tBody.appendChild(tr);
}

function createInfoTableCells (tBody, item) {
  const tr = document.createElement("tr");
  tr.setAttribute("class", "mb-1");

  const unitPrice = document.createElement("td");
  unitPrice.innerHTML = `<small><strong>${item.price}</strong></small>`;
  tr.appendChild(unitPrice);

  const qty = document.createElement("td");
  qty.innerHTML = `<small><strong>${item.qty}</strong></small>`;
  tr.appendChild(qty);

  const totalPrice = document.createElement("td");
  totalPrice.innerHTML = `<small><strong>${item.totalPrice}</strong></small>`;
  tr.appendChild(totalPrice);

  tBody.appendChild(tr);
}
