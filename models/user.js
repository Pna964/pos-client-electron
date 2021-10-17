const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@site.com',
    password: 'admin'
  },
  {
    id: 2,
    username: 'jackwill',
    email: 'jack@site.com',
    password: 'jack'
  },
  {
    id: 3,
    username: 'augie',
    email: 'augie@site.com',
    password: 'augie'
  },
  {
    id: 4,
    username: 'summer',
    email: 'summer@site.com',
    password: 'summer'
  },
  {
    id: 5,
    username: 'winter',
    email: 'summer@site.com',
    password: 'summer'
  },
]


exports.getAllUsers = function getAllUsers() {
  return users
}


exports.addUser = function addUser(user) {
  users.push(user);
}


exports.loginUser = function login({username, password}) {
  // get user from usres array
  const user = users.find(u => u.username === username);
  if (user) return {status: 200, data: {username}}
  else return {status: 401, message: 'Incorrect username or password!'}
}
