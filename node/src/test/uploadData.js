  $(document).ready(function() {
 
    $('#bookForm').on('submit', function(e) {
        e.preventDefault();
        function localToUTC(datetimeLocalString) {
            return new Date(datetimeLocalString).toISOString();
        }

        const bookInfo = {
            bookFile: $('#fileInput')[0].files[0],
            bookCover: $('#coverInput')[0].files[0],
            title: $('#title').val(),
            subtitle: $('#subtitle').val(),
            summary: $('#summary').val(),
            author : $('#authorName').val(),
            category: $('#category').val(),
            genre: $('#genre').val(),
            language: $('#language').val(),
            pageCount: $('#pageCount').val(),
            isnb10 : $('#isnb10').val(),
            isbn13 : $('#isbn13').val(),
            publisher : $('#publisher').val(),
            publishedDate : $('#publishedDate').val(),
            comment: $('#comment').is(':checked') ? 'active' : 'inactive',
            download: $('#download').is(':checked') ? 'active' : 'inactive',
            share: $('#share').is(':checked') ? 'active' : 'inactive',
        };

        $.ajax({
            url: 'https://remindwho.onrender.com/uploadBook',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            contentType: 'application/json',
            data: JSON.stringify(bookInfo),
            success: function(response) {
                $('#bookForm')[0].reset();
                $('#msg').text(response.message).css('color', 'green');
            },
            error: function(xhr) {
                if (xhr.status === 401) {
                    alert('Unauthorized. Please log in again.');
                    window.location.href = 'login.html';
                } else {
                    alert('Error creating task: ' + xhr.responseText);
                }
            }
        });
    });
});