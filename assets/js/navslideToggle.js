function toggle() {
  var sec = document.getElementById('sec');
  var body = document.body
  sec.classList.toggle('active');
  body.classList.toggle('scroll-hidden');
}

$(document).ready(() => {
  var pathvar = document.location.pathname;
  var path2 = pathvar.substring(pathvar.indexOf('/'), pathvar.lastIndexOf('/'));
  var directoryName = path2.split("/").pop();

  var pjson = require('../package.json');
  $('#WindowName').append("VALTracker v" + pjson.version)

  var coll = document.getElementsByClassName("collapsible");
  var i;
  var path = window.location.pathname;
  var page = path.split("/").pop();
  var path2 = path.substring(path.indexOf('/'), path.lastIndexOf('/'));
  var directoryName = path2.split("/").pop();

  for (i = 0; i < coll.length; i++) {
    if (page == "buddys.html" || page == "bundles.html" || page == "weaponskins.html" || directoryName == "CollectablePages" || page == "cardView.html") {
      var collTest = document.getElementById("collects");
      collTest.classList.toggle("active");
      var content = collTest.nextElementSibling;
      content.style.maxHeight = content.scrollHeight + "px";
      coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    } else {
      coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
          content.style.maxHeight = null;
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    }
  }
})