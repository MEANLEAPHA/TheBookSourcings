
    const slides = document.querySelectorAll('.slides img');
    const btn = document.querySelectorAll('.btn');
    btn.forEach(btns => {
        btns.style.display = "none";
    })
    let IndexSlider = 0;
    let interValid = null;
    document.addEventListener("DOMContentLoaded", initializeSlider());
    function initializeSlider(){
        if(slides.length>0){
            slides[IndexSlider].classList.add("displaySlide");
            interValid = setInterval(Next,5000);
        }
    }
    function showSlide(index){
        if(index >= slides.length){
            IndexSlider = 0;
        }
        else if(index < 0){
            IndexSlider = slides.length -1;
        }
        slides.forEach(slide => {
            slide.classList.remove("displaySlide");
            }
        )
        slides[IndexSlider].classList.add("displaySlide");
    }
    function Prev(){
        IndexSlider --;
        showSlide(IndexSlider)
    }
    function Next(){
        IndexSlider++;
        showSlide(IndexSlider);
    }
