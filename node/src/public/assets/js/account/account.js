    const urlParams = new URLSearchParams(window.location.search);
    const memberQid = urlParams.get("memberQid");

    $(document).ready(function() {
        $.ajax({
            url: `https://thebooksourcings.onrender.com/getFullRegisterDataByQid/${memberQid}`,
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            success: function(data) {
                if (!data) return;
                $('#username').text(data.username || '');
                $('#usernickname').text(`@${data.nickname || ''}`);
                $('#bio').text(data.bio || '');
                $('#website').text(data.websiteUrl || '');
                $('#website').attr('href', data.websiteUrl || '');
                $('#quirkyTag').text(data.playfulLabel || '');
                $('#occupation').text(`${data.workRole} at ${data.workPlace}` || '');
                $('#memberQid').text(data.memberQid || '');
                $('#authorQid').text(data.authorQid || '');

                $('#bannerImage').attr('src', data.bannerUrl || '');
                $('#bannerImage').css('--bg-img', `url(${data.bannerUrl || ''})`);

                $('#profileImage').attr('src', data.pfUrl || '');
                $('#profileImage').addClass(`mood-${data.mood}`);

            
            
            },
            error: function(err) {
            console.error("Error fetching user:", err);
            }
        });

    });