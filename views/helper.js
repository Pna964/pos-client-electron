// helper functions
const container = document.getElementById('register-user');
const mainPage = document.getElementById('main-container');
const contents = document.getElementById('contents');


// if admin user login is successful, redirect into admin pannel
exports.redirectToAdminPannel = async function redirectToAdminPannel(pannelName) {
  try {
    mainPage.style.display = 'none';
    contents.style.display = 'block';
    if (pannelName === 'register') {
      const response = await fetch('register/register.html');
      const newContent = await response.text()
      console.log(newContent);

      const registerNode = document.createElement('div');
      // registerNode.setAttribute('class', 'container-fluid');
      registerNode.innerHTML = newContent;
      contents.appendChild(registerNode);
    }
  }
  catch (error) {
    console.log(error);
  }
}


exports.logoutToMainMenu = async function logoutToMainMenu() {
  try {
    contents.style.display = 'none';
    mainPage.style.display = 'flex';
  }
  catch (error) {
    console.log(error);
  }
}
