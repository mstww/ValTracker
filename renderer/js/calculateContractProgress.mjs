import { getLevelRewardData } from "./getLevelRewardData.mjs";
import { getPlayerContracts } from "./riotAPIFunctions.mjs";
import { updateThing } from '../js/dbFunctions.mjs';
import APIi18n from "../components/translation/ValApiFormatter.jsx";

export const calculateContractProgress = async (region, puuid, bearer, entitlement, lang) => {
  var contracts = await (await fetch('https://valorant-api.com/v1/contracts?language=' + APIi18n(lang), { 'Content-Type': 'application/json' })).json();
  var player_contracts = await getPlayerContracts(region, puuid, entitlement, bearer);

  var activeAgentContractUUID = player_contracts.ActiveSpecialContract;
  var activeBattlePassContractUUID = contracts.data[contracts.data.length-1].uuid;

  // Get Progress in agent contract 
  for(var i = 0; i < player_contracts.Contracts.length; i++) {
    if(player_contracts.Contracts[i].ContractDefinitionID === activeAgentContractUUID) {
      var agentContractUUID = player_contracts.Contracts[i].ContractDefinitionID
      var agentContractProgressionLevel = player_contracts.Contracts[i].ProgressionLevelReached;
      var agentContractXpRemaining = player_contracts.Contracts[i].ProgressionTowardsNextLevel;
    }
  }

  var agentContractData = {
    data: contracts.data.find(x => x.uuid === agentContractUUID)
  }
  var tierCount = 0;

  var agentContractProgression = {
    current_level: {},
    next_level: {},
  };

  if(agentContractProgressionLevel === 10) {
    var current_chapter = agentContractData.data.content.chapters[agentContractData.data.content.chapters.length-1];
    
    var current_level = current_chapter.levels[current_chapter.levels.length-2];
    var next_level = current_chapter.levels[current_chapter.levels.length-1];

    var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);

    agentContractProgression.current_level.reward = current_level_data;
    agentContractProgression.current_level.levelNum = 9;

    var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);

    agentContractProgression.next_level.reward = next_level_data;
    agentContractProgression.next_level.levelNum = 10;

    agentContractProgression.totalXPneeded = 1;
    agentContractProgression.currentXPowned = 1;
  } else {
    for(var i = 0; i < agentContractData.data.content.chapters.length; i++) {
      var current_chapter = agentContractData.data.content.chapters[i];
      var next_chapter = undefined;
  
      if(agentContractData.data.content.chapters[i+1]) {
        next_chapter = agentContractData.data.content.chapters[i+1];
      }
      
      for(var j = 0; j < current_chapter.levels.length; j++) {
        var next_level = undefined;
        var current_level = current_chapter.levels[j-1];
  
        if(current_level === undefined && tierCount === 5) {
          var prev_chapter = agentContractData.data.content.chapters[i-1];
          current_level = prev_chapter.levels[prev_chapter.levels.length-1];
        }
  
        if(current_chapter.levels[j]) {
          next_level = current_chapter.levels[j];
        }
  
        if(next_level === undefined && next_chapter !== undefined) {
          current_level = current_chapter.levels[current_chapter.levels.length-1];
          next_level = next_chapter.levels[0]; 
        }
  
        if(next_level === undefined) {
          next_level = current_chapter.levels[j+1];
          current_level = current_chapter.levels[j];
          var atEnd = true;
        }
  
        if(tierCount == agentContractProgressionLevel) {
          if(current_level) {
            if(atEnd === true) {
              var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
    
              agentContractProgression.current_level.reward = current_level_data;
              agentContractProgression.current_level.levelNum = tierCount -1;
            } else {
              var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
    
              agentContractProgression.current_level.reward = current_level_data;
              agentContractProgression.current_level.levelNum = tierCount;
            }
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
  
            agentContractProgression.current_level.reward = current_level_data;
            agentContractProgression.current_level.levelNum = tierCount;
          } else {
            agentContractProgression.current_level.reward = null;
            agentContractProgression.current_level.levelNum = 0;
          }
          
          if(atEnd === true) {
            var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);
  
            agentContractProgression.next_level.reward = next_level_data;
            agentContractProgression.next_level.levelNum = tierCount;
  
            agentContractProgression.totalXPneeded = 1;
            agentContractProgression.currentXPowned = 1;
          } else {
            var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);
  
            agentContractProgression.next_level.reward = next_level_data;
            agentContractProgression.next_level.levelNum = tierCount + 1;
  
            agentContractProgression.totalXPneeded = next_level.xp;
            agentContractProgression.currentXPowned = agentContractXpRemaining;
          }
          break;
        }
  
        tierCount++;
      }
    }
  }

  // Get Progress in battle pass contract 
  for(var i = 0; i < player_contracts.Contracts.length; i++) {
    if(player_contracts.Contracts[i].ContractDefinitionID === activeBattlePassContractUUID) {
      var battlePassUUID = player_contracts.Contracts[i].ContractDefinitionID
      var battlePassProgressionLevel = player_contracts.Contracts[i].ProgressionLevelReached;
      var battlePassXpRemaining = player_contracts.Contracts[i].ProgressionTowardsNextLevel;
    }
  }


  var battlePassData = {
    data: contracts.data.find(x => x.uuid === battlePassUUID)
  }
  tierCount = 0;

  var battlePassProgression = {
    current_level: {},
    next_level: {},
  };

  for(var i = 0; i < battlePassData.data.content.chapters.length; i++) {
    var current_chapter = battlePassData.data.content.chapters[i];
    var next_chapter = undefined;
    var atEnd = false;
    
    if(battlePassData.data.content.chapters[i+1]) {
      next_chapter = battlePassData.data.content.chapters[i+1];
    }

    for(var j = 0; j < current_chapter.levels.length; j++) {
      var current_level = current_chapter.levels[j];
      var next_level = undefined;

      if(current_chapter.levels[j+1]) {
        next_level = current_chapter.levels[j+1];
      }

      if(next_level === undefined && next_chapter !== undefined) {
        next_level = next_chapter.levels[0];
      }

      if(next_level === undefined && next_chapter == undefined) {
        next_level = current_level;
        current_level = current_chapter.levels[j-1];
        atEnd = true;
      }

      tierCount++;

      if(tierCount == battlePassProgressionLevel) {
        if(current_level) {
          if(atEnd === true) {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
  
            battlePassProgression.current_level.reward = current_level_data;
            battlePassProgression.current_level.levelNum = tierCount -1;
          } else {
            var current_level_data = await getLevelRewardData(current_level.reward.uuid, current_level.reward.type, lang);
  
            battlePassProgression.current_level.reward = current_level_data;
            battlePassProgression.current_level.levelNum = tierCount;
          }
        } else {
          battlePassProgression.current_level.reward = null;
          battlePassProgression.current_level.levelNum = 0;
        }

        if(atEnd === true) {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);

          battlePassProgression.totalXPneeded = 1;
          battlePassProgression.currentXPowned = 1;

          battlePassProgression.next_level.reward = next_level_data;
          battlePassProgression.next_level.levelNum = tierCount;
        } else {
          var next_level_data = await getLevelRewardData(next_level.reward.uuid, next_level.reward.type, lang);

          battlePassProgression.totalXPneeded = next_level.xp;
          battlePassProgression.currentXPowned = battlePassXpRemaining;

          battlePassProgression.next_level.reward = next_level_data;
          battlePassProgression.next_level.levelNum = tierCount + 1;
        }
      }
    }
  } 

  var data = {
    agentContractProgress: agentContractProgression,
    battlePassProgress: battlePassProgression,
    date: Date.now()
  }
  
  await updateThing(`hubContractProgress:⟨${puuid}⟩`, data);

  return data;
}