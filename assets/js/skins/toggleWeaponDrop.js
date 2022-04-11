function toggle() {
    var sec = document.getElementById('sec');
    sec.classList.toggle('active');
}

$(document).ready(() => {
    var coll = document.getElementsByClassName("weapon-collapsible");
    var i;
    var path = window.location.pathname;
    var page = path.split("/").pop();

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if(content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + 55 + "px";
            }
        });
    }
})