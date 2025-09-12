const phoneSearch = document.getElementById('phoneSearch');
const header = document.getElementById('header');
const searchIcons = document.getElementById('searchIcons');
const phoneSearchLeft = document.getElementById('phoneSearchLeft');

searchIcons.addEventListener('click', ()=>{
    header.style.display='none';
    phoneSearch.style.display='flex';
});

phoneSearchLeft.addEventListener('click', ()=>{
    header.style.display='flex';
    phoneSearch.style.display='none';
})