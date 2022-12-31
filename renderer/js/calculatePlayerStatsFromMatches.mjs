/**
 * Function that calculates a single players stats from all available matches, returning the averages.
 * @param {Array} matchdays 
 * @param {String} puuid 
 */

export default function calculatePlayerStatsFromMatches(matchdays, puuid) {
  var player_wins = 0;
  var player_losses = 0;

  var total_kills = 0;
  var total_deaths = 0;
  var total_assists = 0;

  var total_score = 0;

  // Divide all stats here by the match count to get the avg thing/match
  var total_match_count = 0;
  // ---------------------------------------------------------------
  // total_kills here 

  // Divide all stats here by the round count to get the avg thing/round
  var total_round_count = 0;
  // ---------------------------------------------------------------
  var total_player_round_score = 0;
  var total_round_damage_dealt = 0;
  // total_kills here 

  // Calculate these as normal
  var total_headshots = 0;
  var total_bodyshots = 0;
  var total_legshots = 0;

  var agent_stats = [];
  var weapon_kills = [];
  var map_stats = [];

  // For each key in the matchdays object
  for(var key in matchdays) {
    var matches = matchdays[key];

    for(var i = 0; i < matches.length; i++) {
      if(matches[i].matchInfo.completionState !== 'Surrendered') {
        total_match_count++;

        var map_kills = 0;
        var map_deaths = 0;
        var map_assists = 0;
        var map_wins = 0;
        var map_losses = 0;

        // Get Player Team and Round Damage
        for(var j = 0; j < matches[i].players.length; j++) {
          if(matches[i].players[j].subject == puuid) {
            var player_team = matches[i].players[j].teamId;

            var player_match_stats = matches[i].players[j];

            total_kills += matches[i].players[j].stats.kills;
            map_kills += matches[i].players[j].stats.kills;

            total_deaths += matches[i].players[j].stats.deaths;
            map_deaths += matches[i].players[j].stats.deaths;

            total_assists += matches[i].players[j].stats.assists;
            map_assists += matches[i].players[j].stats.assists;

            total_score += matches[i].players[j].stats.score;
          }
        }

        // Get if player won or lost
        for(var j = 0; j < matches[i].teams.length; j++) {
          if(matches[i].teams[j].won == true) {
            var winning_team = matches[i].teams[j].teamId;
          }
        }
        if(player_team == winning_team) {
          player_wins++;
          map_wins++;
        } else {
          player_losses++;
          map_losses++;
        }

        if(!agent_stats[player_match_stats.characterId]) {
          agent_stats[player_match_stats.characterId] = {
            "kills": player_match_stats.stats.kills,
            "deaths": player_match_stats.stats.deaths,
            "assists": player_match_stats.stats.assists,
            "score": player_match_stats.stats.score,
            "rounds_played": player_match_stats.stats.roundsPlayed,
            "times_played": 1,
            "wins": map_wins,
            "losses": map_losses
          }
        } else {
          agent_stats[player_match_stats.characterId].kills += player_match_stats.stats.kills;
          agent_stats[player_match_stats.characterId].deaths += player_match_stats.stats.deaths;
          agent_stats[player_match_stats.characterId].assists += player_match_stats.stats.assists;
          agent_stats[player_match_stats.characterId].score += player_match_stats.stats.score;
          agent_stats[player_match_stats.characterId].rounds_played += player_match_stats.stats.roundsPlayed;
          agent_stats[player_match_stats.characterId].times_played++;
          agent_stats[player_match_stats.characterId].wins += map_wins;
          agent_stats[player_match_stats.characterId].losses += map_losses;
        }

        // Loop through every round and every player in every round to find damage stats for player
        for(var j = 0; j < matches[i].roundResults.length; j++) {
          total_round_count++;
          for(var k = 0; k < matches[i].roundResults[j].playerStats.length; k++) {
            if(matches[i].roundResults[j].playerStats[k].subject == puuid) {
              total_player_round_score += matches[i].roundResults[j].playerStats[k].score;

              for(var l = 0; l < matches[i].roundResults[j].playerStats[k].damage.length; l++) {
                total_headshots += matches[i].roundResults[j].playerStats[k].damage[l].headshots;
                total_bodyshots += matches[i].roundResults[j].playerStats[k].damage[l].bodyshots;
                total_legshots += matches[i].roundResults[j].playerStats[k].damage[l].legshots;

                total_round_damage_dealt += matches[i].roundResults[j].playerStats[k].damage[l].damage;
              }

              for(var l = 0; l < matches[i].roundResults[j].playerStats[k].kills.length; l++) {
                if(matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageType === 'Weapon') {
                  if(!weapon_kills[matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageItem]) {
                    weapon_kills[matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageItem] = {
                      "kills": 1,
                    }
                  } else {
                    weapon_kills[matches[i].roundResults[j].playerStats[k].kills[l].finishingDamage.damageItem].kills++;
                  }
                }
              }
            }
          }
        }

        // Create obj with name of "matches[i].matchInfo.matchId" in map_stats array if it doesn't exist
        if(!map_stats[matches[i].matchInfo.mapId]) {
          map_stats[matches[i].matchInfo.mapId] = {
            "map_kills": map_kills,
            "map_deaths": map_deaths,
            "map_assists": map_assists,
            "map_wins": map_wins,
            "map_losses": map_losses,
            "total_times_played": 1
          }
        } else {
          map_stats[matches[i].matchInfo.mapId].map_kills += map_kills;
          map_stats[matches[i].matchInfo.mapId].map_deaths += map_deaths;
          map_stats[matches[i].matchInfo.mapId].map_assists += map_assists;
          map_stats[matches[i].matchInfo.mapId].map_wins += map_wins;
          map_stats[matches[i].matchInfo.mapId].map_losses += map_losses;
          map_stats[matches[i].matchInfo.mapId].total_times_played++;
        }
      }
    }
  }

  var win_percentage = (player_wins / total_match_count) * 100;
  var win_percentage_rounded = win_percentage.toFixed(0);

  var win_loss_ratio = (player_wins / player_losses);

  var total_shots_hit = total_headshots + total_bodyshots + total_legshots;

  var headshot_percent = (total_headshots / total_shots_hit) * 100;
  var headshot_percent_rounded = headshot_percent.toFixed(0);

  var kills_per_round = total_kills / total_round_count;
  var kills_per_round_rounded = kills_per_round.toFixed(2);

  var kills_per_match = total_kills / total_match_count;
  var kills_per_match_rounded = kills_per_match.toFixed(2);

  for(var key in agent_stats) {
    var agent_kills = agent_stats[key].kills;
    var agent_deaths = agent_stats[key].deaths;
    var agent_assists = agent_stats[key].assists;
    var agent_score = agent_stats[key].score;
    var agent_rounds_played = agent_stats[key].rounds_played;
    var agent_times_played = agent_stats[key].times_played;
    var agent_wins = agent_stats[key].wins;
    var agent_losses = agent_stats[key].losses;

    var agent_kda_ratio = (agent_kills + agent_assists) / agent_deaths;
    var agent_kda_ratio_rounded = agent_kda_ratio.toFixed(2); // IMPORTANT

    var avg_kills_per_match = agent_kills / agent_times_played;
    var avg_kills_per_match_rounded = avg_kills_per_match.toFixed(0); // IMPORTANT

    var avg_deaths_per_match = agent_deaths / agent_times_played;
    var avg_deaths_per_match_rounded = avg_deaths_per_match.toFixed(0);

    var avg_assists_per_match = agent_assists / agent_times_played;
    var avg_assists_per_match_rounded = avg_assists_per_match.toFixed(0);

    var avg_agent_kda = `${avg_kills_per_match_rounded}/${avg_deaths_per_match_rounded}/${avg_assists_per_match_rounded}`; // IMPORTANT

    var average_match_score = agent_score / agent_times_played;
    var average_match_score_rounded = average_match_score.toFixed(0); // IMPORTANT

    var agent_win_loss_ratio = (agent_wins / agent_losses);
    var agent_win_loss_ratio_rounded = agent_win_loss_ratio.toFixed(0); // IMPORTANT

    var agent_kills_per_round = agent_kills / agent_rounds_played;
    var agent_kills_per_round_rounded = agent_kills_per_round.toFixed(2); // IMPORTANT

    agent_stats[key].avg_kda_ratio = agent_kda_ratio_rounded;
    agent_stats[key].avg_kda = avg_agent_kda;
    agent_stats[key].avg_kills_per_match = avg_kills_per_match_rounded;
    agent_stats[key].kills_per_round = agent_kills_per_round_rounded;
    agent_stats[key].avg_match_score = average_match_score_rounded;
    agent_stats[key].win_loss_ratio = agent_win_loss_ratio_rounded;
  }

  for(var key in map_stats) {
    var map_kills = map_stats[key].map_kills;
    var map_deaths = map_stats[key].map_deaths;
    var map_assists = map_stats[key].map_assists;
    var map_wins = map_stats[key].map_wins;
    var map_losses = map_stats[key].map_losses;
    var total_times_played = map_stats[key].total_times_played;

    var map_kda_ratio = (map_kills + map_assists) / map_deaths;
    var map_kda_ratio_rounded = map_kda_ratio.toFixed(2); // IMPORTANT

    var map_win_percentage = (map_wins / total_times_played) * 100;
    var map_win_percentage_rounded = map_win_percentage.toFixed(0); // IMPORTANT

    var map_win_loss_ratio = (map_wins / map_losses);
    var map_win_loss_ratio_rounded = map_win_loss_ratio.toFixed(2); // IMPORTANT

    map_stats[key].map_kda_ratio = map_kda_ratio_rounded;
    map_stats[key].map_win_percentage = map_win_percentage_rounded;
    map_stats[key].map_win_loss_ratio = map_win_loss_ratio_rounded;
  }

  var avg_kd = (total_kills / total_deaths).toFixed(2);
  var avg_score = (total_score / total_round_count).toFixed(0);

  var returnObj = {
    "win_percentage": win_percentage_rounded,
    "win_loss_ratio": win_loss_ratio,
    "headshot_percent": headshot_percent_rounded,
    "kills_per_round": kills_per_round_rounded,
    "kills_per_match": kills_per_match_rounded,
    "total_kills": total_kills,
    "total_deaths": total_deaths,
    "total_assists": total_assists,
    "agent_stats": agent_stats,
    "map_stats": map_stats,
    "weapon_kills": weapon_kills,
    "avg_kd": avg_kd,
    "avg_score": avg_score
  }

  return returnObj;
}