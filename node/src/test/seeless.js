
    const seeMore = document.getElementById("seeMore");
    const seeLess = document.getElementById("seeLess");
  seeMore.addEventListener("click", ()=>{
    seeMore.style.display = "none";
    seeLess.style.display = "block";
    books[5].style.display = "flex";
    books[6].style.display = "flex";
    books[7].style.display = "flex";
    books[8].style.display = "flex";
    books[9].style.display = "flex";


  });


  seeLess.addEventListener("click", ()=>{
    seeMore.style.display = "block";
    seeLess.style.display = "none";
    books[5].style.display = "none";
    books[6].style.display = "none";
    books[7].style.display = "none";
    books[8].style.display = "none";
    books[9].style.display = "none";
  });


