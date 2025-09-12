let darkmode = localStorage.getItem('darkmode');
const themeSwitch = document.querySelectorAll('.theme-switch');
const enableDarkmode = () => {
    document.body.classList.add('dark-theme');
    localStorage.setItem('darkmode','active')
}
const disableDarkmode = () => {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('darkmode', null)
}
if(darkmode === "active") enableDarkmode();
themeSwitch.forEach(element => {
    element.addEventListener('click', () => {
        darkmode = localStorage.getItem('darkmode')
        darkmode !== "active" ? enableDarkmode() : disableDarkmode()
    })
});
// themeSwitch.addEventListener('click', () => {
// darkmode = localStorage.getItem('darkmode')
// darkmode !== "active" ? enableDarkmode() : disableDarkmode()
// })