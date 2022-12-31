export const calculateMatchStats = (match, name, tag, mapData, ranks) => {
  var gameStartUnix = match.matchInfo.gameStartMillis;
  var gameLengthMS = match.matchInfo.gameLengthMillis;
  var gameMode = match.matchInfo.queueID;
  var gameServer = match.matchInfo.gamePodId;
  var gameVersion = match.matchInfo.gameVersion;

  /* MATCH INFO */
  var winningTeamScore;
  var losingTeamScore;
  
  for(var i = 0; i < match.teams.length; i++) {
    if(match.teams[i].won == true) {
      var winning_team = match.teams[i].teamId;
      winningTeamScore = match.teams[i].numPoints;
    } else {
      losingTeamScore = match.teams[i].numPoints;
    }
  }

  if((!winningTeamScore && winningTeamScore !== 0) || (!losingTeamScore && losingTeamScore !== 0)) {
    var winning_team = 'draw';
  }

  /* MAP INFO */
  for(var i = 0; i < mapData.data.length; i++) {
    if(mapData.data[i].mapUrl == match.matchInfo.mapId) {
      var mapName = mapData.data[i].displayName;
      var mapUUID = mapData.data[i].uuid;
    }
  }

  /* PLAYER STATS */
  for(var i = 0; i < match.players.length; i++) {
    var nameTag = `${match.players[i].gameName.toLowerCase()}#${match.players[i].tagLine.toLowerCase()}`;
    var homenameTag = `${name}#${tag}`;
    var homenameTag_LowerCase = `${name.toLowerCase()}#${tag.toLowerCase()}`;
    
    if(nameTag == homenameTag_LowerCase) {
      var pInfo = match.players[i];
      var playerCurrentTier = match.players[i].competitiveTier;
      var rankFixed = ranks[playerCurrentTier];
    }
  }

  if(pInfo) {
    var uuid = pInfo.subject;
    var playerTeam = pInfo.teamId;

    if(playerTeam == winning_team) {
      var matchOutcome = "VICTORY";
      var matchOutcomeColor = 'text-val-blue val-blue-glow';
      var matchScore = winningTeamScore + ' - ' + losingTeamScore;
    } else if(winning_team == 'draw') {
      var matchOutcome = "DRAW";
      var matchOutcomeColor = 'text-val-yellow val-yellow-glow';

      if(!winningTeamScore) {
        winningTeamScore = losingTeamScore;
      } else if(!losingTeamScore) {
        losingTeamScore = winningTeamScore;
      }
      var matchScore = winningTeamScore + ' - ' + losingTeamScore;
    } else {
      var matchOutcome = "DEFEAT";
      var matchOutcomeColor = 'text-val-red val-red-glow';
      var matchScore = losingTeamScore + ' - ' + winningTeamScore;
    }

    var playerAgent = pInfo.characterId; 

    var playerKills = pInfo.stats.kills;
    var playerDeaths = pInfo.stats.deaths;
    var playerAssists = pInfo.stats.assists;

    var playerKdRaw = playerKills / playerDeaths;
    var playerKD = playerKdRaw.toFixed(2);

    var playerScore = pInfo.stats.score;
    var playerACS = playerScore / match.roundResults.length;
    var playerACS = playerACS.toFixed(0);

    if(playerKD >= 1) {
      var playerKdColor = 'text-val-blue';
    } else {
      var playerKdColor = 'text-val-red';
    }
    
    /* SCOREBOARD POSITION */
    var players = match.players;
    players.sort(function(a, b) {
      return b.stats.score - a.stats.score;
    });
    
    var playerPosition = players.findIndex(player => player.subject == uuid) + 1;

    if(playerPosition == 1) {
      // Player is Match MVP
      var playerPositionColor = 'yellow-glow text-yellow-300 font-medium';
      var playerPositionText = 'Match MVP';
    } else {
      // Player is not Match MVP, check for Team MVP
      var teamPlayers = [];
      for(var i = 0; i < players.length; i++) {
        if(players[i].teamId == playerTeam) {
          teamPlayers.push(players[i]);
        }
      }

      var teamPlayerPosition = teamPlayers.findIndex(player => player.subject == uuid) + 1;

      if(teamPlayerPosition == 1) {
        // Player is Team MVP
        var playerPositionColor = 'silver-glow text-gray-300 font-medium';
        var playerPositionText = 'Team MVP';
      } else {
        // Player is not Team MVP
        var playerPositionColor = 'font-medium';

        if(playerPosition == 2) var playerPositionText = `${playerPosition}nd`;
        else if(playerPosition == 3) var playerPositionText = `${playerPosition}rd`;
        else var playerPositionText = `${playerPosition}th`;
      }
    }
    var playerHeadShots = 0;
    var playerBodyShots = 0;
    var playerLegShots = 0;

    var totalDamage = 0;

    for(var i = 0; i < match.roundResults.length; i++) {
      for(var i2 = 0; i2 < match.roundResults[i].playerStats.length; i2++) {
        if(match.roundResults[i].playerStats[i2].subject == uuid) {
          for(var i3 = 0; i3 < match.roundResults[i].playerStats[i2].damage.length; i3++) {
            playerHeadShots += match.roundResults[i].playerStats[i2].damage[i3].headshots;
            playerBodyShots += match.roundResults[i].playerStats[i2].damage[i3].bodyshots;
            playerLegShots += match.roundResults[i].playerStats[i2].damage[i3].legshots;

            totalDamage += match.roundResults[i].playerStats[i2].damage[i3].damage;
          }
        }
      }
    }

    // Calculate HS%
    var totalShotsHit = playerHeadShots + playerBodyShots + playerLegShots;

    var headShotsPercent = (playerHeadShots / totalShotsHit) * 100;
    var headShotsPercentRounded = headShotsPercent.toFixed(0);

    var bodyShotsPercent = (playerBodyShots / totalShotsHit) * 100;
    var bodyShotsPercentRounded = bodyShotsPercent.toFixed(0);

    var legShotsPercent = (playerLegShots / totalShotsHit) * 100;
    var legShotsPercentRounded = legShotsPercent.toFixed(0);

    // Calculate ADR
    var averageDamage = totalDamage / match.roundResults.length;
    var averageDamageRounded = averageDamage.toFixed(0);

    // Calculate First Bloods. 
    // For every round, add all kills to an array. Filter out the earliest kill with the "roundTime" key. If the killer's PUUID is the same as the players, add a FB.
    var playerFBs = 0;
    for(var i = 0; i < match.roundResults.length; i++) {
      var totalRoundKills = [];
      for(var j = 0; j < match.roundResults[i].playerStats.length; j++) {
        for(var k = 0; k < match.roundResults[i].playerStats[j].kills.length; k++) {
          totalRoundKills.push(match.roundResults[i].playerStats[j].kills[k]);
        }
      }
      
      totalRoundKills.sort(function(a, b) {
        return a.roundTime - b.roundTime;
      });

      var firstRoundKill = totalRoundKills[0];
      if(firstRoundKill && firstRoundKill.killer == uuid) {
        playerFBs++;
      }
    }
  }

  var matchData = {
    playerAgent, 
    uuid,
    homenameTag,
    mapName, 
    playerCurrentTier, 
    rankFixed, 
    matchOutcomeColor, 
    matchOutcome, 
    matchScore, 
    playerPositionColor, 
    playerPositionText, 
    playerKills, 
    playerDeaths, 
    playerAssists, 
    playerKdColor, 
    playerKD, 
    headShotsPercentRounded, 
    averageDamageRounded,
    playerACS,
    matchUUID: match.matchInfo.matchId,
    isRankup: match.matchInfo.isRankupGame
  }

  var playerKDA = playerKills + '/' + playerDeaths + '/' + playerAssists
  
  var matchViewData = {
    matchScore, matchOutcome, mapUUID, mapName, gameStartUnix, gameLengthMS, gameMode, gameServer, gameVersion,
    name: homenameTag.split("#")[0], uuid, playerTeam, playerAgent, playerKD, playerKDA, playerKD, playerScore, playerACS, playerKillsPerRound: averageDamageRounded, playerCurrentTier, rankFixed, headShotsPercentRounded, bodyShotsPercentRounded, legShotsPercentRounded, playerPositionText, playerPosition, playerFBs
  }

  return { matchData, matchViewData };
}