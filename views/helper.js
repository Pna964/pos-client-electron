// helper functions
const { ipcRenderer } = require('electron');
const { getAllItems } = require('./requests/itemRequests.js');
const { getAllUsers } = require('./requests/userRequests.js');


// DOM Nodes
const container = document.getElementById('register-user');
const mainPage = document.getElementById('main-container');
const contents = document.getElementById('contents');
const contentTitle = document.getElementById('content-title');

let newNode



function showAlert({type, data, method}) {
  const alertBox = document.getElementById('alert');
  alertBox.style.display = 'block';

  alertBox.innerHTML = `New ${type} ${method}: ${data.username}`;
}

// fetch users from main process and render in the renderer process
function fetchUsers() {
  getAllUsers() // fetch users from main process
    .then(users => {
      users.forEach( user => {
        populateUserTable(user);
      });
    })
    .catch(error => console.log(error));
}

function fetchItems() {
  getAllItems() // fetch users from main process
    .then(items => {
      items.forEach( item => {
        populateItemTable(item);
      });
    })
    .catch(error => console.log(error));
}

function populateItemTable({id, description, expireDate, quantity, location}) {
  const itemTable = document.getElementById('item-table');
  const row = itemTable.insertRow(id);
  const firstColumn = row.insertCell(0);
  const secondColumn = row.insertCell(1);
  const thirdColumn = row.insertCell(2);
  const fourthColumn = row.insertCell(3);
  const fifthColumn = row.insertCell(4);
  const sixthColumn = row.insertCell(5);
  firstColumn.innerHTML = id;
  secondColumn.innerHTML = description;
  thirdColumn.innerHTML = expireDate;
  fourthColumn.innerHTML = quantity;
  fifthColumn.innerHTML = location;
  sixthColumn.innerHTML = '<div><button class="mx-1 action-button">View</button>' +
    '<button class="mx-1 action-button">Edit</button></div>'

}

function populateUserTable({id, username}) {
  const userTable = document.getElementById('user-table');

  const row = userTable.insertRow(id);
  const firstColumn = row.insertCell(0);
  const secondColumn = row.insertCell(1);
  const thirdColumn = row.insertCell(2);
  firstColumn.innerHTML = id;
  secondColumn.innerHTML = username;
  /* edit button */
  const editBtn = document.createElement('button');
  editBtn.setAttribute('class', 'btn mx-1 btn-primary');
  editBtn.setAttribute('data-id', id);
  editBtn.innerHTML = 'EDIT';
  thirdColumn.appendChild(editBtn);

  editBtn.addEventListener('click', e => {
    console.log('id', id);
    ipcRenderer.send('user-data', {id, method: 'PUT'});
  });

  /* View Details button */
  const viewBtn = document.createElement('button');
  viewBtn.setAttribute('class', 'btn mx-1 btn-info');
  viewBtn.setAttribute('data-id', id);
  viewBtn.innerHTML = 'View More Details';
  thirdColumn.appendChild(viewBtn);

  viewBtn.addEventListener('click', e => {
    ipcRenderer.send('user-data', {id, method: 'GET'});
  })
}

function editOnClick() {
  alert('on click');
}

// if admin user login is successful, redirect into admin pannel
exports.redirectToAdminPannel = async function redirectToAdminPannel(pageName) {
  try {
    mainPage.style.display = 'none';
    contents.style.display = 'block';
    contentTitle.innerText = 'Pharmacy';

    // IMPORTANT *** set new page filename as [pagename].html. for example inventory.html ***

    // fetch HTML data related to the page name
    const response = await fetch(`${pageName}/${pageName}.html`);

    const data = await response.text();

    newNode = document.createElement('div');

    // load newly fetched html and script inside into app content
    setInnerHTML(newNode, data);

    contents.appendChild(newNode);

    // fetch contents based on the page name
    await fetchContents(pageName);
  }
  catch (error) {
    console.log(error);
  }
}


// load newly fetched html and script inside into app content
function setInnerHTML(elm, html) {
  elm.innerHTML = html;

  // get the current script element from the newly fetched html content
  Array.from(elm.querySelectorAll('script')).forEach( currentScript => {
    console.log(currentScript);
    // create new script element
    const newScript = document.createElement('script');
    // get attributes from the current script
    Array.from(currentScript.attributes).forEach( attribute => {
      // set the current script attributes to new script
      newScript.setAttribute(attribute.namem, attribute.value);
    });
    // import all functions and contents of current script into newly created script
    newScript.appendChild(document.createTextNode(currentScript.innerHTML));
    // replace the new script with current script (aka) load new script for new app content
    (currentScript.parentNode).replaceChild(newScript, currentScript);
  });
}


async function fetchContents(dataType) {
  // fetch and fill contents into app window, based on the page name
  switch (dataType) {
    case 'user':
      // fetch users
      await fetchUsers();
      break;
    case 'inventory':
      // fetch inventory
      await fetchItems();
      break;
    case 'setting':
      // show setting page
      break;
    default:
      throw new Error('Unkown Page Name Received');
  }
}


exports.reloadData = async function reloadData(newData) {
  try {
    const { type, data, method } = newData;

    // get table rows from the current data table
    const oldData = newNode.querySelectorAll('tr');
    // excpet the table header, remove all the data
    oldData.forEach( (node, idx) =>  idx !== 0 && node.remove());

    // reload the data by fetching data based on the data type, and populate the table again
    await fetchContents(type);

    showAlert(newData);

  }
  catch (error) {
    console.log(`Error Reloading ${data} data`, error);
  }
}


exports.logoutToMainMenu = async function logoutToMainMenu() {
  try {
    contents.style.display = 'none';
    contents.removeChild(newNode);
    mainPage.style.display = 'flex';
  }
  catch (error) {
    console.log(error);
  }
}
