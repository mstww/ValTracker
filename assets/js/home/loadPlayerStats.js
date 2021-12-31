$(document).ready(() => {
    let rawdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/settings/userData.json');
    let dataToRead = JSON.parse(rawdata);

    var playerName = dataToRead.playerName
    var playerTag = dataToRead.playerTag
    var playerRegion = dataToRead.playerRegion
    $('#sec').css("display", "none")
    setTimeout(function() {
        if(sessionStorage.getItem("afterReload")) {
            var pKills_before = 0;
            var pDeaths_before = 0;
            var pAssists_before = 0;
            var pScore_before = 0;
            var pDmg_before = 0;
            for(var count = 0; count < 5; count++) {
                pScore_before = pScore_before + parseInt(sessionStorage.getItem(`addToTotal_score-${count}`))
                pKills_before = pKills_before + parseInt(sessionStorage.getItem(`addToTotal_kills-${count}`))
                pDeaths_before = pDeaths_before + parseInt(sessionStorage.getItem(`addToTotal_deaths-${count}`))
                pAssists_before = pAssists_before + parseInt(sessionStorage.getItem(`addToTotal_assists-${count}`))
                pDmg_before = pDmg_before + parseInt(sessionStorage.getItem(`addToTotal_dmg-${count}`))
            }
            var pKills_after = pKills_before / 5;
            var pDeaths_after = pDeaths_before / 5;
            var pAssists_after = pAssists_before / 5;
            var pScore_after = pScore_before / 5;
            var pDmg_after = pDmg_before / parseInt(sessionStorage.getItem(`totalRoundCount`));
            
            $('.home-avg-kda').empty()
            $('.home-avg-score').empty()
            $('.home-avg-dmg_match').empty()
            $('.home-avg-kda').append(" " + Math.round(pKills_after) + "/" + Math.round(pDeaths_after) + "/" + Math.round(pAssists_after));
            $('.home-avg-score').append(" " + pScore_after);
            $('.home-avg-dmg_match').append(" " + Math.round(pDmg_after) + "HP");
            
            $.ajax({
                dataType: "json",
                url: `https://api.henrikdev.xyz/valorant/v1/mmr-history/${playerRegion}/${playerName}/${playerTag}`,
                type: 'get',
                success: function(data, xhr) {
                    $('.user-rankrating').append(data.data[0].ranking_in_tier)
                    function ispositive(n){
                        return 1/(n*0)===1/0
                    }
                    var rankIcons = [
                        './assets/img/iron_1.png', './assets/img/iron_2.png', './assets/img/iron_3.png', 
                        './assets/img/bronze_1.png', './assets/img/bronze_2.png', './assets/img/bronze_3.png', 
                        './assets/img/silver_1.png', './assets/img/silver_2.png', './assets/img/silver_3.png', 
                        './assets/img/gold_1.png', './assets/img/gold_2.png', './assets/img/gold_3.png', 
                        './assets/img/plat_1.png', './assets/img/plat_2.png', './assets/img/plat_3.png', 
                        './assets/img/dia_1.png', './assets/img/dia_2.png', './assets/img/dia_3.png', 
                        './assets/img/immortal_1.png', './assets/img/immortal_2.png', './assets/img/immortal_3.png', 
                        './assets/img/radiant.png',
                        './assets/img/unranked.png',
                    ]
                    $('.user-rank-icon').attr("src", rankIcons[data.data[0].currenttier -3])
                    for(var count = 0; count < 5; count++) {
                        if(ispositive(data.data[count].mmr_change_to_last_game) == true) {
                            $(`#match-rr-id-${count}`).append("+" + data.data[count].mmr_change_to_last_game)
                        } else {
                            $(`#match-rr-id-${count}`).append(data.data[count].mmr_change_to_last_game)
                        }
                    }
                    var RR_after = data.data[0].mmr_change_to_last_game + data.data[1].mmr_change_to_last_game + data.data[2].mmr_change_to_last_game + data.data[3].mmr_change_to_last_game + data.data[4].mmr_change_to_last_game;
                    if(ispositive(RR_after) == true) {
                        $('.home-avg-rrchange').empty()
                        $('.home-avg-rrchange').append(" +" + RR_after)
                    } else {
                        $('.home-avg-rrchange').empty()
                        $('.home-avg-rrchange').append("" + RR_after)
                    }
                    setTimeout(function() {
                        $('.loading-div-home').fadeTo(950, 0)
                        $('.user-rank-icon').fadeTo(950, 1)
                        $('#sec').css("opacity", "0")
                        $('#sec').css("display", "block")
                        $('#sec').fadeTo(950, 1)
                        setTimeout(function() {
                            $('.loading-div-home').css("display", "none")
                        }, 1000)
                    }, 1000)
                }
            })
        } else {
            setTimeout(function() {
                sessionStorage.setItem("afterReload", true)
                window.location.href = ""
            }, 2500)
        }
    }, 750)
})