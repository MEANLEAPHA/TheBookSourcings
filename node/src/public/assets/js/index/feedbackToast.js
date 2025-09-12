// feedback
const toastTrigger2 = document.querySelectorAll('.feedBackBtn2');
toastTrigger2.forEach(btn => {
    btn.addEventListener('click', () => {
      const toastLiveExample2 = document.getElementById('liveToast2');
      const toastBootstrap2 = bootstrap.Toast.getOrCreateInstance(toastLiveExample2);
      toastBootstrap2.show();
    })
})

const cameraImg = document.getElementById("screenshot");
if (cameraImg.src.endsWith("camera.png")) {
    cameraImg.style.opacity = "0.1";
} 
else {
    cameraImg.style.opacity = "1";
}