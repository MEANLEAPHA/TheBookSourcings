
  const email = sessionStorage.getItem('resetEmail');
  if (!email) {
    alert("Email not found. Please start over.");
    window.location.href = 'forgetPassword.html';
  }

  document.getElementById('verifyPinBtn').addEventListener('click', async () => {
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const pin = document.getElementById('pinInput').value.trim();
    if (!/^\d{6}$/.test(pin)) {
      msg.textContent = 'Please enter a valid 6-digit PIN.';
      return;
    }

    try {
      const res = await fetch('https://thebooksourcings.onrender.com/verifyResetPin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (res.ok) {
      
        msg.textContent = data.message || 'PIN verified successfully!';
        msg.style.color = 'green';
        // Store verified email for next step
        sessionStorage.setItem('verifiedEmail', email);
        localStorage.setItem('resetPin', pin);

        window.location.href = 'newPassword.html';
      } else {
        msg.textContent = data.message || 'Verification failed.';
      }
    } catch (err) {
      msg.textContent = 'Network error.';
    
    }
  });

  document.getElementById('resendPin').addEventListener('click', async () => {
    try {
      const res = await fetch('https://thebooksourcings.onrender.com/resendresetpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
        msg.textContent = data.message || 'Verification code resent!';
     
    } catch (err) {
       msg.textContent = data.message || 'Failed to resend code :(';
      console.error(err);
    }
  });
