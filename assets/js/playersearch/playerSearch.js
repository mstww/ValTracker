const ipc = require('electron').ipcRenderer;
const fs = require('fs')

if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json')) {
  var lastSearchedMatches = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json');
  var parsedLastSearchedMatches = JSON.parse(lastSearchedMatches)

  async function deleteSearchedPlayer(DOMElement, playerSlot) {
    $(DOMElement).remove();
    $('.removeLastSearch').addClass('disabled');
    parsedLastSearchedMatches.splice(playerSlot, 1);
    fs.writeFile(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json', JSON.stringify(parsedLastSearchedMatches), err => {
      if(err) console.log(err)
      $('.removeLastSearch').removeClass('disabled');
    })
  }
  
  async function openSearchedPlayer(playerData) {
    var splitPlayerData = playerData.split(";")
    var p_uuid = splitPlayerData[0]
    var p_name = splitPlayerData[1]
    var p_tag = splitPlayerData[2]
    var p_reg = splitPlayerData[3]
  
    sessionStorage.setItem("puuid", p_uuid);
    sessionStorage.setItem("player_name", p_name);
    sessionStorage.setItem("player_tag", p_tag);
    sessionStorage.setItem("player_region", p_reg);
  
    var page = window.location.href;
    sessionStorage.setItem("last_page", page);
    
    window.location.href = "playerProfile.html";
  }
}

$(document).ready(() => {
  if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/player_search')) /*=>*/ fs.mkdirSync(process.env.APPDATA + '/VALTracker/user_data/player_search')
  if(!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json')) {
    var blankLastSearches = []
    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json', JSON.stringify(blankLastSearches))
  }

  ipc.send('changeDiscordRP', `playersearch_acitivity`)

  const replaceText = (text) => {
    const element = document.getElementById("search-output");
    if (element) element.innerText = text
  }

  playerCount = 0;
  if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json')) {
    parsedLastSearchedMatches.forEach(player => {
      var playerWrapper = document.createElement("div");
      playerWrapper.className = "last-searched-player";
      playerWrapper.setAttribute('onclick', 'openSearchedPlayer(this.lastChild.textContent)');
  
      var playerNameTag = document.createElement("span");
      playerNameTag.className = "player-name-tag";
      playerNameTag.textContent = player.player_name + "#" + player.player_tag;
  
      var playerRegion = document.createElement("span");
      playerRegion.className = "lastPlayer-player-region";
      playerRegion.textContent = player.player_region.toUpperCase();
  
      var deleteSearchedPlayer = document.createElement("i");
      deleteSearchedPlayer.classList.add("fas", "fa-times", "removeLastSearch");
      deleteSearchedPlayer.setAttribute('onclick', 'deleteSearchedPlayer(this.parentElement, this.id); event.stopPropagation();');
      deleteSearchedPlayer.id = playerCount;
  
      var searchedPlayerData = document.createElement("span");
      searchedPlayerData.setAttribute('style', 'display: none;');
      searchedPlayerData.textContent = player.puuid + ";" + player.player_name + ";" + player.player_tag + ";" + player.player_region + ";"
  
      playerWrapper.appendChild(playerNameTag);
      playerWrapper.appendChild(playerRegion);
      playerWrapper.appendChild(deleteSearchedPlayer);
      playerWrapper.appendChild(searchedPlayerData);
  
      var wrapper = document.getElementById('last-searched-players');
      var lastElement = document.getElementById('lastSPElement')
      wrapper.insertBefore(playerWrapper, lastElement)
      playerCount++;
    });
  }

  // Execute a function when the user releases a key on the keyboard
  $("#playerNameSearch").keyup(function (event) {
    var inputValue = document.getElementById("playerNameSearch").value;
    if (event.keyCode === 13) {
      if (inputValue.indexOf('#') > -1) {
        $("#playerNameSearchButton").click();
      } else {
        replaceText("ERROR!\nRiot ID's require a #:\nRiot#NA1")
        document.getElementById("playerNameSearch").focus();
        document.getElementById("playerNameSearch").select();
      }
    }
  });
  $('#playerNameSearchButton').on("click", function(event) {
    $('#playersearch-loading-circle').css("display", "block")
    var inputValue = document.getElementById("playerNameSearch").value;
    var searchedPlayerName = inputValue.substring(0, inputValue.indexOf("#"));
    var searchedPlayerTag = inputValue.substring(inputValue.indexOf("#") + 1);

    if (inputValue == "") {
      replaceText("Search Field empty.")
      $('#playersearch-loading-circle').css("display", "none")
    } else {
      if (inputValue.indexOf('#') > -1) {
        replaceText("")
        event.preventDefault();
        var searchedPlayerName = inputValue.substring(0, inputValue.indexOf("#"));
        var searchedPlayerTag = inputValue.substring(inputValue.indexOf("#") + 1);
        var searchedRegion = document.getElementById('selected-region').value;
        $.ajax({
          url: `https://api.henrikdev.xyz/valorant/v1/account/${searchedPlayerName}/${searchedPlayerTag}`,
          type: 'get',
          success: function (data, xhr) {
            var lastSearchedPlayerObj = {
              'player_name': searchedPlayerName,
              'player_tag': searchedPlayerTag,
              'player_region': searchedRegion,
              'puuid': data.data.puuid,
            }
            var alreadyInLast5 = false;
            for(var i = 0; i < parsedLastSearchedMatches.length; i++) {
              if(parsedLastSearchedMatches[i].puuid == data.data.puuid) {
                alreadyInLast5 = true
              }
            }
            if(alreadyInLast5 == false) {
              parsedLastSearchedMatches.splice(0, 0, lastSearchedPlayerObj)
              console.log(parsedLastSearchedMatches)
              if(parsedLastSearchedMatches.length > 5) {
                parsedLastSearchedMatches.splice(-1, 1);
              }
              console.log(parsedLastSearchedMatches)
              fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/player_search/last_searched_players.json', JSON.stringify(parsedLastSearchedMatches))
            }
            sessionStorage.setItem("player_name", searchedPlayerName);
            sessionStorage.setItem("player_tag", searchedPlayerTag);
            sessionStorage.setItem("player_region", searchedRegion);
            sessionStorage.setItem("puuid", data.data.puuid);
            var page = window.location.href;
            sessionStorage.setItem("last_page", page);
            window.location.href = "playerProfile.html";
          },
          error: function (xhr) {
            //get the status code
            if (xhr.status == 400) {
              replaceText('400, Bad Request');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 401) {
              replaceText('401, Unauthorized');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 403) {
              replaceText('403, Name/Tag Missing!');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 404) {
              replaceText('404, No player found!');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 405) {
              replaceText('405, Not allowed!');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 415) {
              replaceText('415, unsupported Media Type');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 429) {
              replaceText('429, Rate limit exceeded, try again later');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 500) {
              replaceText('500, Internal Server Error');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 502) {
              replaceText('502, Bad Gateway');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 503) {
              replaceText('503, Service unavailable');
              $('#playersearch-loading-circle').css("display", "none")
            }
            if (xhr.status == 504) {
              replaceText('504, Gateway timeout');
              $('#playersearch-loading-circle').css("display", "none")
            }
          },
        });
      } else {
        $('#playersearch-loading-circle').css("display", "none")
        replaceText("ERROR!\nRiot ID's require a #:\nRiot#NA1")
        document.getElementById("playerNameSearch").focus();
        document.getElementById("playerNameSearch").select();
      }
    }
  });
})