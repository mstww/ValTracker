const showdown = require('showdown');
const converter = new showdown.Converter();

$(document).ready(() => {
    let rawLoadData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json');
    let loadData = JSON.parse(rawLoadData);

    if(loadData.hasReadLatestPatchnotes == undefined) {
        loadData.hasReadLatestPatchnotes = false;
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(loadData))
    }
    if(loadData.hasReadLatestPatchnotes == false) {
        var pjson = require('../package.json');
        $('#version-num').append(pjson.version);
        $.ajax({
            url: `https://api.valtracker.gg/patchnotes/v${pjson.version}`,
            type: 'get',
            success: function (data, xhr) {
                var html1 = converter.makeHtml(data.data.whats_new.additions);
                var html2 = converter.makeHtml(data.data.whats_new.fixes);
                $('.whats-new-content').append(html1)
                $('.whats-new-fixes').append(html2)
                $('.header-relative-div #toggle').css("cursor", "not-allowed");
                $('.header-relative-div #toggle').css("pointer-events", "none");
                $('.header-relative-div').css("z-index", "49");
                $('.user-rank-icon').css("z-index", "49");
                $('.whats-new-card').css("display", "block")
                $('.whats-new-card').css("transform", "scale(1)")
            },
            error: function (jqXHR) {
                createErrorCard(this.url, jqXHR.status);
            }
        });
    } else {
        $('.whats-new-wrapper').css("display", "none")
    }
    $('#markPatchnotesAsRead').on("click", function () {
        loadData.hasReadLatestPatchnotes = true;
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json', JSON.stringify(loadData))
        $('.whats-new-card').fadeTo(100, 0)
        $('.whats-new-card').css("transform", "scale(0.8)");
        $('.whats-new-wrapper').fadeTo(150, 0)
        setTimeout(function () {
            $('.whats-new-wrapper').css("display", "none");
            $('.header-relative-div #toggle').css("cursor", "pointer");
            $('.header-relative-div #toggle').css("pointer-events", "auto");
            $('.header-relative-div').css("z-index", "100000000000");
            $('.user-rank-icon').css("z-index", "90001");
        }, 150)
    })
});