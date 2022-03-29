const path = require('path');
const ipc = require('electron').ipcRenderer;
$(document).ready(async () => {
    ipc.send('changeDiscordRP', `favmatches_activity`)
    let rawuserdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
    let userdataToRead = JSON.parse(rawuserdata);

    var playerName = userdataToRead.playerName
    var playerTag = userdataToRead.playerTag
    let favrawdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json');
    var buffer = Buffer.from(favrawdata)
    if (buffer.length == 0) {
        var newArrToPush = {
            "favourites": [{

            }]
        };
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json', JSON.stringify(newArrToPush))
        window.location.href = ""
    }
    let dataToRead = JSON.parse(favrawdata);

    var allMaps = await(await fetch('https://valorant-api.com/v1/maps')).json();

    var matchIDarray = [];
    for (var count = 0; count < dataToRead.favourites.length; count++) {
        var matchID = dataToRead.favourites[count].MatchID
        matchIDarray.push(matchID)
        if (dataToRead.favourites[count] == undefined) { //No saved matches found at all
            $('.loading-icon').fadeTo(150, 0)
            setTimeout(function () {
                $('.loading-icon').css("display", "none");
                $('.loading-layer').css("display", "none");
                $('.loading-layer-fallback').css("opacity", "0");
                $('.loading-layer-fallback').css("display", "block");
                $('.loading-layer-fallback').fadeTo(150, 1)
            }, 200)
        } else { //saved match found
            if (dataToRead.favourites[count].MatchID == undefined) {
                $('.loading-icon').fadeTo(150, 0)
                setTimeout(function () {
                    $('.loading-icon').css("display", "none");
                    $('.loading-layer').css("display", "none");
                    $('.loading-layer-fallback').css("opacity", "0");
                    $('.loading-layer-fallback').css("display", "block");
                    $('.loading-layer-fallback').fadeTo(150, 1)
                }, 200)
                continue;
            }
            var checkedFolder = process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches`
            if (fs.existsSync(checkedFolder)) { //Check for folder of saved match data
                var checkedPath = process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches/${matchID}.json`
                if (fs.existsSync(checkedPath)) { //check for downloaded match data of current match
                    let rawmatchdata = fs.readFileSync(process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches/${matchID}.json`);
                    const data = JSON.parse(rawmatchdata);

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    var ms = data.data.metadata.game_length;
                    var d = new Date(1000 * Math.round(ms / 1000)); // round to nearest second
                    function pad(i) {
                        return ('0' + i).slice(-2);
                    }
                    var str = d.getUTCHours() + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());

                    var Matchcontainer = document.createElement("div");
                    Matchcontainer.className = "match-wrapper";

                    var matchmodeIcon = document.createElement("img");
                    matchmodeIcon.className = "match-mode-icon";
                    var matchmode = data.data.metadata.mode
                    if (matchmode == "Unrated" || matchmode == "Competitive" || matchmode == "Custom Game") {
                        matchmodeIcon.setAttribute("src", "../assets/img/standard.png")
                    } else {
                        matchmodeIcon.setAttribute("src", `../assets/img/${matchmode.toLowerCase()}.png`)
                    }

                    var matchMapDiv = document.createElement("div");
                    matchMapDiv.className = "match-map-gradient"

                    var matchMap = document.createElement("img");
                    matchMap.className = "match-map";
                    for(var i = 0; i < allMaps.data.length; i++) {
                        if(allMaps.data[i].displayName == data.data.metadata.map) {
                            matchMap.setAttribute("src", allMaps.data[i].listViewIcon)
                        }
                    }


                    matchMapDiv.appendChild(matchMap)

                    var playedAgent = document.createElement("img");
                    playedAgent.className = "match-played-agent";

                    for (var playerCount = 0; playerCount < data.data.players.all_players.length; playerCount++) {
                        if (data.data.players.all_players[playerCount].name == playerName && data.data.players.all_players[playerCount].tag == playerTag) {

                            if (matchmode == "Competitive") {
                                var matchRRwrapper = document.createElement("div");
                                matchRRwrapper.className = "match-rr-wrapper";

                                var matchRRimg = document.createElement("img");
                                matchRRimg.className = "match-rr-img-pp";
                                matchRRimg.setAttribute("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data.players.all_players[playerCount].currenttier}/largeicon.png`)

                                matchRRwrapper.appendChild(matchRRimg)

                                var matchRRspan = document.createElement("span");
                            }

                            playedAgent.src = data.data.players.all_players[playerCount].assets.agent.small;

                            var matchKDA = document.createElement("span");
                            matchKDA.className = "match-kda";
                            matchKDA.appendChild(document.createTextNode("KDA: " + data.data.players.all_players[playerCount].stats.kills + "/" + data.data.players.all_players[playerCount].stats.deaths + "/" + data.data.players.all_players[playerCount].stats.assists))
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
                            if (playerArray[arrcount] == playerName + "#" + playerTag) {
                                matchKDA.classList.add("MatchMVP")
                            } else {
                                for (var psearch = 0; psearch < data.data.players.all_players.length; psearch++) {
                                    if (data.data.players.all_players[psearch].name + "#" + data.data.players.all_players[psearch].tag == playerName + "#" + playerTag) {
                                        break;
                                    }
                                }
                                var teamScoreArray = [];
                                var teamPlayerArray = [];
                                if (data.data.players.all_players[psearch].team == "Blue") {
                                    for (var pcount = 0; pcount < data.data.players.red.length; pcount++) {
                                        teamScoreArray.push(data.data.players.red[pcount].stats.score)
                                        teamPlayerArray.push(data.data.players.red[pcount].name + "#" + data.data.players.red[pcount].tag)
                                    }
                                } else {
                                    for (var pcount = 0; pcount < data.data.players.red.length; pcount++) {
                                        teamScoreArray.push(data.data.players.red[pcount].stats.score)
                                        teamPlayerArray.push(data.data.players.red[pcount].name + "#" + data.data.players.red[pcount].tag)
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
                            if (data.data.teams.red.has_won == null) {
                                if (data.data.players.all_players[playerCount].stats.kills == 40) {
                                    matchStanding.className = "match-result-won";
                                    matchStanding.appendChild(document.createTextNode("WIN"));
                                } else {
                                    matchStanding.className = "match-result-lost";
                                    matchStanding.appendChild(document.createTextNode("LOSE"));
                                }
                            } else {
                                if (data.data.rounds[data.data.rounds.length - 1].end_type == "SRNDRed") {
                                    if (data.data.players.all_players[playerCount].team == data.data.rounds[data.data.rounds.length - 1].winning_team) {
                                        matchStanding.className = "match-result-won-favmatch";
                                        if (matchmode == "Competitive") {
                                            matchRRspan.className = `match-rr-pp-win`;
                                            matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                        }
                                        matchStanding.appendChild(document.createTextNode("SRNDR"));
                                    } else {
                                        matchStanding.className = "match-result-lost-favmatch";
                                        if (matchmode == "Competitive") {
                                            matchRRspan.className = `match-rr-pp-lose`;
                                            matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                        }
                                        matchStanding.appendChild(document.createTextNode("SRNDR"));
                                    }
                                } else {
                                    if (data.data.players.all_players[playerCount].team == "Blue") {
                                        if (data.data.teams.blue.rounds_won == data.data.teams.blue.rounds_lost) {
                                            matchStanding.className = "match-result-draw-favmatch";
                                            if (matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-pp-draw`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                        } else {
                                            if (data.data.teams.blue.has_won == false) {
                                                matchStanding.className = "match-result-lost-favmatch";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-lose`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                            } else {
                                                matchStanding.className = "match-result-won-favmatch";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-win`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                            }
                                        }
                                    } else {
                                        if (data.data.teams.blue.rounds_won == data.data.teams.blue.rounds_lost) {
                                            matchStanding.className = "match-result-draw-favmatch";
                                            if (matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-pp-draw`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                        } else {
                                            if (data.data.teams.red.has_won == false) {
                                                matchStanding.className = "match-result-lost-favmatch";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-lose`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.red.rounds_won + " : " + data.data.teams.red.rounds_lost));
                                            } else {
                                                matchStanding.className = "match-result-won-favmatch";
                                                if (matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-win`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.red.rounds_won + " : " + data.data.teams.red.rounds_lost));
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            continue;
                        }
                    }

                    var startedOn = document.createElement("span");
                    startedOn.className = "match-time";
                    startedOn.appendChild(document.createTextNode(data.data.metadata.game_start_patched));
                    var hiddenMatchID = document.createElement("span");
                    hiddenMatchID.className = "hidden-matchid"
                    hiddenMatchID.appendChild(document.createTextNode(data.data.metadata.matchid))
                    Matchcontainer.appendChild(hiddenMatchID);
                    Matchcontainer.setAttribute("onclick", "loadMatchView(this.firstChild.textContent, window.location.pathname)")
                    Matchcontainer.appendChild(playedAgent);
                    Matchcontainer.appendChild(matchmodeIcon);
                    Matchcontainer.appendChild(matchKDA);
                    Matchcontainer.appendChild(matchStanding);
                    Matchcontainer.appendChild(startedOn);
                    if (matchmode == "Competitive") {
                        matchRRwrapper.appendChild(matchRRspan)
                        Matchcontainer.appendChild(matchRRwrapper);
                    }
                    Matchcontainer.appendChild(matchMapDiv);
                    var favStarIcon = document.createElement("i")
                    favStarIcon.classList.add("fas", "fa-star", )
                    favStarIcon.setAttribute("id", "favStarFavs")
                    favStarIcon.setAttribute("onclick", "loadRemovePromt(this.parentElement.firstChild.textContent, this.parentElement, this.parentElement.children[1].src, this.parentElement.children[3].textContent, this.parentElement.children[4].textContent); event.stopPropagation();");
                    Matchcontainer.appendChild(favStarIcon)

                    var wrapper = document.getElementById("loading-layer");
                    var nextElement = document.getElementById("lastElement");
                    wrapper.insertBefore(Matchcontainer, nextElement);

                    setTimeout(function () {
                        $('.loading-icon').css("display", "none");
                        $('.loading-layer').css("opacity", "0");
                        $('.loading-layer').css("display", "block");
                        $('.loading-layer').fadeTo(150, 1)
                    }, 200)

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

                } else { //Downloaded Match not found
                    $.ajax({
                        dataType: "json",
                        url: `https://api.henrikdev.xyz/valorant/v2/match/${matchID}`,
                        type: 'get',
                        async: false,
                        success: function (APIdata, xhr) {
                            console.log("DOWNLOADED MATCH NOT FOUND, DOWNLOADING DATA")
                            fs.writeFileSync(checkedPath, JSON.stringify(APIdata));
                            window.location.href = ""
                        },
                        error: function (jqXHR) {
                            createErrorCard(this.url, jqXHR.status);
                        }
                    });
                }
            } else { //No folder found
                fs.mkdirSync(checkedFolder)
                console.log("NO FOLDER FOUND, CREATING FOLDER AND DOWNLOADING DATA")
                window.location.href = ""
            }
        }
    }
    fs.readdir(process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches`, (err, files) => {
        if (err) {
            console.log(err);
            fs.mkdirSync(checkedFolder)
            console.log("NO FOLDER FOUND, CREATING FOLDER")
            fs.writeFileSync(checkedPath, JSON.stringify(APIdata));
            window.location.href = ""
        } else {
            files.forEach(file => {
                if (!matchIDarray.includes(path.parse(file).name)) {
                    const deleteFile = process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches/` + file
                    fs.unlink(deleteFile, (err) => {
                        if (err) {
                            console.log(err);
                        }
                    })
                }
            })
        }
    })
})