 $(document).ready(function() {  
    $('#member-form').on('submit', function(e) {
        e.preventDefault();

        // Get user's browser timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const member = {
            email: $('#email').val(),
            password: $('#password').val(),
            timezone: userTimezone  // add timezone here
        };

        $.ajax({
            url: 'https://thebooksourcings.onrender.com/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(member),
            success: function(response) {
                $('#msg').text(response.message).css('color', 'green');
                localStorage.setItem('token', response.token);
                location.href = 'https://thebooksourcings.onrender.com/index.html';
            },
            // error: function(xhr, status, error) {
            //     console.error("AJAX Error:", xhr.responseText);
            //     // alert(xhr.responseText);
            //     $('#msg').text(xhr.responseText);
            // }
            error: function(xhr, status, error) {
                try {
                    const err = JSON.parse(xhr.responseText);
                    $('#msg').text(err.message).css('color', 'red'); // Displays just "No user found"
                } catch (e) {
                    $('#msg').text('An unexpected error occurred');
                }
            }

        });
    });

});