// let darkmode = localStorage.getItem('darkmode');
// const themeSwitch = document.querySelectorAll('.theme-switch');
// const enableDarkmode = () => {
//     document.body.classList.add('dark-theme');
//     localStorage.setItem('darkmode','active')
// }
// const disableDarkmode = () => {
//     document.body.classList.remove('dark-theme');
//     localStorage.setItem('darkmode', null)
// }
// if(darkmode === "active") enableDarkmode();
// themeSwitch.forEach(element => {
//     element.addEventListener('click', () => {
//         darkmode = localStorage.getItem('darkmode')
//         darkmode !== "active" ? enableDarkmode() : disableDarkmode()
//     })
// });
// themeSwitch.addEventListener('click', () => {
// darkmode = localStorage.getItem('darkmode')
// darkmode !== "active" ? enableDarkmode() : disableDarkmode()
// })

//new

let darkmode = localStorage.getItem('darkmode');
const themeSwitch = document.querySelectorAll('.theme-switch');
const logo = document.querySelector('#logo');

const enableDarkmode = () => {
    document.body.classList.add('dark-theme');
    logo.src = "../assets/img/otthorD.png"; // dark mode logo
    localStorage.setItem('darkmode', 'active');
};

const disableDarkmode = () => {
    document.body.classList.remove('dark-theme');
    logo.src = "../assets/img/otthor.png"; // light mode logo
    localStorage.setItem('darkmode', null);
};

// Apply mode on load
if (darkmode === "active") {
    enableDarkmode();
} else {
    disableDarkmode(); // ensure correct logo on initial load
}

// Toggle on click
themeSwitch.forEach(element => {
    element.addEventListener('click', () => {
        darkmode = localStorage.getItem('darkmode');
        darkmode !== "active" ? enableDarkmode() : disableDarkmode();
    });
});
