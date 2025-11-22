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
                $('#occupation').val(`${data.workRole} at ${data.workPlace}` || '');
                $('#memberQid').val(data.memberQid || '');
                $('#authorQid').val(data.authorQid || '');

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