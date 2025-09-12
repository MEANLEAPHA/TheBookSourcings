 
    const token = localStorage.getItem('verify_token'); // Store this token after signup response

    if (!token) {
      alert("Token missing! Please sign up again.");
      window.location.href = 'signup.html';
    }

    $('#verify-form').on('submit', function (e) {
      e.preventDefault();

      const pin = $('#verifyPin').val().trim();

      if (!/^\d{6}$/.test(pin)) {
   
        $('#msg').text('Please enter a valid 6-digit PIN.');
        return;
      }

      $.ajax({
        url: 'https://thebooksourcings.onrender.com/verify',
        method: 'POST',
        contentType: 'application/json',
        headers: {
          Authorization: 'Bearer ' + token
        },
        data: JSON.stringify({ pin }),
        success: function (res) {
          $('#msg').text(res.message || "Verified successfully!").css('color', 'green');
          localStorage.removeItem('verify_token'); // Clear token after successful verify
          window.location.href = 'login.html';
        },
        error: function (xhr) {
          const message = xhr.responseJSON?.message || xhr.responseText || "Verification failed";
          // alert("Verification failed: " + message);
          $('#msg').text(message).css('color', 'red');
        }
      });
    });

    $('#resendPinBtn').on('click', function () {
      $.ajax({
        url: 'https://thebooksourcings.onrender.com/resend-pin',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token
        },
        success: function (res) {
       
          $('#msg').text(res.message || "Verification code resent!").css('color', 'green');
        },
        error: function (xhr) {
          const message = xhr.responseJSON?.message || xhr.responseText || "Failed to resend code.";
          // alert("Resend failed: " + message);
          $('#msg').text(message).css('color', 'red');
        }

      });
    });
  