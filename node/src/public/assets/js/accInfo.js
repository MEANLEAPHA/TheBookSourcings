// function parseJwt (token) {
//   try {
//     return JSON.parse(atob(token.split('.')[1]));
//   } catch (e) {
//     return null;
//   }
// }

// const token = localStorage.getItem("token");
// let userMemberQid = null;
// let username = null;

// if (token) {
//   const decoded = parseJwt(token);
//   userMemberQid = decoded?.memberQid || null;
//   username = decoded?.username || null;
// }

// load user info to fill
const userPfHeader = document.querySelector('.userPf'); // on header
const usernameCol = document.querySelector('.userName-collapse');
const nicknameCol = document.querySelector('.nickName-collapse');
const userPf = document.querySelector('.userPf-collapse');
const viewAccount = document.querySelector('.viewAccount-collapse');

async function loadUserInfo() {
  try {
    const response = await fetch(`https://thebooksourcings.onrender.com/loadUserInfo`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    if (data && data.user) {
      usernameCol.textContent = data.user.username || 'Guest-User';
      nicknameCol.textContent = `@${data.user.nickname}` || data.user.nickname || '@WelcomeMyGuest';
      userPf.src = data.user.pfUrl;
      userPfHeader.src = data.user.pfUrl;
      viewAccount.href = `/account.html?memberQid=${userMemberQid }`
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

loadUserInfo();


// login and out 
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

if (token) {
  loginButton.style.display = "none";
  logoutButton.style.display = "block";
} else {
  loginButton.style.display = "block";
  logoutButton.style.display = "none";
}