function loadMatchView(matchID) {
    sessionStorage.setItem("matchID", matchID)
    var path = page.split("/").pop();
    if (path == "decoyIndex.html") {
        var redirectPath = "index.html"
    } else {
        var redirectPath = page
    }
    sessionStorage.setItem("last_matchview_page", redirectPath);
    window.location.href = "./matchView.html"
}