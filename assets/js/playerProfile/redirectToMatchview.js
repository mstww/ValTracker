function loadMatchView(matchID) {
    sessionStorage.setItem("matchID", matchID)
    var path = page.split("/").pop();
    if(path == "decoyIndex.html") {
        var redirectPath = "index.html"
    } else {
        var redirectPath = page
    }
    var name_tag = $('#playername-header').text();
    var player_name = name_tag.split("#")[0];
    var player_tag = name_tag.split("#")[1];
    sessionStorage.setItem("matchview_player_name", player_name);
    sessionStorage.setItem("matchview_player_tag", player_tag);
    sessionStorage.setItem("last_matchview_page", redirectPath);
    window.location.href = "./matchView.html"
}