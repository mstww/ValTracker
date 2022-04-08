$(".single-item").on("click", function () {
    sessionStorage.setItem("skinID", this.id)
    sessionStorage.setItem("last_page", window.location.pathname.split("/").pop())
    window.location.href = "skinView.html"
});

$(".night-market-offer").on("click", function (e) {
    if (this.className.includes("notSeenYet")) {
        e.preventDefault();
    } else {
        console.log("E")
        sessionStorage.setItem("skinID", this.id)
        sessionStorage.setItem("last_page", window.location.pathname.split("/").pop())
        window.location.href = "skinView.html"
    }
});