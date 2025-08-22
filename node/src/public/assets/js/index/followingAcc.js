const allFollowing = document.getElementById("allFollowing");
const showLessFollow = document.getElementById("showLessFollow");
const showMoreFollow = document.getElementById("showMoreFollow");
const followingChild = document.querySelectorAll('.followingChild');
if(followingChild.length > 3){
    for(let i =3 ; i < followingChild.length; i++ ){
        followingChild[i].style.display = 'none';
    }
    allFollowing.style.display = 'none';
    showLessFollow.style.display = 'none';
    showMoreFollow.style.display = 'flex';
    showMoreFollow.addEventListener('click', ()=>{
      followingChild.forEach(child => child.style.display = 'flex')
      allFollowing.style.display = 'flex';
      showMoreFollow.style.display = 'none';
      showLessFollow.style.display = 'flex';
    })
    showLessFollow.addEventListener('click', ()=>{
      for(let i =3 ; i < followingChild.length; i++ ){
          followingChild[i].style.display = 'none';
        
      }
      allFollowing.style.display = 'none';
        showMoreFollow.style.display = 'flex';
        showLessFollow.style.display = 'none';
    })
}
else{
allFollowing.style.display = 'none';
showLessFollow.style.display = 'none';
showMoreFollow.style.display = 'none';
}