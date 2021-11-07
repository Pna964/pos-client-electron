/**
# Preview Data Before Export
**/

const path = require("path");
const {
  ipcMain,
  dialog,
  BrowserWindow
} = require("electron");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


let win


exports.createPreviewWindow = function (parent, data) {

  if (!win) {
    win = new BrowserWindow({
      width: 1200,
      height: 900,
      show: false,
      parent,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "../preload_scripts/previewPreload.js")
      }
    });
  }
  else {
    win.focus();
  }


  win.loadFile(path.join(__dirname, "../views/inventory/preview.html"));
  

  win.on("ready-to-show", () => win.show());

  win.on("close", () => {
    if (win) {
      cleanUpWindow(["export-data"]);
      win = null;
    }
  });


  win.webContents.on("did-finish-load", () => {
    win.webContents.send("preview-data", data);
  });


  ipcMain.on("export-data", async (event, args) => {
    try {

      const dest = await dialog.showSaveDialog({
        filters: [
          { name: 'CSV files', extensions: ['csv']}
        ]
      });

      if (dest.canceled) return;

      exportCSV(dest.filePath, args)
        .then(() => {
          // show info dialog after successful export
          dialog.showMessageBox ({
            title: 'CSV File Exported',
            message: `File saved in ${dest.filePath}`
          });
          win.close();
        })
        .catch(
          erorr => {
            console.log('Error Exporting csv file ->', error);
            alert(`Error exporting data. ${error}`);
          }
        );

    }
    catch(error) {
      console.log('Error Exporting csv file ->', error);
    }
  });
}


/** format csv data **/
function getCsvWriter (filePath) {
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      {id: 'productNumber', title: 'Product Number'},
      {id: 'name', title: 'Description'},
      {id: 'expiry', title: "Expiry Date"},
      {id: 'qty', title: "Quantity"},
      {id: "price", title: "Unit Price"},
      {id: "approve", title: "Doctor Approve"},
      {id: "description", title: "Ingredients"},
      {id: "tag", title: "Category"},
      {id: "updated", titile: "Updated On"},
      {id: "created", title: "Created On"},
    ]
  });
  return csvWriter;
}


/** export csv **/
async function exportCSV(targetFilePath, data) {

  try {
    const csvWriter = getCsvWriter (targetFilePath);

    await csvWriter.writeRecords(data);
  }
  catch (error) {
    console.log('Error Exporting CSV File', error)
  }
}


function removeListeners (listeners) {
  try {
    listeners.forEach (
      listener => {
        let func = ipcMain.listeners(listener)[0];
        if (func)
          ipcMain.removeListener(listener, func);
      }
    )
  }
  catch (error) {
    console.error("Error Removing Listeners from inventoryExportWindow", error);
  }
}


function unregisterEmitters () {
  try {
    if (win) {
        win.webContents.removeListener("did-finish-load", win.webContents.listeners("did-finish-load")[0]);
        // win.webContents.removeListener()
    }
  }
  catch (error) {
    console.error("Error removing Emitters", error);
  }
}


function cleanUpWindow(listeners) {
  removeListeners (listeners);
  unregisterEmitters();
}
