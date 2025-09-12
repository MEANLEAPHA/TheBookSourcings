const toastTrigger = document.querySelector('#liveToastBtn');
const toastLiveExample = document.getElementById('liveToast');
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);

if (toastTrigger) {
  toastTrigger.addEventListener('click', () => {
    toastBootstrap.show();
  });
}

// Close toast when clicking outside
document.addEventListener('click', function (event) {
  const isClickInside = toastLiveExample.contains(event.target);
  const isTrigger = toastTrigger.contains(event.target);

  if (!isClickInside && !isTrigger) {
    toastBootstrap.hide();
  }
});


//   function logout() {
//     localStorage.removeItem('token');
//     window.location.href = "login.html";
//   }