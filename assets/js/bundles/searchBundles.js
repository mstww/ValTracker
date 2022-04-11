function bundleSearch() {
    var value = document.getElementById('search-input').value.toLowerCase()
    var list = document.getElementsByClassName("bundlecard");
    for (var i = 0; i < list.length; i++) {
        var bundlename = list[i].childNodes[1].firstChild.textContent.toLowerCase();
        if(bundlename.includes(value)) {
            list[i].parentElement.setAttribute("style", "display: block")
        } else {
            list[i].parentElement.setAttribute("style", "display: none")
        }
    }
}