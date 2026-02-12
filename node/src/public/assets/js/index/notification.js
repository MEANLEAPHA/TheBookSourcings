const notiBtn = document.getElementById('user-noti-col-btn');
const notiCol = document.getElementById(notiBtn.getAttribute('aria-owns'));

notiBtn.addEventListener('click', () => {
    const expanded = notiBtn.getAttribute('aria-expanded') === "true";
    notiBtn.setAttribute('aria-expanded', String(!expanded));
    notiCol.hidden = expanded;
});

document.addEventListener('click', (e) => {
    if(!notiBtn.contains(e.target) && !notiCol.contains(e.target)){
         notiBtn.setAttribute('aria-expanded', 'false');
        notiCol.hidden = true;
    }
})