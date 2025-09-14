
$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookQid = urlParams.get('bookQid'); // get bookQid from URL

    if (!bookQid) {
        alert("Book ID is missing!");
        return;
    }

    // Fetch existing book data
    $.ajax({
        url: `https://thebooksourcings.onrender.com/api/getBookByQid/${bookQid}`, // Your backend endpoint
        type: 'GET',
        success: function(data) {
            if (!data) return;

            // Fill text inputs
            $('#title').val(data.title);
            $('#subtitle').val(data.subTitle);
            $('#summary').val(data.summary);
            $('#authorName').val(data.author);
            $('#genre').val(data.genre);
            $('#pageCount').val(data.pageCount);
            $('#isbn10').val(data.ISBN10);
            $('#isbn13').val(data.ISBN13);
            $('#publisher').val(data.publisher);
            $('#publishedDate').val(data.publishDate);

            // Fill selects
            $('#category').val(data.mainCategory);
            $('#language').val(data.language);

            // Fill toggles
            $('#comment').prop('checked', data.comment === 'active');
            $('#download').prop('checked', data.download === 'active');
            $('#share').prop('checked', data.share === 'active');

            // Preview existing files
            if (data.bookCover) {
                $('#coverPreview').attr('src', data.bookCover).show();
                $('#coverPlaceholder').hide();
            }
            if (data.bookFile) {
                $('#filePreview').attr('src', data.bookFile).show();
                $('#filePlaceholder').hide();
            }
        },
        error: function(err) {
            console.error("Error fetching book data:", err);
        }
    });
});

