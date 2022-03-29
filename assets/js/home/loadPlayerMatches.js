const ipc = require('electron').ipcRenderer;
$(document).ready(() => {
    setTimeout(function () {
        let rawdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
        let dataToRead = JSON.parse(rawdata);

        let rawdata2 = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/home_settings/settings.json');
        let dataToRead2 = JSON.parse(rawdata2);

        var playerName = dataToRead.playerName
        var playerTag = dataToRead.playerTag
        var playerRegion = dataToRead.playerRegion
        var playerUUID = dataToRead.playerUUID

        if (dataToRead2.preferredMatchFilter == "") {
            $.ajax({
                dataType: "json",
                url: `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${playerRegion}/${playerUUID}`,
                type: 'get',
                success: function (data3, xhr) {
                    var totalRoundCount = 0;
                    for (var count = 0; count < data3.data.length; count++) {

                        var Matchcontainer = document.createElement("div");
                        Matchcontainer.className = "home-matchtile";

                        var matchmodeIcon = document.createElement("img");
                        matchmodeIcon.className = "match-mode-icon-home";
                        var matchmode = data3.data[count].metadata.mode
                        if (matchmode == "Unrated" || matchmode == "Competitive" || matchmode == "Custom Game") {
                            matchmodeIcon.setAttribute("src", "../assets/img/standard.png")
                        } else {
                            matchmodeIcon.setAttribute("src", `../assets/img/${matchmode.toLowerCase()}.png`)
                        }

                        var matchMap = document.createElement("span");
                        matchMap.className = "match-map-home";
                        matchMap.appendChild(document.createTextNode(`Map: ${data3.data[count].metadata.map}`));

                        var playedAgent = document.createElement("img");
                        playedAgent.className = "match-played-agent-home";

                        totalRoundCount = totalRoundCount + data3.data[count].rounds.length

                        for (var playerCount = 0; playerCount < data3.data[count].players.all_players.length; playerCount++) {
                            if (data3.data[count].players.all_players[playerCount].name == playerName && data3.data[count].players.all_players[playerCount].tag == playerTag) {

                                sessionStorage.setItem(`addToTotal_score-${count}`, data3.data[count].players.all_players[playerCount].stats.score)
                                sessionStorage.setItem(`addToTotal_kills-${count}`, data3.data[count].players.all_players[playerCount].stats.kills)
                                sessionStorage.setItem(`addToTotal_deaths-${count}`, data3.data[count].players.all_players[playerCount].stats.deaths)
                                sessionStorage.setItem(`addToTotal_assists-${count}`, data3.data[count].players.all_players[playerCount].stats.assists)
                                sessionStorage.setItem(`addToTotal_dmg-${count}`, data3.data[count].players.all_players[playerCount].damage_made)
                                var headshots_before = 0;
                                var bodyshots_before = 0;
                                var legshots_before = 0;
                                for (var roundCount = 0; roundCount < data3.data[count].rounds.length; roundCount++) {
                                    for (var playerCount2 = 0; playerCount2 < data3.data[count].rounds[roundCount].player_stats.length; playerCount2++) {
                                        if (data3.data[count].rounds[roundCount].player_stats[playerCount2].player_display_name == playerName + "#" + playerTag) {
                                            headshots_before = headshots_before + parseInt(data3.data[count].rounds[roundCount].player_stats[playerCount2].headshots)
                                            bodyshots_before = bodyshots_before + parseInt(data3.data[count].rounds[roundCount].player_stats[playerCount2].bodyshots)
                                            legshots_before = legshots_before + parseInt(data3.data[count].rounds[roundCount].player_stats[playerCount2].legshots)
                                            break;
                                        } else {
                                            continue;
                                        }
                                    }
                                }
                                sessionStorage.setItem(`headshot-counter-${count}`, headshots_before)
                                sessionStorage.setItem(`bodyshot-counter-${count}`, bodyshots_before)
                                sessionStorage.setItem(`legshot-counter-${count}`, legshots_before)

                                if (matchmode == "Competitive") {
                                    var matchRRwrapper = document.createElement("div");
                                    matchRRwrapper.className = "match-rr-wrapper";

                                    var matchRRimg = document.createElement("img");
                                    matchRRimg.className = "match-rr-img";
                                    matchRRimg.setAttribute("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data.players.all_players[playerCount].currenttier}/largeicon.png`)

                                    matchRRwrapper.appendChild(matchRRimg)

                                    var matchRRspan = document.createElement("span");
                                }

                                playedAgent.src = data3.data[count].players.all_players[playerCount].assets.agent.small;

                                var matchKDA = document.createElement("span");
                                matchKDA.className = "match-kda-home";
                                matchKDA.appendChild(document.createTextNode("KDA: " + data3.data[count].players.all_players[playerCount].stats.kills + "/" + data3.data[count].players.all_players[playerCount].stats.deaths + "/" + data3.data[count].players.all_players[playerCount].stats.assists))
                                var scoreArray = [];
                                var playerArray = [];
                                for (var pcount = 0; pcount < data3.data[count].players.all_players.length; pcount++) {
                                    scoreArray.push(data3.data[count].players.all_players[pcount].stats.score)
                                    playerArray.push(data3.data[count].players.all_players[pcount].name + "#" + data3.data[count].players.all_players[pcount].tag)
                                }
                                var highestScore = Math.max(...scoreArray)
                                for (var arrcount = 0; arrcount < scoreArray.length; arrcount++) {
                                    if (scoreArray[arrcount] == highestScore) {
                                        break;
                                    }
                                }
                                if (playerArray[arrcount] == playerName + "#" + playerTag) {
                                    matchKDA.classList.add("MatchMVP")
                                } else {
                                    for (var psearch = 0; psearch < data3.data[count].players.all_players.length; psearch++) {
                                        if (data3.data[count].players.all_players[psearch].name + "#" + data3.data[count].players.all_players[psearch].tag == playerName + "#" + playerTag) {
                                            break;
                                        }
                                    }
                                    var teamScoreArray = [];
                                    var teamPlayerArray = [];
                                    if (data3.data[count].players.all_players[psearch].team == "Blue") {
                                        for (var pcount = 0; pcount < data3.data[count].players.red.length; pcount++) {
                                            teamScoreArray.push(data3.data[count].players.red[pcount].stats.score)
                                            teamPlayerArray.push(data3.data[count].players.red[pcount].name + "#" + data3.data[count].players.red[pcount].tag)
                                        }
                                    } else {
                                        for (var pcount = 0; pcount < data3.data[count].players.red.length; pcount++) {
                                            teamScoreArray.push(data3.data[count].players.red[pcount].stats.score)
                                            teamPlayerArray.push(data3.data[count].players.red[pcount].name + "#" + data3.data[count].players.red[pcount].tag)
                                        }
                                    }
                                    var highestScore = Math.max(...teamScoreArray)
                                    for (var arrcount = 0; arrcount < teamScoreArray.length; arrcount++) {
                                        if (teamScoreArray[arrcount] == highestScore) {
                                            break;
                                        }
                                    }
                                    if (teamPlayerArray[arrcount] == playerName + "#" + playerTag) {
                                        matchKDA.classList.add("TeamMVP")
                                    }
                                }

                                var matchStanding = document.createElement("div");
                                var result = document.createElement("span");
                                result.className = "result-header"
                                result.appendChild(document.createTextNode("RESULT"))
                                matchStanding.appendChild(result)
                                if (data3.data[count].teams.red.has_won == null) {
                                    if (data3.data[count].players.all_players[playerCount].stats.kills == 40) {
                                        matchStanding.className = "match-result-won";
                                        matchStanding.appendChild(document.createTextNode("WIN"));
                                    } else {
                                        matchStanding.className = "match-result-lost";
                                        matchStanding.appendChild(document.createTextNode("LOSE"));
                                    }
                                } else {
                                    if (data3.data[count].rounds[data3.data[count].rounds.length - 1].end_type == "SRNDRed") {
                                        if (data3.data[count].players.all_players[playerCount].team == data3.data[count].rounds[data3.data[count].rounds.length - 1].winning_team) {
                                            matchStanding.className = "match-result-won";
                                            if (matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-home-win`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode("SRNDR"));
                                        } else {
                                            matchStanding.className = "match-result-lost";
                                            if (matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-home-lose`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode("SRNDR"));
                                        }
                                    } else {
                                        if (data3.data[count].players.all_players[playerCount].team == "Blue") {
                                            if (data3.data[count].teams.blue.rounds_won == data3.data[count].teams.blue.rounds_lost) {
                                                matchStanding.className = "match-result-draw";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-home-draw`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                            } else {
                                                if (data3.data[count].teams.blue.has_won == false) {
                                                    matchStanding.className = "match-result-lost";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-lose`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                                } else {
                                                    matchStanding.className = "match-result-won";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-win`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                                }
                                            }
                                        } else {
                                            if (data3.data[count].teams.blue.rounds_won == data3.data[count].teams.blue.rounds_lost) {
                                                matchStanding.className = "match-result-draw";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-home-draw`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                            } else {
                                                if (data3.data[count].teams.red.has_won == false) {
                                                    matchStanding.className = "match-result-lost";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-lose`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.red.rounds_won + " : " + data3.data[count].teams.red.rounds_lost));
                                                } else {
                                                    matchStanding.className = "match-result-won";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-win`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.red.rounds_won + " : " + data3.data[count].teams.red.rounds_lost));
                                                }
                                            }
                                        }
                                    }
                                }

                                //////////////////////////////////////////////////////////////////////
                            } else {
                                continue;
                            }
                        }
                        var hiddenMatchID = document.createElement("span");
                        hiddenMatchID.className = "hidden-matchid"
                        hiddenMatchID.appendChild(document.createTextNode(data3.data[count].metadata.matchid))
                        Matchcontainer.appendChild(hiddenMatchID);
                        Matchcontainer.setAttribute("onclick", "loadMatchView(this.firstChild.textContent, window.location.pathname)")
                        Matchcontainer.appendChild(playedAgent);
                        Matchcontainer.appendChild(matchmodeIcon);
                        Matchcontainer.appendChild(matchKDA);
                        Matchcontainer.appendChild(matchStanding);
                        if (matchmode == "Competitive") {
                            matchRRwrapper.appendChild(matchRRspan)
                            Matchcontainer.appendChild(matchRRwrapper);
                        }
                        Matchcontainer.appendChild(matchMap);
                        var favStarIcon = document.createElement("i")
                        favStarIcon.classList.add("far", "fa-star")
                        favStarIcon.setAttribute("onclick", "event.stopPropagation(); saveToFavs(this.parentElement.firstChild.textContent, this);");
                        Matchcontainer.appendChild(favStarIcon)

                        var wrapper = document.getElementById("last-matches");
                        var nextElement = document.getElementById("lastElement");
                        wrapper.insertBefore(Matchcontainer, nextElement);
                    }
                    sessionStorage.setItem(`totalRoundCount`, totalRoundCount)
                    var headshots_mid = 0;
                    var bodyshots_mid = 0;
                    var legshots_mid = 0;
                    for (var totalShotCount = 0; totalShotCount < 5; totalShotCount++) {
                        headshots_mid = headshots_mid + parseInt(sessionStorage.getItem(`headshot-counter-${totalShotCount}`))
                        bodyshots_mid = bodyshots_mid + parseInt(sessionStorage.getItem(`bodyshot-counter-${totalShotCount}`))
                        legshots_mid = legshots_mid + parseInt(sessionStorage.getItem(`legshot-counter-${totalShotCount}`))
                    }
                    var headshots_after = headshots_mid / 5;
                    var bodyshots_after = bodyshots_mid / 5;
                    var legshots_after = legshots_mid / 5;
                    var totalShotsHit = headshots_after + bodyshots_after + legshots_after;
                    $('.home-avg-headshots').append(" " + Math.floor((headshots_after / totalShotsHit) * 100) + "%")
                    $('.home-avg-bodyshots').append(" " + Math.floor((bodyshots_after / totalShotsHit) * 100) + "%")
                    $('.home-avg-legshots').append(" " + Math.floor((legshots_after / totalShotsHit) * 100) + "%")

                    var checkedPath1 = process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json'
                    if (fs.existsSync(checkedPath1)) {
                        var rawdata = fs.readFileSync(checkedPath1);
                        var dataToRead = JSON.parse(rawdata);
                        var matches = document.getElementsByClassName('home-matchtile')
                        for (var count = 0; count < matches.length; count++) {
                            for (var jsonCount = 0; jsonCount < dataToRead.favourites.length; jsonCount++) {
                                if (matches.item(count).firstChild.textContent == dataToRead.favourites[jsonCount].MatchID) {
                                    matches.item(count).lastChild.classList.toggle('far')
                                    matches.item(count).lastChild.classList.toggle('fas')
                                    matches.item(count).lastChild.setAttribute("id", dataToRead.favourites[jsonCount].MatchID)
                                }
                            }
                        }
                    } else {
                        var newArrToPush = {
                            "favourites": [{

                            }]
                        };

                        fs.writeFileSync(checkedPath1, JSON.stringify(newArrToPush));
                    }

                    $('.loading-icon').fadeTo(150, 0)
                    setTimeout(function () {
                        $('.loading-icon').css("display", "none");
                        $('.loading-layer').css("opacity", "0");
                        $('.loading-layer').css("display", "block");
                        $('.loading-layer').fadeTo(150, 1)
                        ipc.send('changeDiscordRP', `hub_activity`)
                    }, 200)
                },
                error: function (jqXHR) {
                    createErrorCard(this.url, jqXHR.status);
                }
            });
        } else {
            var filterType = dataToRead2.preferredMatchFilter
            $.ajax({
                dataType: "json",
                url: `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${playerRegion}/${playerUUID}?filter=${filterType}`,
                type: 'get',
                success: function (data3, xhr) {
                    var totalRoundCount = 0;
                    for (var count = 0; count < data3.data.length; count++) {

                        var Matchcontainer = document.createElement("div");
                        Matchcontainer.className = "home-matchtile";

                        var matchmodeIcon = document.createElement("img");
                        matchmodeIcon.className = "match-mode-icon-home";
                        var matchmode = data3.data[count].metadata.mode
                        if (matchmode == "Unrated" || matchmode == "Competitive" || matchmode == "Custom Game") {
                            matchmodeIcon.setAttribute("src", "../assets/img/standard.png")
                        } else {
                            matchmodeIcon.setAttribute("src", `../assets/img/${matchmode.toLowerCase()}.png`)
                        }

                        var matchMap = document.createElement("span");
                        matchMap.className = "match-map-home";
                        matchMap.appendChild(document.createTextNode(`Map: ${data3.data[count].metadata.map}`));

                        var playedAgent = document.createElement("img");
                        playedAgent.className = "match-played-agent-home";
                        totalRoundCount = totalRoundCount + data3.data[count].rounds.length

                        for (var playerCount = 0; playerCount < data3.data[count].players.all_players.length; playerCount++) {
                            if (data3.data[count].players.all_players[playerCount].name == playerName && data3.data[count].players.all_players[playerCount].tag == playerTag) {
                                if (data3.data[count].teams.red.has_won == null) {

                                } else {
                                    sessionStorage.setItem(`addToTotal_dmg-${count}`, data3.data[count].players.all_players[playerCount].damage_made)
                                    sessionStorage.setItem(`addToTotal_score-${count}`, data3.data[count].players.all_players[playerCount].stats.score)
                                    sessionStorage.setItem(`addToTotal_kills-${count}`, data3.data[count].players.all_players[playerCount].stats.kills)
                                    sessionStorage.setItem(`addToTotal_deaths-${count}`, data3.data[count].players.all_players[playerCount].stats.deaths)
                                    sessionStorage.setItem(`addToTotal_assists-${count}`, data3.data[count].players.all_players[playerCount].stats.assists)
                                }
                                var headshots_before = 0;
                                var bodyshots_before = 0;
                                var legshots_before = 0;
                                for (var roundCount = 0; roundCount < data3.data[count].rounds.length; roundCount++) {
                                    for (var playerCount2 = 0; playerCount2 < data3.data[count].rounds[roundCount].player_stats.length; playerCount2++) {
                                        if (data3.data[count].rounds[roundCount].player_stats[playerCount2].player_display_name == playerName + "#" + playerTag) {
                                            headshots_before = headshots_before + parseInt(data3.data[count].rounds[roundCount].player_stats[playerCount2].headshots)
                                            bodyshots_before = bodyshots_before + parseInt(data3.data[count].rounds[roundCount].player_stats[playerCount2].bodyshots)
                                            legshots_before = legshots_before + parseInt(data3.data[count].rounds[roundCount].player_stats[playerCount2].legshots)
                                            break;
                                        } else {
                                            continue;
                                        }
                                    }
                                }
                                sessionStorage.setItem(`headshot-counter-${count}`, headshots_before)
                                sessionStorage.setItem(`bodyshot-counter-${count}`, bodyshots_before)
                                sessionStorage.setItem(`legshot-counter-${count}`, legshots_before)

                                if (matchmode == "Competitive") {
                                    var matchRRwrapper = document.createElement("div");
                                    matchRRwrapper.className = "match-rr-wrapper";

                                    var matchRRimg = document.createElement("img");
                                    matchRRimg.className = "match-rr-img";
                                    matchRRimg.setAttribute("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data3.data[count].players.all_players[playerCount].currenttier}/largeicon.png`)

                                    matchRRwrapper.appendChild(matchRRimg)

                                    var matchRRspan = document.createElement("span");
                                }

                                playedAgent.src = data3.data[count].players.all_players[playerCount].assets.agent.small;

                                var matchKDA = document.createElement("span");
                                matchKDA.className = "match-kda-home";
                                matchKDA.appendChild(document.createTextNode("KDA: " + data3.data[count].players.all_players[playerCount].stats.kills + "/" + data3.data[count].players.all_players[playerCount].stats.deaths + "/" + data3.data[count].players.all_players[playerCount].stats.assists))
                                var scoreArray = [];
                                var playerArray = [];
                                for (var pcount = 0; pcount < data3.data[count].players.all_players.length; pcount++) {
                                    scoreArray.push(data3.data[count].players.all_players[pcount].stats.score)
                                    playerArray.push(data3.data[count].players.all_players[pcount].name + "#" + data3.data[count].players.all_players[pcount].tag)
                                }
                                var highestScore = Math.max(...scoreArray)
                                for (var arrcount = 0; arrcount < scoreArray.length; arrcount++) {
                                    if (scoreArray[arrcount] == highestScore) {
                                        break;
                                    }
                                }
                                if (playerArray[arrcount] == playerName + "#" + playerTag) {
                                    matchKDA.classList.add("MatchMVP")
                                } else {
                                    for (var psearch = 0; psearch < data3.data[count].players.all_players.length; psearch++) {
                                        if (data3.data[count].players.all_players[psearch].name + "#" + data3.data[count].players.all_players[psearch].tag == playerName + "#" + playerTag) {
                                            break;
                                        }
                                    }
                                    var teamScoreArray = [];
                                    var teamPlayerArray = [];
                                    if (data3.data[count].players.all_players[psearch].team == "Blue") {
                                        for (var pcount = 0; pcount < data3.data[count].players.red.length; pcount++) {
                                            teamScoreArray.push(data3.data[count].players.red[pcount].stats.score)
                                            teamPlayerArray.push(data3.data[count].players.red[pcount].name + "#" + data3.data[count].players.red[pcount].tag)
                                        }
                                    } else {
                                        for (var pcount = 0; pcount < data3.data[count].players.red.length; pcount++) {
                                            teamScoreArray.push(data3.data[count].players.red[pcount].stats.score)
                                            teamPlayerArray.push(data3.data[count].players.red[pcount].name + "#" + data3.data[count].players.red[pcount].tag)
                                        }
                                    }
                                    var highestScore = Math.max(...teamScoreArray)
                                    for (var arrcount = 0; arrcount < teamScoreArray.length; arrcount++) {
                                        if (teamScoreArray[arrcount] == highestScore) {
                                            break;
                                        }
                                    }
                                    if (teamPlayerArray[arrcount] == playerName + "#" + playerTag) {
                                        matchKDA.classList.add("TeamMVP")
                                    }
                                }

                                var matchStanding = document.createElement("div");
                                var result = document.createElement("span");
                                result.className = "result-header"
                                result.appendChild(document.createTextNode("RESULT"))
                                matchStanding.appendChild(result)
                                if (data3.data[count].teams.red.has_won == null) {
                                    if (data3.data[count].players.all_players[playerCount].stats.kills == 40) {
                                        matchStanding.className = "match-result-won";
                                        matchStanding.appendChild(document.createTextNode("WIN"));
                                    } else {
                                        matchStanding.className = "match-result-lost";
                                        matchStanding.appendChild(document.createTextNode("LOSE"));
                                    }
                                } else {
                                    if (data3.data[count].rounds[data3.data[count].rounds.length - 1].end_type == "SRNDRed") {
                                        if (data3.data[count].players.all_players[playerCount].team == data3.data[count].rounds[data3.data[count].rounds.length - 1].winning_team) {
                                            matchStanding.className = "match-result-won";
                                            if (matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-home-win`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode("SRNDR"));
                                        } else {
                                            matchStanding.className = "match-result-lost";
                                            if (matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-home-lose`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode("SRNDR"));
                                        }
                                    } else {
                                        if (data3.data[count].players.all_players[playerCount].team == "Blue") {
                                            if (data3.data[count].teams.blue.rounds_won == data3.data[count].teams.blue.rounds_lost) {
                                                matchStanding.className = "match-result-draw";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-home-draw`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                            } else {
                                                if (data3.data[count].teams.blue.has_won == false) {
                                                    matchStanding.className = "match-result-lost";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-lose`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                                } else {
                                                    matchStanding.className = "match-result-won";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-win`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                                }
                                            }
                                        } else {
                                            if (data3.data[count].teams.blue.rounds_won == data3.data[count].teams.blue.rounds_lost) {
                                                matchStanding.className = "match-result-draw";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-home-draw`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data3.data[count].teams.blue.rounds_won + " : " + data3.data[count].teams.blue.rounds_lost));
                                            } else {
                                                if (data3.data[count].teams.red.has_won == false) {
                                                    matchStanding.className = "match-result-lost";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-lose`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.red.rounds_won + " : " + data3.data[count].teams.red.rounds_lost));
                                                } else {
                                                    matchStanding.className = "match-result-won";
                                                    if (matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-home-win`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data3.data[count].teams.red.rounds_won + " : " + data3.data[count].teams.red.rounds_lost));
                                                }
                                            }
                                        }
                                    }
                                }

                                //////////////////////////////////////////////////////////////////////
                            } else {
                                continue;
                            }
                        }
                        var hiddenMatchID = document.createElement("span");
                        hiddenMatchID.className = "hidden-matchid"
                        hiddenMatchID.appendChild(document.createTextNode(data3.data[count].metadata.matchid))
                        Matchcontainer.appendChild(hiddenMatchID);
                        Matchcontainer.setAttribute("onclick", "loadMatchView(this.firstChild.textContent, window.location.pathname)")
                        Matchcontainer.appendChild(playedAgent);
                        Matchcontainer.appendChild(matchmodeIcon);
                        Matchcontainer.appendChild(matchKDA);
                        Matchcontainer.appendChild(matchStanding);
                        if (matchmode == "Competitive") {
                            matchRRwrapper.appendChild(matchRRspan)
                            Matchcontainer.appendChild(matchRRwrapper);
                        }
                        Matchcontainer.appendChild(matchMap);
                        var favStarIcon = document.createElement("i")
                        favStarIcon.classList.add("far", "fa-star")
                        favStarIcon.setAttribute("onclick", "event.stopPropagation(); saveToFavs(this.parentElement.firstChild.textContent, this);");
                        Matchcontainer.appendChild(favStarIcon)

                        var wrapper = document.getElementById("last-matches");
                        var nextElement = document.getElementById("lastElement");
                        wrapper.insertBefore(Matchcontainer, nextElement);
                    }

                    sessionStorage.setItem(`totalRoundCount`, totalRoundCount)

                    var headshots_mid = 0;
                    var bodyshots_mid = 0;
                    var legshots_mid = 0;
                    for (var totalShotCount = 0; totalShotCount < 5; totalShotCount++) {
                        headshots_mid = headshots_mid + parseInt(sessionStorage.getItem(`headshot-counter-${totalShotCount}`))
                        bodyshots_mid = bodyshots_mid + parseInt(sessionStorage.getItem(`bodyshot-counter-${totalShotCount}`))
                        legshots_mid = legshots_mid + parseInt(sessionStorage.getItem(`legshot-counter-${totalShotCount}`))
                    }
                    var headshots_after = headshots_mid / 5;
                    var bodyshots_after = bodyshots_mid / 5;
                    var legshots_after = legshots_mid / 5;
                    var totalShotsHit = headshots_after + bodyshots_after + legshots_after;
                    $('.home-avg-headshots').append(" " + Math.floor((headshots_after / totalShotsHit) * 100) + "%")
                    $('.home-avg-bodyshots').append(" " + Math.floor((bodyshots_after / totalShotsHit) * 100) + "%")
                    $('.home-avg-legshots').append(" " + Math.floor((legshots_after / totalShotsHit) * 100) + "%")

                    var checkedPath1 = process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json'
                    if (fs.existsSync(checkedPath1)) {
                        var rawdata = fs.readFileSync(checkedPath1);
                        var dataToRead = JSON.parse(rawdata);
                        var matches = document.getElementsByClassName('home-matchtile')
                        for (var count = 0; count < matches.length; count++) {
                            for (var jsonCount = 0; jsonCount < dataToRead.favourites.length; jsonCount++) {
                                if (matches.item(count).firstChild.textContent == dataToRead.favourites[jsonCount].MatchID) {
                                    matches.item(count).lastChild.classList.toggle('far')
                                    matches.item(count).lastChild.classList.toggle('fas')
                                    matches.item(count).lastChild.setAttribute("id", dataToRead.favourites[jsonCount].MatchID)
                                }
                            }
                        }
                    } else {
                        var newArrToPush = {
                            "favourites": [{

                            }]
                        };

                        fs.writeFileSync(checkedPath1, JSON.stringify(newArrToPush));
                    }

                    $('.loading-icon').fadeTo(150, 0)
                    setTimeout(function () {
                        $('.loading-icon').css("display", "none");
                        $('.loading-layer').css("opacity", "0");
                        $('.loading-layer').css("display", "block");
                        $('.loading-layer').fadeTo(150, 1)
                        ipc.send('changeDiscordRP', `hub_activity`)
                    }, 200)
                },
                error: function (jqXHR) {
                    createErrorCard(this.url, jqXHR.status);
                }
            });
        }
    }, 250)
})