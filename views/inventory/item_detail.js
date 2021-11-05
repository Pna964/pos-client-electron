let medNumber, medDesc, medPrice, medQty, medExp, medApprove, medTag;
let editMedButton, saveButton, backButton;
let editing = false;
let editingID;

window.onload = function () {
    let status = "ready";
    const allDetails = document.getElementById("all-detail-item-contents");
    const medDetails = document.getElementById("med-details");
    const cancelButton = document.getElementById("dismiss-window");
    backButton = document.getElementById("back");
    medNumber = document.getElementById("medNumber");
    medDesc = document.getElementById("medDesc");
    medPrice = document.getElementById("medPrice");
    medQty = document.getElementById("medQty");
    backButton = document.getElementById("back");
    medExp = document.getElementById("medExp");
    medTag = document.getElementById("medTag");
    medApprove = document.getElementById("medApprove");
    editMedButton = document.getElementById("edit-medicine");
    saveButton = document.getElementById("save-edit");

    saveButton.style.display = "none";
    medDetails.style.display = "none";

    window.detailInventoryAPI.receive('reload-data', async data => {

      if (status === 'ready') {
          status = 'reloading';
          (document.getElementById("heading")).innerHTML = data;
          await reloadData(data);
      }
    });

    backButton.addEventListener("click", e => {
      e.preventDefault();

      hideMedicineDetails();
    })

    const reloadData = async tagName => {

        try {
          const itemTable = document.getElementById("item-details-table");
          // const { type, data, method } = newData;

          // get table rows from the current data table
          const oldData = itemTable.querySelectorAll('tr');

          // excpet the table header, remove all the data
          oldData.forEach( (node, idx) =>  idx !== 0 && node.remove());

          // reload the data by fetching data based on the data type, and populate the table again
          const response = await getMedsByTag(tagName);

          if (response.ok) {
            const meds = await response.json();

            if (meds.length === 0) {
              showEmptyBox(tagName);
            }
            else {
              meds.forEach(
                med => displayMedicines(med)
              );
            }
          }
          else {
            const { message } = await response.json();
            if (message)
              alert(`Error Fetching Medicines: ${message}`);
            else
              alert("Error Fetching Medicines. code: 500");
          }

          status = 'ready';
        }
        catch (error) {
          alert("Error Fetching Medicines. code: null");
        }
      };

    const requestAllItems = async () => {

        try {
          const response = await window.detailInventoryAPI.invoke('get-all-detail-items');

          return response;
        }
        catch (error) {
          console.log('Error fetching all items', error);
        }
      };

    cancelButton.addEventListener("click", () => {
      window.detailInventoryAPI.send('dismiss-form-window', '');
    });

    editMedButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.target.innerHTML = e.target.innerHTML === "Cancel" ? "Edit" : "Cancel";
      editing = !editing;
      editMedicine();
    });

    saveButton.addEventListener("click", async e => {
      try {
        e.preventDefault();
        const data = {
          name: medDesc.value,
          price: parseInt(medPrice.value),
          qty: parseInt(medQty.value),
          expiry: medExp.value,
          medApprove: medApprove.value === "YES" ? true : false,
          tag: medTag.value,
          productNumber: medNumber.value
        };

        const response = await editMed(editingID, data);

        if (response.ok) {
          const updatedMed = await response.json();
          console.log(updatedMed);
        }
        else {
          const { message } = await response.json();
          if (message)
            alert(`Error Saving Changes: ${message}`);
          else
            alert("Error Saving Changes. code: 500");
        }
      }
      catch (error) {
        alert("Error Saving Changes. code: null");
      }
    });
}


/** display medicines **/
function displayMedicines (med, idx=1) {
  try {

    const { _id, name, productNumber, description, approve, expiry, qty, price } = med;

    const itemTable = document.getElementById("item-details-table");

    const row = itemTable.insertRow(idx);

    const firstColumn = row.insertCell(0);
    const secondColumn = row.insertCell(1);
    const thirdColumn = row.insertCell(2);
    const forthColumn = row.insertCell(3);
    const fifthColumn = row.insertCell(4);
    const sixthColumn = row.insertCell(5);

    secondColumn.innerHTML = name;
    if (productNumber) {
      firstColumn.innerHTML = productNumber;
    }
    else {
      firstColumn.innerHTML = "000000";
    }
    thirdColumn.innerHTML = (new Date(expiry)).toLocaleDateString();
    forthColumn.innerHTML = qty;
    fifthColumn.innerHTML = approve ? "YES" : "NO";
    sixthColumn.innerHTML = description ? description : "";

    row.addEventListener("click", event => {
      console.log("row click", _id);
      editingID = _id;
      showMedicineDetails(_id);
    });
  }
  catch (error) {
    alert ("Error Displaying Medicines. code : null");
  }
}


function showEmptyBox (tag) {
  try {
    const div = document.createElement("div");
    div.setAttribute("class", "alert alert-primary m-2 w-100 text-center");
    div.setAttribute("role", "alert");
    div.innerHTML = `No item(s) found with ${tag}`;

    (document.getElementById("med-contents")).appendChild(div);
  }
  catch (error) {
    alert ("Error Showing Empty Box");
  }
}

/***********************************************************************
####################### Medicine Details ###############################
***********************************************************************/
async function showMedicineDetails (id) {
  try {
    const allDetails = document.getElementById("all-detail-item-contents");
    const medDetails = document.getElementById("med-details");

    allDetails.style.display = "none";
    medDetails.style.display = "block";

    const response = await getMedById(id);

    if (response.ok) {
      const med = await response.json();
      console.log(med);
      displayMedInfo(med);
    }
    else {
      const { message } = await response.json();
      if (message)
        alert ("Erorr Showing Medicine Details.", message);
      else
        alert("Error Showing Medicine Details. code : 500");
    }
  }
  catch (error) {
    console.error (error);
    alert("Error Showing Medicine Details. code : null");
  }
}


function displayMedInfo (med) {
  medNumber.value = med.productNumber ? med.productNumber : "";
  medDesc.value = med.name;
  
  const dateFormat = new Date(med.expiry).toISOString();
  medExp.value = dateFormat.split("T")[0];
  medQty.value = parseInt(med.qty);
  medPrice.value = parseInt(med.price);
  medTag.value = (med.tag).join(", ");
  if (med.approve) {
    (document.getElementById("approve-yes")).setAttribute("selected", true);
    (document.getElementById("approve-no")).removeAttribute("selected");
  }
  else {
    (document.getElementById("approve-no")).setAttribute("selected", true);
    (document.getElementById("approve-yes")).removeAttribute("selected");
  }
}


function hideMedicineDetails () {
  const allDetails = document.getElementById("all-detail-item-contents");
  const medDetails = document.getElementById("med-details");

  allDetails.style.display = "block";
  medDetails.style.display = "none";
}


/** enable editable input and let user edit **/
function editMedicine () {
  const medDetails = document.getElementById("med-details");
  const inputs = medDetails.querySelectorAll("input");
  inputs.forEach(
    input => {
      if (editing) {
        if (saveButton) saveButton.style.display = "block";
        input.removeAttribute("readonly");
      }
      else {
        if (saveButton) saveButton.style.display = "none";
        input.setAttribute("readonly", true);
      }
    }
  );
  if (editing)
    medApprove.removeAttribute("disabled");
  else
    medApprove.setAttribute("disabled", true);
}

/***********************************************************************
####################### Network Requests ###############################
***********************************************************************/

/* Get Medicine By Tag Name */
async function getMedsByTag (tag) {
  try {
    console.log(tag);
    const response = await fetch(`http://127.0.0.1:8080/api/meds/by-tag?tag=${tag}`, {
      method: "GET",
      headers: {
        "Content-Type" : "application/json",
        "Accept" : "application/json"
      }
    });

    return response;
  }
  catch (error) {
    console.error(`Error fetching meds by tag. ${error}`);
  }
}

/** Get Medicine by Id */
async function getMedById (id) {
  try {
    const response = await fetch(`http://127.0.0.1:8080/api/meds/${id}`, {
      method: "GET",
      headers: {
        "Content-Type" : "application/json",
        "Accept" : "application/json"
      }
    });

    return response;
  }
  catch (error) {
    console.error("Error Getting Med By Id", error);
  }
}


/** Edit Medicine **/
async function editMed (id, med) {
  try {
    console.log(med);
    const response = await fetch(`http://127.0.0.1:8080/api/meds/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type" : "application/json",
        "Accept" : "application/json"
      },
      body: JSON.stringify(med)
    });

    return response;
  }
  catch (error) {
    console.error("Error Editing Medicines", error);
  }
}
