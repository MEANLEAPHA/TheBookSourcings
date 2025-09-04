
// const showLessBook = document.getElementById("showLessBook");
// const showAllBook = document.getElementById("showAllBook");
// const books = document.querySelectorAll('.books');

// if(books.length > 3){
//     for(let i =3 ; i < books.length; i++ ){
//         books[i].style.display = 'none';
//     }
     
//         showLessBook.style.display = 'none';
//         showAllBook.style.display = 'flex';

//         showAllBook.addEventListener('click', ()=>{

//         books.forEach(child => child.style.display = 'flex')
               
             
//                 showAllBook.style.display = 'none';
//                 showLessBook.style.display = 'flex';
          
//                  })

//         showLessBook.addEventListener('click', ()=>{
//               for(let i =3 ; i < books.length; i++ ){
//                  books[i].style.display = 'none';
                
//               }
            
//                 showAllBook.style.display = 'flex';
//                 showLessBook.style.display = 'none';
//         })
   
    
  
// }
// else{
// showLessBook.style.display = 'none';
// showAllBook.style.display = 'none';
// }


//  const similarLists = document.querySelector(".swiper-wrapper");
//   similarLists.innerHTML = "";
//   if(similarBooks.length > 0) {
//     similarBooks.forEach(bk => {
//       similarLists.innerHTML += `
//             <div class="swiper-slide">
//               <a href='aboutBook.html?bookId=${bk.bookId}'>
//                 <img src="${bk.cover}" class="BookCover">
//                 <div class="bookInfo">
//                   <p class="BookTitle">${bk.title}</p>
//                   <p class="BookAuthor">${bk.author}</p>
//                 </div>
//               </a>
//             </div>
//       `;
//     })
//   }
//   else{
//     similarLists.innerHTML = "<p>No similar books found.</p>";
//   }

//   const swiper = new Swiper('.swiper', {
//   loop: true,
//   autoplay: { delay: 1500 },
//   slidesPerView: 'auto', // Default for small screens
//   spaceBetween: 15,      // Default space
//   pagination: { el: '.swiper-pagination', clickable: true },
//   navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
//   breakpoints: {
//     640: {
//       slidesPerView: 3,
//       spaceBetween: 20 // Optional for medium screens
//     },
//     768: {
//       slidesPerView: 3,
//       spaceBetween: 20 // 💡 Expanded spacing for tablets
//     },
//     1024: {
//       slidesPerView: 5,
//       spaceBetween: 15 // Back to standard spacing for desktop
//     }
    
//   }
// });