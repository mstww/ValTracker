function switchToNM() {
    $('.store-wrapper').fadeTo(150, 0);
    setTimeout(function () {
        $('.store-wrapper').css("display", "none");
        $('.nightmarket-wrapper').css("display", "block");
        $('.nightmarket-wrapper').fadeTo(150, 1);
    }, 150);
}

function switchToStore() {
    $('.nightmarket-wrapper').fadeTo(150, 0);
    setTimeout(function () {
        $('.nightmarket-wrapper').css("display", "none");
        $('.store-wrapper').css("display", "block");
        $('.store-wrapper').fadeTo(150, 1);
    }, 150);
}
$('.reveal-item-button').on("click", function () {
    var censorbanner = this.parentElement;
    $(censorbanner).addClass('revealing')
    $(censorbanner).css("background-color", "rgba(150, 150, 150, 1)");
    setTimeout(function () {
        $(censorbanner).fadeTo(100, 0);
        $(censorbanner).removeClass('revealing')
        setTimeout(function () {
            $(censorbanner).css("display", "none");
            var itemWrapper = censorbanner.parentElement;
            $(itemWrapper).removeClass('notSeenYet');
        }, 700)
    }, 700);
})
$('.night-market-wrapper').on("click", function () {
    switchToNM();
})