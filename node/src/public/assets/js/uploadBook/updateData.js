
$('#bookForm').submit(async function(e) {
    e.preventDefault();
    
    const formData = new FormData();

    formData.append('title', $('#title').val());
    formData.append('subtitle', $('#subtitle').val());
    formData.append('summary', $('#summary').val());
    formData.append('author', $('#authorName').val());
    formData.append('category', $('#category').val());
    formData.append('genre', $('#genre').val());
    formData.append('language', $('#language').val());
    formData.append('pageCount', $('#pageCount').val());
    formData.append('isbn10', $('#isbn10').val());
    formData.append('isbn13', $('#isbn13').val());
    formData.append('publisher', $('#publisher').val());
    formData.append('publishedDate', $('#publishedDate').val());
    formData.append('comment', $('#comment').is(':checked') ? 'active' : 'inactive');
    formData.append('download', $('#download').is(':checked') ? 'active' : 'inactive');
    formData.append('share', $('#share').is(':checked') ? 'active' : 'inactive');


    // Files
    if ($('#fileInput')[0].files[0]) formData.append('bookFile', $('#fileInput')[0].files[0]);
    if ($('#coverInput')[0].files[0]) formData.append('bookCover', $('#coverInput')[0].files[0]);

    const bookQid = new URLSearchParams(window.location.search).get('bookQid');

    try {
        const response = await fetch(`https://thebooksourcings.onrender.com/api/getMyBooks/updateBook/${bookQid}`, {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Book updated successfully");
            window.location = `https://thebooksourcings.onrender.com/yourBook.html`; // refresh page or redirect
        } else {
            alert(result.message || "Update failed");
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong!");
    }
});

