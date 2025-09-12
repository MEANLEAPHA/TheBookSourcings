 document.getElementById('requestPinBtn').addEventListener('click', async () => {
    const msg = document.getElementById('msg');
    msg.textContent = '';
    const email = document.getElementById('emailInput').value.trim();
    if (!email) {
      msg.textContent = 'Please enter your email.';
      return;
    }

    try {
      const res = await fetch('https://thebooksourcings.onrender.com/requestPasswordReset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save email to sessionStorage for next page
        sessionStorage.setItem('resetEmail', email);
        msg.textContent = data.message;
        msg.style.color = 'green';
        window.location.href = 'verifyFPpin.html';
      } else {
        msg.textContent = data.message || 'Failed to send PIN.';
      }
    } catch (err) {
      msg.textContent = 'Sorry! Our Network error.';
      
    }
  });