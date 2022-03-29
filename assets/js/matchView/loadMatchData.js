$(document).ready(function () {
    ipcRenderer.send("changeDiscordRP", `matchview_activity`);
    var matchID = sessionStorage.getItem("matchID");
    var playerName = sessionStorage.getItem("player_name");
    var playerTag = sessionStorage.getItem("player_tag");
    var lastPage = sessionStorage.getItem("last_page");
    $('.player-name-rank').append(playerName)
    $('#backToLastPage').on("click", function () {
        window.location.href = lastPage
    })
    $.ajax({
        url: `https://api.henrikdev.xyz/valorant/v2/match/${matchID}`,
        type: 'get',
        success: async function (data, jqXHR) {
            $('.matchview-matchmode').append(data.data.metadata.mode)
            $('.insertMapName').append(data.data.metadata.map)
            var date = new Date(data.data.metadata.game_length);
            if(date.getSeconds().toString().length == 1) var seconds = '0' + date.getSeconds()
            else var seconds = date.getSeconds()
            $('.matchview-matchstart').append(data.data.metadata.game_start_patched);
            $('.insertGameLength').append(`${date.getMinutes()}:${seconds} min`);
            for(var i = 0; i < data.data.players.all_players.length; i++) {
                if(data.data.players.all_players[i].name + "#" + data.data.players.all_players[i].tag == playerName + '#' + playerTag) {
                    var playerDmg = Math.round(data.data.players.all_players[i].damage_made / data.data.rounds.length);
                    var playerTeam = data.data.players.all_players[i].team
                    
                    if(data.data.metadata.mode == "Competitive") {
                        $('.rank-img-small').attr('src', `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data.players.all_players[i].currenttier}/largeicon.png`)
                    } else {
                        $('.rank-img-small').css("display", "none")
                    }
                }
            }
            for(var i = 0; i < data.data.rounds.length; i++) {
                var roundWrapper = document.createElement("div");
                roundWrapper.className = "matchview-round"

                var roundCount = document.createElement("div");
                roundCount.appendChild(document.createTextNode(`Round ${i+1}`))

                var kd = document.createElement("div");
                var kills;
                var deaths = 0;
                for(var i2 = 0; i2 < data.data.rounds[i].player_stats.length; i2++) {
                    if(data.data.rounds[i].player_stats[i2].player_display_name == playerName + '#' + playerTag) {
                        kills = data.data.rounds[i].player_stats[i2].kills
                    }
                    for(var i3 = 0; i3 < data.data.rounds[i].player_stats[i2].kill_events.length; i3++) {
                        if(data.data.rounds[i].player_stats[i2].kill_events[i3].victim_display_name == playerName + '#' + playerTag) {
                            deaths++;
                        }
                    }
                }
                if(kills >= 5) kd.className = "MatchMVP"
                kd.textContent = `${kills}/${deaths}`

                var round_end = document.createElement("div");
                if(data.data.rounds[i].winning_team == playerTeam) {
                    round_end.textContent = "WON"
                    round_end.className = "matchview-blue-standing"
                } else {
                    round_end.textContent = "LOST"
                    round_end.className = "matchview-red-standing"
                }

                var end_type = document.createElement("div");
                end_type.textContent = data.data.rounds[i].end_type;

                roundWrapper.appendChild(roundCount)
                roundWrapper.appendChild(kd)
                roundWrapper.appendChild(round_end)
                roundWrapper.appendChild(end_type)

                var wrapper = document.getElementById("matchtiles-wrapper")
                var lastElement = document.getElementById("lastMatchtilesEl")
                wrapper.insertBefore(roundWrapper, lastElement)

                var sep = document.createElement("hr")
                sep.setAttribute("style", "border-color: rgba(47, 53, 77, 0.9);")
                wrapper.insertBefore(sep, roundWrapper)
            }

            var agentUUID_url;
            var headshot_before = 0;
            var bodyshot_before = 0;
            var legshot_before = 0;
            var totalFBs = 0;

            for (var count = 0; count < data.data.rounds.length; count++) { // For each round
                var killerArray = [] // new Array
                var killtimeArray = [] // new Array
                for (var count2 = 0; count2 < data.data.rounds[count].player_stats.length; count2++) { // Loop for all players
                    for (var count3 = 0; count3 < data.data.rounds[count].player_stats[count2].kill_events.length; count3++) { // for each kill
                        killerArray.push(data.data.rounds[count].player_stats[count2].kill_events[count3].killer_display_name + " " + data.data.rounds[count].player_stats[count2].kill_events[count3].kill_time_in_round)
                        killtimeArray.push(data.data.rounds[count].player_stats[count2].kill_events[count3].kill_time_in_round)
                    }
                    if (data.data.rounds[count].player_stats[count2].player_display_name == playerName + "#" + playerTag) {
                        headshot_before = headshot_before + data.data.rounds[count].player_stats[count2].headshots
                        bodyshot_before = bodyshot_before + data.data.rounds[count].player_stats[count2].bodyshots
                        legshot_before = legshot_before + data.data.rounds[count].player_stats[count2].legshots
                    }
                }
                for (var count2 = 0; count2 < killerArray.length; count2++) {
                    var killerArrayObj = killerArray[count2];
                    var killerArrayTime = killerArrayObj.split(" ").pop();
                    if (killerArrayTime == Math.min(...killtimeArray)) {
                        var firstBloodKiller = killerArrayObj.substring(0, killerArrayObj.lastIndexOf(' '))
                        if (firstBloodKiller == playerName + "#" + playerTag) {
                            totalFBs++;
                        }
                        break;
                    }
                }
            }

            for (var count = 0; count < data.data.players.all_players.length; count++) {
                if (data.data.players.all_players[count].name == playerName && data.data.players.all_players[count].tag == playerTag) {
                    if (data.data.metadata.mode == "Competitive") {
                        $('.matchview-playerrank-img').attr("src",  `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data.players.all_players[count].currenttier}/largeicon.png`)
                    }
                    var dmgperround = Math.round(data.data.players.all_players[count].damage_made / data.data.rounds.length);
                    $(`.insertDmgPerRound`).append(dmgperround);
                    if (data.data.players.all_players[count].team == "Blue") {
                        $('#team1-result').addClass("matchview-blue-standing")
                        $('#team2-result').addClass("matchview-red-standing")
                        if (data.data.teams.blue.has_won == true) {
                            $('.matchview-result-span').append("VICTORY");
                        } else {
                            $('.matchview-result-span').append("LOSS");
                        }
                        $('#team1-result').append(data.data.teams.blue.rounds_won)
                        $('#team2-result').append(data.data.teams.blue.rounds_lost)
                    } else if (data.data.players.all_players[count].team == "Red") {
                        $('#team1-result').addClass("matchview-red-standing")
                        $('#team2-result').addClass("matchview-blue-standing")
                        if (data.data.teams.red.has_won == true) {
                            $('.matchview-result-span').append("VICTORY");
                        } else {
                            $('.matchview-result-span').append("LOSS");
                        }
                        $('#team1-result').append(data.data.teams.red.rounds_won)
                        $('#team2-result').append(data.data.teams.red.rounds_lost)
                    }
                    $('.matchview-agent').attr("src", data.data.players.all_players[count].assets.agent.small)
                    agentUUID_url = data.data.players.all_players[count].assets.agent.small
                    var path2 = agentUUID_url.substring(agentUUID_url.indexOf('/'), agentUUID_url.lastIndexOf('/'));
                    agentUUID = path2.split("/").pop();
                    sessionStorage.setItem("agentUUID", agentUUID)
                    $(`.ability-c-count`).append(data.data.players.all_players[count].ability_casts.c_cast);
                    $(`.ability-q-count`).append(data.data.players.all_players[count].ability_casts.q_cast);
                    $(`.ability-e-count`).append(data.data.players.all_players[count].ability_casts.e_cast);
                    $(`.ability-x-count`).append(data.data.players.all_players[count].ability_casts.x_cast);
                    $('.insertKDAhere').append(data.data.players.all_players[count].stats.kills + "/" + data.data.players.all_players[count].stats.deaths + "/" + data.data.players.all_players[count].stats.assists)
                    break;
                }
            }
            $.ajax({
                url: `https://valorant-api.com/v1/agents`,
                type: 'get',
                success: function (data2, jqXHR) {
                    var agentUUID = sessionStorage.getItem("agentUUID")
                    for (var count = 0; count < data2.data.length; count++) {
                        if (data2.data[count].uuid == agentUUID) {
                            if(data2.data[count].uuid.displayName == playerAgent) {
                                $('.agent-image').attr('src', data2.data[count].displayIcon)
                            }
                            $('.insertDmgRound').append(`${playerDmg}`)
                            for (var iconCount = 0; iconCount < data2.data[count].abilities.length; iconCount++) {
                                $(`.matchview-abilityicon-${iconCount}`).attr("src", data2.data[count].abilities[iconCount].displayIcon)
                                $(`#insertability-${iconCount}`).append(data2.data[count].abilities[iconCount].displayName + ": ")
                            }
                        } else {
                            continue;
                        }
                    }
                    $('.insertFBsHere').append(totalFBs)
                    var totalShotsHit = headshot_before + bodyshot_before + legshot_before
                    const headshotPercent = Math.round((headshot_before / totalShotsHit) * 100)
                    const bodyshotPercent = Math.round((bodyshot_before / totalShotsHit) * 100)
                    const legshotPercent = Math.round((legshot_before / totalShotsHit) * 100)
                    $('.insertHeadshotPercent').append(headshotPercent + "%")
                    $('.insertBodyshotPercent').append(bodyshotPercent + "%")
                    $('.insertLegshotPercent').append(legshotPercent + "%")
                    $('.matchview-playername').append(playerName)
                    for (var playercount = 0; playercount < data.data.players.all_players.length; playercount++) {

                        var tr = document.createElement("tr")

                        var playerAgent = document.createElement("td")
                        playerAgent.className = "played_agent";
                        var playerAgent_img = document.createElement("img");

                        agentUUID_url = data.data.players.all_players[playercount].assets.agent.small
                        var path2 = agentUUID_url.substring(agentUUID_url.indexOf('/'), agentUUID_url.lastIndexOf('/'));
                        var agentUUID = path2.split("/").pop();

                        for (var count = 0; count < data2.data.length; count++) {
                            if (data2.data[count].uuid == agentUUID) {
                                playerAgent_img.className = "played_agent_img";
                                playerAgent_img.src = data2.data[count].displayIcon
                            } else {
                                continue;
                            }
                        }
                        playerAgent.appendChild(playerAgent_img)

                        var player_name = document.createElement("td");
                        player_name.className = "display_name"
                        if (data.data.players.all_players[playercount].team == "Red") {
                            player_name.setAttribute("style", "color: #ff0044")
                        } else {
                            player_name.setAttribute("style", "color: #00ffd5")
                        }
                        var player_tagspan = document.createElement("span");
                        player_tagspan.className = "playertag_grey"
                        player_tagspan.textContent = "#" + data.data.players.all_players[playercount].tag
                        player_name.textContent = data.data.players.all_players[playercount].name
                        player_name.appendChild(player_tagspan)

                        var player_kda = document.createElement("td");
                        player_kda.className = "player-kda";
                        player_kda.appendChild(document.createTextNode(data.data.players.all_players[playercount].stats.kills + "/" + data.data.players.all_players[playercount].stats.deaths + "/" + data.data.players.all_players[playercount].stats.assists))

                        var playerName = data.data.players.all_players[playercount].name
                        var playerTag = data.data.players.all_players[playercount].tag

                        var totalPlants = 0;
                        var totalDefuses = 0;

                        for (var count = 0; count < data.data.rounds.length; count++) {
                            if (data.data.rounds[count].bomb_planted == false) {
                                continue;
                            } else {
                                if (data.data.rounds[count].plant_events.planted_by.display_name == playerName + "#" + playerTag) {
                                    totalPlants++;
                                }
                                if (data.data.rounds[count].bomb_defused == false) {
                                    continue;
                                } else if (data.data.rounds[count].defuse_events.defuse_location.display_name == playerName + "#" + playerTag) {
                                    totalDefuses++;
                                }
                            }
                        }

                        var player_d_f = document.createElement("td");
                        player_d_f.className = "player_plants_defuses";
                        player_d_f.appendChild(document.createTextNode(totalPlants + "/" + totalDefuses))

                        var player_fbs = document.createElement("td");
                        player_fbs.className = "player_firstbloods";

                        var totalPlayerFBs = 0;

                        for (var count = 0; count < data.data.rounds.length; count++) {
                            var killerArray = []
                            var killtimeArray = []
                            for (var count2 = 0; count2 < data.data.rounds[count].player_stats.length; count2++) {
                                for (var count3 = 0; count3 < data.data.rounds[count].player_stats[count2].kill_events.length; count3++) {
                                    killerArray.push(data.data.rounds[count].player_stats[count2].kill_events[count3].killer_display_name + " " + data.data.rounds[count].player_stats[count2].kill_events[count3].kill_time_in_round)
                                    killtimeArray.push(data.data.rounds[count].player_stats[count2].kill_events[count3].kill_time_in_round)
                                }
                            }
                            for (var count2 = 0; count2 < killerArray.length; count2++) {
                                var killerArrayObj = killerArray[count2];
                                var killerArrayTime = killerArrayObj.split(" ").pop();
                                if (killerArrayTime == Math.min(...killtimeArray)) {
                                    var firstBloodKiller = killerArrayObj.substring(0, killerArrayObj.lastIndexOf(' '))
                                    if (firstBloodKiller == playerName + "#" + playerTag) {
                                        totalPlayerFBs++;
                                    }
                                    break;
                                }
                            }
                        }

                        player_fbs.appendChild(document.createTextNode(totalPlayerFBs))

                        var player_dmg_round = document.createElement("td");
                        player_dmg_round.className = "player_dmgperround";
                        var dmgperround = Math.round(data.data.players.all_players[playercount].damage_made / data.data.rounds.length);
                        player_dmg_round.appendChild(document.createTextNode(dmgperround))
                        tr.appendChild(playerAgent);
                        tr.appendChild(player_name);
                        tr.appendChild(player_kda);
                        tr.appendChild(player_d_f);
                        tr.appendChild(player_fbs);
                        tr.appendChild(player_dmg_round);

                        var wrapper = document.getElementById("test-scoreboard");
                        var nextElement = document.getElementById("lastElement");
                        wrapper.insertBefore(tr, nextElement);

                        var scoreArray = [];
                        var playerArray = [];
                        for (var pcount = 0; pcount < data.data.players.all_players.length; pcount++) {
                            scoreArray.push(data.data.players.all_players[pcount].stats.score)
                            playerArray.push(data.data.players.all_players[pcount].name + "#" + data.data.players.all_players[pcount].tag)
                        }
                        var highestScore = Math.max(...scoreArray)
                        for (var arrcount = 0; arrcount < scoreArray.length; arrcount++) {
                            if (scoreArray[arrcount] == highestScore) {
                                break;
                            }
                        }
                        var table = document.getElementById("scoreboard-table");
                        var rows = table.rows
                        for (var i = 2; i < table.rows.length; i++) {
                            var playerName = rows[i].children[1].textContent
                            if (playerArray[arrcount] == rows[i].children[1].textContent) {
                                rows[i].children[1].classList.add("MatchMVP")
                            }
                        }
                    }
                },
                error: function (jqXHR) {
                    createErrorCard(this.url, jqXHR.status);
                }
            })
        },
        error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
        }
    })
})