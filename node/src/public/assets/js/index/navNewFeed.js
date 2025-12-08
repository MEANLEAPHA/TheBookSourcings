const genreBar = document.getElementById('genreBar');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const genreButtons = document.querySelectorAll('.genre-btn');
function updateScrollButtons() {
  const scrollLeft = genreBar.scrollLeft;
  const maxScrollLeft = genreBar.scrollWidth - genreBar.clientWidth;
  prevBtn.classList.toggle('hidden', scrollLeft <= 0);
  nextBtn.classList.toggle('hidden', scrollLeft >= maxScrollLeft - 1);
}
nextBtn.addEventListener('click', () => {
  genreBar.scrollBy({ left: 200, behavior: 'smooth' });
});
prevBtn.addEventListener('click', () => {
  genreBar.scrollBy({ left: -200, behavior: 'smooth' });
});
genreBar.addEventListener('scroll', updateScrollButtons);
window.addEventListener('resize', updateScrollButtons);
genreButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.genre-btn.active')?.classList.remove('active');
    btn.classList.add('active');
  });
});
// Initial check
updateScrollButtons();
