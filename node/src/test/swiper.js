
  const swiper = new Swiper('.swiper', {
  loop: true,
  autoplay: { delay: 1500 },
  slidesPerView: 'auto', // Default for small screens
  spaceBetween: 15,      // Default space
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  breakpoints: {
    640: {
      slidesPerView: 3,
      spaceBetween: 20 // Optional for medium screens
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 20 // 💡 Expanded spacing for tablets
    },
    1024: {
      slidesPerView: 5,
      spaceBetween: 15 // Back to standard spacing for desktop
    }
    
  }
});


