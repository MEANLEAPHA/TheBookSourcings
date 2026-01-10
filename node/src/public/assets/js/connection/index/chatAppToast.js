const toastChatTrigger = document.querySelector('#liveChatBtn');
const toastLiveChatExample = document.getElementById('liveChat');
const close = document.getElementById('liveChatClose');
const toastCon = document.querySelector('.toast-container-chat');
toastCon.style.display = 'none';

// Explicitly disable autohide
const toastChatBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveChatExample, {
  autohide: false
});

if (toastChatTrigger) {
  toastChatTrigger.addEventListener('click', () => {
    toastChatBootstrap.show();
    toastCon.style.display = 'block';
  });
}

close.addEventListener('click', () => {
  toastChatBootstrap.hide();
  toastCon.style.display = 'none';
});
