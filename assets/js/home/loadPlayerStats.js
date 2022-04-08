$(document).ready(() => {
    let rawdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    let dataToRead = JSON.parse(rawdata);

    var playerRegion = dataToRead.playerRegion
    var playerUUID = dataToRead.playerUUID

    $('#sec').css("display", "none")
    setTimeout(function () {
        if (sessionStorage.getItem("afterReload")) {
            var pKills_before = 0;
            var pDeaths_before = 0;
            var pAssists_before = 0;
            var pScore_before = 0;
            var pDmg_before = 0;
            for (var count = 0; count < 5; count++) {
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
                url: `https://api.henrikdev.xyz/valorant/v1/by-puuid/mmr-history/${playerRegion}/${playerUUID}`,
                type: 'get',
                success: function (data, jqXHR) {
                    if (data.data == null || data.name == null) {
                        $('.user-rank-icon').attr("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/largeicon.png`)
                        $('.user-rank-icon').addClass("unranked")
                        $('.user-rankrating').append("0")
                        $('.home-avg-rrchange').empty()
                        $('.home-avg-rrchange').append("You haven't played any competitive matches yet!")

                        var path = window.location.pathname;
                        var page = path.split("/").pop();
                        if (page == "decoyIndex.html") {
                            setTimeout(function () {
                                $('.loading-div-home').fadeTo(950, 0)
                                $('.user-rank-icon').fadeTo(950, 1)
                                $('#sec').css("opacity", "0")
                                $('#sec').css("display", "block")
                                $('#sec').fadeTo(950, 1)
                                setTimeout(function () {
                                    $('.loading-div-home').css("display", "none")
                                }, 1000)
                            }, 1000)
                        } else {
                            $('#sec').css("opacity", "1")
                            $('#sec').css("display", "block")
                            $('.user-rank-icon').css("display", "block")
                            $('.user-rank-icon').fadeTo(950, 1)
                            setTimeout(function () {
                                $('.loading-div-home').css("display", "none")
                            }, 1000)
                        }
                    } else {
                        if (data.data[0].ranking_in_tier == undefined) {
                            $('.user-rankrating').append("0")
                        } else {
                            $('.user-rankrating').append(data.data[0].ranking_in_tier)
                        }

                        function ispositive(n) {
                            return 1 / (n * 0) === 1 / 0
                        }
                        $('.user-rank-icon').attr("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data[0].currenttier}/largeicon.png`)
                        if(data.data[0].currenttier == 0){
                            $('.user-rank-icon').addClass("unranked")
                        }
                        var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
                        var parsed = JSON.parse(raw);
                        parsed.playerRank = `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data[0].currenttier}/largeicon.png`
                        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json', JSON.stringify(parsed));
                        var i = 0;
                        for (var count = 0; count < data.data.length; count++) {
                            if (ispositive(data.data[count].mmr_change_to_last_game) == true) {
                                $(`#match-rr-id-${count}`).append("+" + data.data[count].mmr_change_to_last_game)
                            } else {
                                $(`#match-rr-id-${count}`).append(data.data[count].mmr_change_to_last_game)
                            }
                            i++;
                        }
                        var RR_after = 0;
                        for (var count = 0; count < i; count++) {
                            RR_after = RR_after + data.data[count].mmr_change_to_last_game
                        }
                        if (ispositive(RR_after) == true) {
                            $('.home-avg-rrchange').empty()
                            $('.home-avg-rrchange').append(" +" + RR_after)
                        } else {
                            $('.home-avg-rrchange').empty()
                            $('.home-avg-rrchange').append("" + RR_after)
                        }
                        var path = window.location.pathname;
                        var page = path.split("/").pop();
                        if (page == "decoyIndex.html") {
                            setTimeout(function () {
                                $('.loading-div-home').fadeTo(950, 0)
                                $('.user-rank-icon').fadeTo(950, 1)
                                $('#sec').css("opacity", "0")
                                $('.user-rank-icon').fadeTo(950, 1)
                                $('#sec').fadeTo(950, 1)
                                setTimeout(function () {
                                    $('.loading-div-home').css("display", "none")
                                }, 1000)
                            }, 1000)
                        } else {
                            $('#sec').css("opacity", "1")
                            $('#sec').css("display", "block")
                            $('.user-rank-icon').css("display", "block")
                            $('.user-rank-icon').fadeTo(950, 1)
                            setTimeout(function () {
                                $('.loading-div-home').css("display", "none")
                            }, 1000)
                        }
                    }
                },
                error: function (jqXHR) {
                    var path = window.location.pathname;
                    var page = path.split("/").pop();
                    if (page == "decoyIndex.html") {
                        setTimeout(function () {
                            $('.loading-div-home').fadeTo(950, 0)
                            $('#sec').css("opacity", "0")
                            $('#sec').css("display", "block")
                            $('#sec').fadeTo(950, 1)
                            setTimeout(function () {
                                $('.loading-div-home').css("display", "none")
                            }, 1000)
                        }, 1000)
                    } else {
                        $('#sec').css("opacity", "1")
                        $('#sec').css("display", "block")
                        setTimeout(function () {
                            $('.loading-div-home').css("display", "none")
                        }, 1000)
                    }
                    createErrorCard(this.url, jqXHR.status);
                }
            })
        } else {
            setTimeout(function () {
                sessionStorage.setItem("afterReload", true)
                window.location.href = ""
            }, 2500)
        }
    }, 750)
})