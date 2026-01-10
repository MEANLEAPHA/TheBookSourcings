
  const btnTop = document.getElementById('btnTop');
  window.addEventListener('scroll', () =>{
    if(window.scrollY>500){
      btnTop.style.display='flex';
    }
    else{
      btnTop.style.display='none'
    }
  })
