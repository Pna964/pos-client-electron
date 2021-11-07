/**
  another form window to edit/show medicines
**/
 const path = require("path");
 const {
   BrowserWindow,
   ipcMain
 } = require("electron");
 const {
   updateItem,
   getAllItems,
   getItemById,
   getDetailItemById,
   getSubItemDetailById
 } = require("../models/item.js");

let win


exports.createDetailFormWindow = function createDetailFormWindow(parentWindow, contents) {

  if (!win || win === null) {
   win = new BrowserWindow ({
     width: 1000,
     height: 800,
     parent: parentWindow,
     modal: true,
     show: false,
     backgroundColor: '#ffffff',
     webPreferences: {
       contextIsolation: true,
       nodeIntegration: false,
       preload: path.join(__dirname, "../preload_scripts/invDetailPreload.js")
     }
   });

  }

  win.loadFile(path.join(__dirname, "../views/inventory/item_detail.html"));


  win.once("ready-to-show", () => win.show());

  win.on("close", () => {
    if(win) {
      removeListeners(["dismiss-form-window", "open-details"]);
      unregisterEmitters();
      win = null;
    }
  });

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("reload-data", contents);

    ipcMain.on('dismiss-form-window', () => {
      if(win) win.close();
    });

   });
 }

 function removeListeners (listeners) {
   try {
     listeners.forEach (
       listener => {
         const func = ipcMain.listeners(listener)[0];
         if (func) {
           ipcMain.removeListener(listener, func);
         }
       }
     );
   }
   catch (error) {
     console.error("Error removing listeners from ItemEditWindow", error);
   }
 }


 function unregisterEmitters () {
   try {
     if (win) {
         win.webContents.removeListener("did-finish-load", win.webContents.listeners("did-finish-load")[0]);
     }
   }
   catch (error) {
     console.error("Error removing Emitters", error);
   }
 }
