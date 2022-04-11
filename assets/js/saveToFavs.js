function saveToFavs(matchID, thisStar) {
    if(thisStar.id == '' || thisStar.id == null) {
        var checkedPath1 = process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json'
        let rawdata = fs.readFileSync(checkedPath1);
        let dataToRead = JSON.parse(rawdata);

        thisStar.setAttribute("id", matchID)
        thisStar.classList.toggle('far')
        thisStar.classList.toggle('fas')

        var hasFoundEmtySpace = false;

        for (var count = 0; count < dataToRead.favourites.length; count++) {
            if(dataToRead.favourites[count].MatchID == undefined) {
                dataToRead.favourites[count] = {
                    "MatchID": matchID
                }
                hasFoundEmtySpace = true;
                break;
            } else {
                continue
            }
        }
        if(hasFoundEmtySpace == false) {
            dataToRead.favourites[dataToRead.favourites.length] = {
                "MatchID": matchID
            }
        }
        fs.writeFileSync(checkedPath1, JSON.stringify(dataToRead));
    } else {
        var checkedPath1 = process.env.APPDATA + '/VALTracker/user_data/favourite_matches/matches.json'
        let rawdata = fs.readFileSync(checkedPath1);
        let dataToRead = JSON.parse(rawdata);

        for (var count = 0; count < dataToRead.favourites.length; count++) {
            if(dataToRead.favourites[count].MatchID == thisStar.id) {
                delete dataToRead.favourites[count]
            }
        }
        var newArrToPush = {
            "favourites": [{

            }]
        };
        for (var count = 0; count < dataToRead.favourites.length; count++) {
            if(dataToRead.favourites[count] == null) {
                continue
            } else {
                newArrToPush.favourites.push(dataToRead.favourites[count])
            }
        }

        fs.writeFileSync(checkedPath1, JSON.stringify(newArrToPush));

        thisStar.removeAttribute("id")
        thisStar.classList.toggle('far')
        thisStar.classList.toggle('fas')
    }
}

$(document).ready(() => {})

//For loop, alle objects zu neuem Arr, wenn null dann überspringen