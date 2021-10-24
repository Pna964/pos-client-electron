console.log('Item Scripts Running..');

/*
  create userRenderer property and assign to the global window object
 */
// console.log(this, this === window);
itemRenderer = {
  /* renderer status */
  status: 'ready',
  /* fetch all user data */
  loadItemData: async () => {

    try {
      const response = await window.api.invoke('get-all-items');

      return response;
    }
    catch (error) {
      console.log('Error fetching all items', error);
    }
  },
  /* create new item */
  createItem: () => {
    window.api.send('create-modal', 'item');
  },
  onKeyUp: function onKeyUp(event) {
    if (event.key === 'Enter')
      window.itemRenderer.filterItems();
  },
  /* filter user data */
  filterItems: async () => {
    const q = document.getElementById('search-input').value;

    if (!q || q === '')
      return;

    try {
        const results = await window.api.invoke('search-data', {data: 'item', q});

        window.itemRenderer.displayFilteredResults(results);
    }
    catch (error) {
        console.log('Error filtering inventory data', error);
    }
  },
  /* reset filter */
  resetFilter: () => {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';

    /* remove the empty message box if the search results were found */
    const emptyMessageBox = document.getElementById('empty-message-box');
    if (emptyMessageBox)
      emptyMessageBox.remove();

    // window.api.send('form-data-finish', {method: 'GET', type: 'user'});
    window.itemRenderer.reloadData({method: 'GET', type: 'item'});
  },
  /* reload data after every mutation event on item data */
  reloadData: async newData => {

    try {
      const { type, data, method } = newData;

      // get table rows from the current data table
      const oldData = newNode.querySelectorAll('tr');

      // excpet the table header, remove all the data
      oldData.forEach( (node, idx) =>  idx !== 0 && node.remove());

      // reload the data by fetching data based on the data type, and populate the table again
      const items = await window.itemRenderer.loadItemData();

      items.forEach( item => window.itemRenderer.populateItemTable(item));

      if (method === 'CREATE' || method === 'UPDATE')
        window.api.showNotification(newData);

      window.itemRenderer.status = 'ready';
    }
    catch (error) {
      console.log(`Error Reloading ${newData.type} data`, error);
    }
  },
  /* display filtered results */
  displayFilteredResults: (results) => {
    // get table rows from the current data table
    const oldData = document.querySelectorAll('tr');

    // get rid of the empty-message-box if avaialble
    const emptyMessageBox = document.getElementById('empty-message-box');
    if (emptyMessageBox) emptyMessageBox.remove();

    // excpet the table header, remove all the data
    oldData.forEach( (node, idx) =>  idx !== 0 && node.remove());

    

    if (results.length > 0)
      results.forEach( (result, idx) => window.itemRenderer.populateItemTable(result, idx + 1));
    else
      window.itemRenderer.showEmptyMessage();
  },
  /* display the user data in the table */
  populateItemTable: ({id, description, expireDate, quantity, location}, idx=1) => {
    const itemTable = document.getElementById('item-table');

    const row = itemTable.insertRow(idx);
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
    /* edit button */
    const editBtn = document.createElement('button');
    editBtn.setAttribute('class', 'btn mx-1 btn-primary');
    editBtn.setAttribute('data-id', id);
    editBtn.innerHTML = 'EDIT';
    sixthColumn.appendChild(editBtn);

    editBtn.addEventListener('click', e => {
      window.api.send('item-data', {id, method: 'PUT'});
    });
    /* View Details button */
    const viewBtn = document.createElement('button');
    viewBtn.setAttribute('class', 'btn mx-1 btn-info');
    viewBtn.setAttribute('data-id', id);
    viewBtn.innerHTML = 'View More Details';
    sixthColumn.appendChild(viewBtn);

    viewBtn.addEventListener('click', e => {
      window.api.send('item-data', {id, method: 'GET'});
    })
  },
  showEmptyMessage: () => {
    const searchInput = document.getElementById('search-input');
    const dataContainer = document.getElementById('data-container');
    const div = document.createElement('div');
    div.setAttribute('id', 'empty-message-box');
    div.setAttribute('class', 'alert alert-info');
    div.setAttribute('role', 'alert');
    div.innerHTML = `No result found related to ${searchInput.value}`;
    dataContainer.appendChild(div);
  },
  exportCSV: () => {
    console.log('Export CSV');
    window.api.send('export-csv', 'item');
  }
};


/* this IIFE will run whenever the inventory page contents are loaded */
(async function(window) {
  const items = await window.itemRenderer.loadItemData();

  items.forEach( item => window.itemRenderer.populateItemTable(item));
})(window);


window.api.receive('reload-data', async data => {

  if (window.itemRenderer.status === 'ready') {
      window.itemRenderer.status = 'reloading';
      await window.itemRenderer.reloadData(data);
  }
})