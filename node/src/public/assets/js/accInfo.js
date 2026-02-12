function parseJwt (token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const token = localStorage.getItem("token");
let userMemberQid = null;
let username = null;

if (token) {
  const decoded = parseJwt(token);
  userMemberQid = decoded?.memberQid || null;
  username = decoded?.username || null;
}

// load user info to fill
const userPfHeader = document.querySelector('.userPf'); // on header
const usernameCol = document.querySelector('.userName-collapse');
const nicknameCol = document.querySelector('.nickName-collapse');
const userPf = document.querySelector('.userPf-collapse');
const viewAccount = document.querySelector('.viewAccount-collapse');


//account link

const accountBook = document.getElementById('acc-book-link');
const accountPost = document.getElementById('acc-post-link');
const accountProduct = document.getElementById('acc-product-link');
const accountFav = document.getElementById('acc-fav-link');
const accountLike = document.getElementById('acc-like-link');
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
      viewAccount.href = `/account.html?memberQid=${userMemberQid }`;

      accountBook.href = `https://thebooksourcings.onrender.com/account.html?memberQid=${userMemberQid}&isBook=true`;
      accountPost.href = `https://thebooksourcings.onrender.com/account.html?memberQid=${userMemberQid}&isPost=true`;
      accountProduct.href = `https://thebooksourcings.onrender.com/account.html?memberQid=${userMemberQid}&isPro=true`;
      accountFav.href = `https://thebooksourcings.onrender.com/account.html?memberQid=${userMemberQid}&isFav=true`;
      accountLike.href = `https://thebooksourcings.onrender.com/account.html?memberQid=${userMemberQid}&isLike=true`;
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




const buttonColUser = document.getElementById('user-col-btn');
const menuColuer = document.getElementById(buttonColUser.getAttribute("aria-owns"));

buttonColUser.addEventListener('click', () => {
  const expanded = buttonColUser.getAttribute('aria-expanded') === "true";
  buttonColUser.setAttribute('aria-expanded', String(!expanded));
  menuColuer.hidden = expanded;
})

document.addEventListener('click', (e) => {
  if(!buttonColUser.contains(e.target) && !menuColuer.contains(e.target)){
    buttonColUser.setAttribute('aria-expanded', 'false');
    menuColuer.hidden = true;
  }
})