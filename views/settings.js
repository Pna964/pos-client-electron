window.onload = () => {
  const closeButton = document.getElementById("close-setting");
  const setIPButton = document.getElementById("set-ip");

  const appConfig = {};

  const serverUrl = localStorage.getItem("serverUrl");
  if (serverUrl) {
    const ipAddrInput = document.getElementById("server-addr");

    ipAddrInput.value = serverUrl;
    appConfig.serverURL = serverUrl;
  }
  else {
    throw new Error ("Server Url not found in Local Storage");
  }


  closeButton.addEventListener("click", e => {
    window.api.send("close-setting");
  });


  setIPButton.addEventListener("click", e => {

    const ipAddr = document.getElementById("server-addr").value;
    console.log(ipAddr, appConfig.serverURL);
    if (!ipAddr || ipAddr === "" || ipAddr === appConfig.serverURL)
      return

    localStorage.serverUrl = ipAddr;
  });
}
