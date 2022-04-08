$(document).ready(() => {
    setTimeout(function () {
        var playerRegion = sessionStorage.getItem("player_region");
        var playerUUID = sessionStorage.getItem("puuid");
        $.ajax({
            dataType: "json",
            url: `https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr-history/${playerRegion}/${playerUUID}`,
            type: 'get',
            success: function (data2, xhr) {

                function ispositive(n) {
                    return 1 / (n * 0) === 1 / 0
                }
                if (data2.data[0] == undefined) {
                    $('.player-rank').attr("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/largeicon.png`);
                    $('.player-rank').addClass("unranked");
                    for (var count = 0; count < 5; count++) {
                        $(`#match-rr-id-${count}`).append("-");
                    }
                    $('.user-rankrating').append("0");
                } else {
                    $('.player-rank').attr('src', `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data2.data[0].currenttier}/largeicon.png`)
                    if(data2.data[0].ranking_in_tier == 0){
                        $('.player-rank').addClass("unranked");
                    }
                    for (var count = 0; count < 5; count++) {
                        if (ispositive(data2.data[count].mmr_change_to_last_game) == true) {
                            $(`#match-rr-id-${count}`).append("+" + data2.data[count].mmr_change_to_last_game)
                        } else {
                            $(`#match-rr-id-${count}`).append(data2.data[count].mmr_change_to_last_game)
                        }
                    }
                    $('.user-rankrating').append(data2.data[0].ranking_in_tier)
                }
            },
            error: function (jqXHR) {
                createErrorCard(this.url, jqXHR.status);
            }
        });
    }, 1000)
})