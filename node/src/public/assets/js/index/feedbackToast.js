const toastLiveExample2 = document.getElementById('liveToast2');
const toastBootstrap2 = bootstrap.Toast.getOrCreateInstance(toastLiveExample2);
function showFeedBackToast(){
      toastBootstrap2.show();
}
function closeFeedBackToast(){
      toastBootstrap2.hide();
}
const cameraImg = document.getElementById("screenshot");
if (cameraImg.src.endsWith("camera.png")) {
    cameraImg.style.opacity = "0.1";
} 
else {
    cameraImg.style.opacity = "1";
}
 
const feedbackBtn = document.querySelector('.feedback-col-btn');
const feedbackMenu = document.getElementById(feedbackBtn.getAttribute("aria-owns"));
const userAccCol = document.getElementById('user-account-collapse');

feedbackBtn.addEventListener('click', () => {
    const expanded = feedbackBtn.getAttribute("aria-expanded") === "true";
    feedbackBtn.setAttribute("aria-expanded", String(!expanded));
    feedbackMenu.hidden = expanded;
    userAccCol.hidden= true;
});
document.addEventListener('click', (e) => {
    if(!feedbackBtn.contains(e.target) && !feedbackMenu.contains(e.target)){
        feedbackBtn.setAttribute("aria-expanded", 'false');
        feedbackMenu.hidden = true;
    }
})