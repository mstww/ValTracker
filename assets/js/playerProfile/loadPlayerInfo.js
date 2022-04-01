var searchedPlayerName = sessionStorage.getItem("player_name");
var searchedPlayerTag = sessionStorage.getItem("player_tag");

var playerRegion = sessionStorage.getItem("player_region");

var lastPage = sessionStorage.getItem("last_page");

function makeCallAndBuildElements() {
    $.ajax({
        dataType: "json",
        url: `https://api.henrikdev.xyz/valorant/v1/account/${searchedPlayerName}/${searchedPlayerTag}`,
        type: 'get',
        success: function (data, xhr) {
            $('.player-pageheader').append(data.data.name + "#" + data.data.tag);
            sessionStorage.setItem("player_name", data.data.name);
            sessionStorage.setItem("player_tag", data.data.tag);
            $('.player-card-img').attr("src", data.data.card.small);
            $('.player-card-img').attr("onclick", `cardRedirect(this, this.src, window.location.href)`);
            $('.last-updated').append("Last updated: " + data.data.last_update);
            $('.player-account-level').append("Account Level: " + data.data.account_level);
            $('#player-region-span').append("Region: " + playerRegion.toUpperCase());
            var checkForS = data.data.name.slice(-1);
            if (checkForS.toLowerCase() == "s") {
                $('.insert-playername').append(data.data.name + "' Last Matches")
            } else {
                $('.insert-playername').append(data.data.name + "'s Last Matches")
            }
        },
        error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
        }
    });
}

$(document).ready(() => {
    makeCallAndBuildElements();
    $('#backToLastPage').on("click", function () {
        window.location.href = "playersearch.html"
    })
});