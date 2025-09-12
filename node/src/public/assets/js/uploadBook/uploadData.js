  $(document).ready(function() {
 
   $('#bookForm').on('submit', function(e) {
    e.preventDefault();

    // Create FormData
    const formData = new FormData();

    // Add files
    const bookFile = $('#fileInput')[0].files[0];
    const bookCover = $('#coverInput')[0].files[0];
    if (bookFile) formData.append('bookFile', bookFile);
    if (bookCover) formData.append('bookCover', bookCover);

    // Add other fields
    formData.append('title', $('#title').val());
    formData.append('subtitle', $('#subtitle').val());
    formData.append('summary', $('#summary').val());
    formData.append('author', $('#authorName').val());
    formData.append('category', $('#category').val());
    formData.append('genre', $('#genre').val());
    formData.append('language', $('#language').val());
    formData.append('pageCount', $('#pageCount').val());
    formData.append('isnb10', $('#isnb10').val());
    formData.append('isbn13', $('#isbn13').val());
    formData.append('publisher', $('#publisher').val());
    formData.append('publishedDate', $('#publishedDate').val());
    formData.append('comment', $('#comment').is(':checked') ? 'active' : 'inactive');
    formData.append('download', $('#download').is(':checked') ? 'active' : 'inactive');
    formData.append('share', $('#share').is(':checked') ? 'active' : 'inactive');

    // AJAX request
    $.ajax({
        url: 'https://thebooksourcings.onrender.com/uploadBook',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        data: formData,
        processData: false,  // important
        contentType: false,  // important
        success: function(response) {
            $('#bookForm')[0].reset();
            $('#msg').text(response.message).css('color', 'green');
        },
        error: function(xhr) {
            if (xhr.status === 401) {
                alert('Unauthorized. Please log in again.');
                window.location.href = 'login.html';
            } else {
                alert('Error uploading book: ' + xhr.responseText);
            }
        }
    });
});

});