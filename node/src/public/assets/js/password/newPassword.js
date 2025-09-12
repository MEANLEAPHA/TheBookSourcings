const email = sessionStorage.getItem('verifiedEmail');
  const pin = localStorage.getItem('resetPin');
  if (!email) {
    alert("You must verify your email first.");
    window.location.href = 'forgetPassword.html';
  }

  document.getElementById('resetPasswordBtn').addEventListener('click', async () => {
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (!newPass || newPass.length < 6) {
      msg.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (newPass !== confirmPass) {
      msg.textContent = 'Passwords do not match.';
      return;
    }

    try {
      const res = await fetch('https://thebooksourcings.onrender.com/resetPassword', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            { email,
              newPassword: newPass,
              pin
            }
            ),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Password reset successfully :)');
        sessionStorage.clear();
        window.location.href = 'login.html';
      } else {
        msg.textContent = data.message || 'Failed to reset password.';
      }
    } catch (err) {
      msg.textContent = 'Network error.';
      console.error(err);
    }
  });