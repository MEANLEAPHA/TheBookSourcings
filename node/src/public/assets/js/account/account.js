    const urlParams = new URLSearchParams(window.location.search);
    const memberQid = urlParams.get("memberQid");

    $(document).ready(function() {
        $.ajax({
            url: `https://thebooksourcings.onrender.com/getFullRegisterDataByQid/${memberQid}`,
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            success: function(data) {
                if (!data) return;
                $('#username').val(data.username || '');
                $('#usernickname').val(`@${data.nickname || ''}`);
                $('#bio').val(data.bio || '');
                $('#website').val(data.websiteUrl || '');
                $('#website').attr('href', data.websiteUrl || '');
                $('#quirkyTag').val(data.playfulLabel || '');
                $('#occupation').val(`${data.workRol}} at ${data.workPlace}` || '');
                $('#memberQid').val(data.memberQid || '');
                $('#authorQid').val(data.authorQid || '');

                $('#bannerImage').attr('src', data.bannerUrl || '');
                $('#bannerImage').style.setProperty('--bg-img', `url(${data.bannerUrl || ''})`);

                $('#profileImage').attr('src', data.pfUrl || '');
                $('#profileImage').classList.add(`mood-${data.mood}`);

                // const profileUpload = document.getElementById("profilePreview");
                // if (data.mood) {
                //     profileUpload.className = profileUpload.className.replace(/\bmood-\w+\b/g, "").trim();
                //     profileUpload.classList.add(`mood-${data.mood}`);
                // }
            
            },
            error: function(err) {
            console.error("Error fetching user:", err);
            }
        });

    });