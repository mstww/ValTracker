function itemSearch() {
    var value = document.getElementById('search-input').value.toLowerCase()

    var path = window.location.pathname;
    var page = path.split("/").pop();

    if(page == "cardsPage.html") {
        var list = document.getElementsByClassName("card-wrapper");
    } else if(page == "spraysPage.html") {
        var list = document.getElementsByClassName("spray-wrapper");
    } else if(page == "titlesPage.html") {
        var list = document.getElementsByClassName("title-wrapper");
    } else {
        var list = document.getElementsByClassName("skin-wrapper");
    }
    for (var i = 0; i < list.length; i++) {
        if(page == "titlesPage.html") {
            var itemName = list[i].childNodes[0].textContent.toLowerCase();
        } else {
            var itemName = list[i].childNodes[1].textContent.toLowerCase();
        }
        if(itemName.includes(value)) {
            list[i].setAttribute("style", "display: flex");
        } else {
            list[i].setAttribute("style", "display: none");
        }
    }
}

//card spray title skin ~wrapper