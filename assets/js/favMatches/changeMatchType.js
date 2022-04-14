var fs = require('fs');
$(document).ready(() => {
    setTimeout(async function () {
        let rawuserdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json');
        let userdataToRead = JSON.parse(rawuserdata);
        var playerName = userdataToRead.playerName
        var playerTag = userdataToRead.playerTag
        let favrawdata = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json');
        let dataToRead = JSON.parse(favrawdata);

        var allMaps = await(await fetch('https://valorant-api.com/v1/maps')).json();
    
        $("#selected-matchtype").change(async function () {
            document.querySelectorAll('.match-wrapper').forEach(e => e.remove());
            var filterType = document.getElementById('selected-matchtype').value;
            if(filterType == "") {
                for (var count = 0; count < dataToRead.favourites.length; count++) {
                    var matchID = dataToRead.favourites[count].MatchID
                    let rawmatchdata = fs.readFileSync(process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches/${matchID}.json`);
                    const data = JSON.parse(rawmatchdata);

                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    var ms = data.data.metadata.game_length;
                    var d = new Date(1000 * Math.round(ms / 1000)); // round to nearest second
                    function pad(i) {
                        return ('0' + i).slice(-2);
                    }

                    var Matchcontainer = document.createElement("div");
                    Matchcontainer.className = "match-wrapper";

                    var matchmodeIcon = document.createElement("img");
                    matchmodeIcon.className = "match-mode-icon";
                    var matchmode = data.data.metadata.mode
                    if(matchmode == "Unrated" || matchmode == "Competitive" || matchmode == "Custom Game") {
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
                        if(data.data.players.all_players[playerCount].name == playerName && data.data.players.all_players[playerCount].tag == playerTag) {

                            if(matchmode == "Competitive") {
                                var matchRRwrapper = document.createElement("div");
                                matchRRwrapper.className = "match-rr-wrapper";

                                var matchRRimg = document.createElement("img");
                                matchRRimg.className = "match-rr-img-pp";
                                matchRRimg.setAttribute("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data.players.all_players[playerCount].currenttier}/largeicon.png`)
                                
                                if(data.data.players.all_players[playerCount].currenttier == 0) {
                                    matchRRimg.classList.add('unranked');
                                }

                                matchRRwrapper.appendChild(matchRRimg)

                                var matchRRspan = document.createElement("span");
                            }

                            playedAgent.src = data.data.players.all_players[playerCount].assets.agent.small;

                            var matchKDA = document.createElement("span");
                            matchKDA.className = "match-kda";
                            matchKDA.appendChild(document.createTextNode("KDA: " + data.data.players.all_players[playerCount].stats.kills + "/" + data.data.players.all_players[playerCount].stats.deaths + "/" + data.data.players.all_players[playerCount].stats.assists))

                            var matchStanding = document.createElement("div");
                            var result = document.createElement("span");
                            result.className = "result-header"
                            result.appendChild(document.createTextNode("RESULT"))
                            matchStanding.appendChild(result)
                            if(data.data.teams.red.has_won == null) {
                                if(data.data.players.all_players[playerCount].stats.kills == 40) {
                                    matchStanding.className = "match-result-won";
                                    matchStanding.appendChild(document.createTextNode("WIN"));
                                } else {
                                    matchStanding.className = "match-result-lost";
                                    matchStanding.appendChild(document.createTextNode("LOSE"));
                                }
                            } else {
                                if(data.data.rounds[data.data.rounds.length - 1].end_type == "SRNDRed") {
                                    if(data.data.players.all_players[playerCount].team == data.data.rounds[data.data.rounds.length - 1].winning_team) {
                                        matchStanding.className = "match-result-won-favmatch";
                                        if(matchmode == "Competitive") {
                                            matchRRspan.className = `match-rr-pp-win`;
                                            matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                        }
                                        matchStanding.appendChild(document.createTextNode("SRNDR"));
                                    } else {
                                        matchStanding.className = "match-result-lost-favmatch";
                                        if(matchmode == "Competitive") {
                                            matchRRspan.className = `match-rr-pp-lose`;
                                            matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                        }
                                        matchStanding.appendChild(document.createTextNode("SRNDR"));
                                    }
                                } else {
                                    if(data.data.players.all_players[playerCount].team == "Blue") {
                                        if(data.data.teams.blue.rounds_won == data.data.teams.blue.rounds_lost) {
                                            matchStanding.className = "match-result-draw-favmatch";
                                            if(matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-pp-draw`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                        } else {
                                            if(data.data.teams.blue.has_won == false) {
                                                matchStanding.className = "match-result-lost-favmatch";
                                                if(matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-lose`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                            } else {
                                                matchStanding.className = "match-result-won-favmatch";
                                                if(matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-win`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                            }
                                        }
                                    } else {
                                        if(data.data.teams.blue.rounds_won == data.data.teams.blue.rounds_lost) {
                                            matchStanding.className = "match-result-draw-favmatch";
                                            if(matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-pp-draw`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                        } else {
                                            if(data.data.teams.red.has_won == false) {
                                                matchStanding.className = "match-result-lost-favmatch";
                                                if(matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-lose`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.red.rounds_won + " : " + data.data.teams.red.rounds_lost));
                                            } else {
                                                matchStanding.className = "match-result-won-favmatch";
                                                if(matchmode == "Competitive") {
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
                    if(matchmode == "Competitive") {
                        matchRRwrapper.appendChild(matchRRspan)
                        Matchcontainer.appendChild(matchRRwrapper);
                    }
                    Matchcontainer.appendChild(startedOn);
                    Matchcontainer.appendChild(matchMapDiv);

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

                }
            } else {
                for (var count = 0; count < dataToRead.favourites.length; count++) {
                    var matchID = dataToRead.favourites[count].MatchID
                    let rawmatchdata = fs.readFileSync(process.env.APPDATA + `/VALTracker/user_data/favourite_matches/matches/${matchID}.json`);
                    const data = JSON.parse(rawmatchdata);
                    if(data.data.metadata.mode.toLowerCase() == filterType) {

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
                        if(matchmode == "Unrated" || matchmode == "Competitive" || matchmode == "Custom Game") {
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
                            if(data.data.players.all_players[playerCount].name == playerName && data.data.players.all_players[playerCount].tag == playerTag) {

                                if(matchmode == "Competitive") {
                                    var matchRRwrapper = document.createElement("div");
                                    matchRRwrapper.className = "match-rr-wrapper";

                                    var matchRRimg = document.createElement("img");
                                    matchRRimg.className = "match-rr-img-pp";
                                    matchRRimg.setAttribute("src", `https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/${data.data.players.all_players[playerCount].currenttier}/largeicon.png`)
                                
                                    if(data.data.players.all_players[playerCount].currenttier == 0) {
                                        matchRRimg.classList.add('unranked');
                                    }

                                    matchRRwrapper.appendChild(matchRRimg)

                                    var matchRRspan = document.createElement("span");
                                }

                                playedAgent.src = data.data.players.all_players[playerCount].assets.agent.small;

                                var matchKDA = document.createElement("span");
                                matchKDA.className = "match-kda";
                                matchKDA.appendChild(document.createTextNode("KDA: " + data.data.players.all_players[playerCount].stats.kills + "/" + data.data.players.all_players[playerCount].stats.deaths + "/" + data.data.players.all_players[playerCount].stats.assists))

                                var matchStanding = document.createElement("div");
                                var result = document.createElement("span");
                                result.className = "result-header"
                                result.appendChild(document.createTextNode("RESULT"))
                                matchStanding.appendChild(result)
                                if(data.data.teams.red.has_won == null) {
                                    if(data.data.players.all_players[playerCount].stats.kills == 40) {
                                        matchStanding.className = "match-result-won";
                                        matchStanding.appendChild(document.createTextNode("WIN"));
                                    } else {
                                        matchStanding.className = "match-result-lost";
                                        matchStanding.appendChild(document.createTextNode("LOSE"));
                                    }
                                } else {
                                    if(data.data.rounds[data.data.rounds.length - 1].end_type == "SRNDRed") {
                                        if(data.data.players.all_players[playerCount].team == data.data.rounds[data.data.rounds.length - 1].winning_team) {
                                            matchStanding.className = "match-result-won-favmatch";
                                            if(matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-pp-win`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode("SRNDR"));
                                        } else {
                                            matchStanding.className = "match-result-lost-favmatch";
                                            if(matchmode == "Competitive") {
                                                matchRRspan.className = `match-rr-pp-lose`;
                                                matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                            }
                                            matchStanding.appendChild(document.createTextNode("SRNDR"));
                                        }
                                    } else {
                                        if(data.data.players.all_players[playerCount].team == "Blue") {
                                            if(data.data.teams.blue.rounds_won == data.data.teams.blue.rounds_lost) {
                                                matchStanding.className = "match-result-draw-favmatch";
                                                if(matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-draw`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                            } else {
                                                if(data.data.teams.blue.has_won == false) {
                                                    matchStanding.className = "match-result-lost-favmatch";
                                                    if(matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-pp-lose`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                                } else {
                                                    matchStanding.className = "match-result-won-favmatch";
                                                    if(matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-pp-win`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                                }
                                            }
                                        } else {
                                            if(data.data.teams.blue.rounds_won == data.data.teams.blue.rounds_lost) {
                                                matchStanding.className = "match-result-draw-favmatch";
                                                if(matchmode == "Competitive") {
                                                    matchRRspan.className = `match-rr-pp-draw`;
                                                    matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                }
                                                matchStanding.appendChild(document.createTextNode(data.data.teams.blue.rounds_won + " : " + data.data.teams.blue.rounds_lost));
                                            } else {
                                                if(data.data.teams.red.has_won == false) {
                                                    matchStanding.className = "match-result-lost-favmatch";
                                                    if(matchmode == "Competitive") {
                                                        matchRRspan.className = `match-rr-pp-lose`;
                                                        matchRRspan.setAttribute("id", "match-rr-id-" + count);
                                                    }
                                                    matchStanding.appendChild(document.createTextNode(data.data.teams.red.rounds_won + " : " + data.data.teams.red.rounds_lost));
                                                } else {
                                                    matchStanding.className = "match-result-won-favmatch";
                                                    if(matchmode == "Competitive") {
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
                        if(matchmode == "Competitive") {
                            matchRRwrapper.appendChild(matchRRspan)
                            Matchcontainer.appendChild(matchRRwrapper);
                        }
                        Matchcontainer.appendChild(startedOn);
                        Matchcontainer.appendChild(matchMapDiv);

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
                    }
                }
            }
        });
    }, 500)
});