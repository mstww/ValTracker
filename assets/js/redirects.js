var fs = require('fs')
var { shell } = require('electron')

function loadFade() {
    $('.app').fadeTo(150, 1);
}

function leaveFade() {
    $('.app').fadeTo(150, 0);
}

function toggle() {
    var sec = document.getElementById('sec');
    sec.classList.toggle('active');
}

function openInDefaultBrowser(href) {
    shell.openExternal(href);
}

$('.fab.fa-discord').on("click", function () {
    openInDefaultBrowser("https://discord.gg/aJfQ4yHysG")
})

$('.fab.fa-twitter').on("click", function () {
    openInDefaultBrowser("https://twitter.com/VALTracker_gg")
})

$('.fab.fa-github').on("click", function () {
    openInDefaultBrowser("https://github.com/VALTracker/DesktopClient")
})

$('.fas.fa-globe').on("click", function () {
    openInDefaultBrowser("https://valtracker.gg")
})

$('.fas.fa-hand-holding-usd').on("click", function () {
    openInDefaultBrowser("https://ko-fi.com/valtrackergg")
})

var pathvar = document.location.pathname;
var path2 = pathvar.substring(pathvar.indexOf('/'), pathvar.lastIndexOf('/'));
var directoryName = path2.split("/").pop();

function cardRedirect(event, event2, event3) {
    sessionStorage.setItem("cardName", event)
    sessionStorage.setItem("imgLink", event2)
    sessionStorage.setItem("last_page", event3)
    leaveFade();
    setTimeout(function () {
        if(directoryName == "CollectablePages") {
            window.location.href = "../pages/cardView.html";
        } else {
            window.location.href = "cardView.html";
        }
    }, 500);
}

$('.player-card-img').on("click", function () {
    sessionStorage.setItem("last_page", window.location.href)
    leaveFade();
    setTimeout(function () {
        if(directoryName == "CollectablePages") {
            window.location.href = "../pages/cardView.html";
        } else {
            window.location.href = "cardView.html";
        }
    }, 500);
});
$('.card-wrapper').on("click", function () {
    leaveFade();
    setTimeout(function () {
        if(directoryName == "CollectablePages") {
            window.location.href = "../pages/cardView.html";
        } else {
            window.location.href = "cardView.html";
        }
    }, 500);
});

$(document).ready(() => {
    const loginCheck = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/user_creds.json')
    const check = JSON.parse(loginCheck);
    if(check.usesRiotAccount == false) {
        $('#store').css("display", "none")
        $('#collects-sub-bp').css("display", "none")
        $('#acc-switcher').css("display", "none")
    }
    loadFade();
    $('#home').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/index.html";
            } else {
                window.location.href = "index.html";
            }
        }, 500);
    });
    $('#store').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/playerStore.html";
            } else {
                window.location.href = "playerStore.html";
            }
        }, 500);
    });
    $('#favs').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/favMatches.html";
            } else {
                window.location.href = "favMatches.html";
            }
        }, 500);
    });
    $('#psearch').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/playersearch.html";
            } else {
                window.location.href = "playersearch.html";
            }
        }, 500);
    });
    $('#profile').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/profile.html";
            } else {
                window.location.href = "profile.html";
            }
        }, 500);
    });
    $('#collects-sub-bundles').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/bundles.html";
            } else {
                window.location.href = "bundles.html";
            }
        }, 500);
    });
    $('#collects-sub-skins').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/weaponskins.html";
            } else {
                window.location.href = "weaponskins.html";
            }
        }, 500);
    });
    $('#collects-sub-bp').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/bpProgression.html";
            } else {
                window.location.href = "bpProgression.html";
            }
        }, 500);
    });
    $('#patchnotes').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/patchnotes.html";
            } else {
                window.location.href = "patchnotes.html";
            }
        }, 500);
    });
    $('#settings').on("click", function () {
        leaveFade();
        toggle();
        setTimeout(function () {
            if(directoryName == "CollectablePages") {
                window.location.href = "../pages/settings.html";
            } else {
                window.location.href = "settings.html";
            }
        }, 500);
    });
});