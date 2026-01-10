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
 
