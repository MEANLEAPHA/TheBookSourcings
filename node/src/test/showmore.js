
    const books = document.querySelectorAll(".books");
       books[5].style.border = "none";
    
    books[0].style.border = "none";
    
    window.addEventListener("resize", () => {
      if (window.innerWidth <= 768) {
        books[5].style.borderTop = "0.3px dashed rgb(190, 190, 190)";
        books[5].style.display = "none";
        books[6].style.display = "none";
        books[7].style.display = "none";
        books[8].style.display = "none";
        seeMore.style.display = "block";
       


      } else {
        books[5].style.border = "none";
        seeLess.style.display = "none";
        seeMore.style.display = "none";
        books[5].style.display = "flex";
        books[6].style.display = "flex";
        books[7].style.display = "flex";
        books[8].style.display = "flex";
        books[9].style.display = "flex";
      }
    });


