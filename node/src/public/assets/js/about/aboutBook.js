    // after fetching the book
description.textContent = data.description || "No description available.";

// now run read more / read less logic
let descriptions = description.textContent;

const seemore = document.getElementById('seemore');
const seeless = document.getElementById('seeless');

if(descriptions.length > 1000){
    const shortText = descriptions.slice(0,1000) + "......";
    description.innerText = shortText;
    seemore.style.display = "inline"; // or "block"
    seeless.style.display = "none";

    seemore.addEventListener('click', ()=>{
        description.innerText = descriptions;
        seemore.style.display = "none";
        seeless.style.display = "inline"; // or "block"
    });

    seeless.addEventListener('click', ()=>{
        description.innerText = shortText;
        seemore.style.display = "inline";
        seeless.style.display = "none";
    });
} else {
    seemore.style.display = "none";
    seeless.style.display = "none";
}



const showLessBook = document.getElementById("showLessBook");
const showAllBook = document.getElementById("showAllBook");
const books = document.querySelectorAll('.books');

if(books.length > 3){
    for(let i =3 ; i < books.length; i++ ){
        books[i].style.display = 'none';
    }
     
        showLessBook.style.display = 'none';
        showAllBook.style.display = 'flex';

        showAllBook.addEventListener('click', ()=>{

        books.forEach(child => child.style.display = 'flex')
               
             
                showAllBook.style.display = 'none';
                showLessBook.style.display = 'flex';
          
                 })

        showLessBook.addEventListener('click', ()=>{
              for(let i =3 ; i < books.length; i++ ){
                 books[i].style.display = 'none';
                
              }
            
                showAllBook.style.display = 'flex';
                showLessBook.style.display = 'none';
        })
   
    
  
}
else{
showLessBook.style.display = 'none';
showAllBook.style.display = 'none';
}

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