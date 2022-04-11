function showPromoVid(event, id, bundleID) {
    $(".bundle-largeview").animate({
        scrollTop: 0
    }, {
        duration: 350,
    });
    var video = document.getElementById("largeview-vid-element");
    video.currentTime = 0;
    $('html, body, .bundle-largeview').css("overflow", "hidden")
    $('.largeview-vid').css("display", "grid")
    $('.header-relative-div-largeview').css("display", "none")
    $('.header-relative-div-video').css("opacity", "1")
    setTimeout(function () {
        $('.largeview-vid').css("background-color", "rgba(0, 0, 0, 0.5)")
    }, 400)
    var chroma = sessionStorage.getItem("chroma");
    if(chroma == null) {
        chroma = 0;
    }
    $.ajax({
        url: `https://api.valtracker.gg/bundles/${bundleID}`,
        type: 'get',
        success: function (data, jqXHR) {
            if(data.data.weapons[id].chromas[chroma].video) {
                video.setAttribute("src", data.data.weapons[id].chromas[chroma].video);
            } else {
                video.setAttribute("src", data.data.weapons[id].levels[data.data.weapons[id].levels.length - 1].video);
            }
        },
        error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
        }
    })
}

function hideVideo() {
    $('.bundle-largeview').css("overflow", "auto")
    $('.header-relative-div-largeview').css("display", "block")
    $('.largeview-vid').css("display", "none")
    document.getElementById('largeview-vid-element').pause();
    setTimeout(function () {
        $('.largeview-vid').css("background-color", "rgba(0, 0, 0, 0)")
    }, 100)
}