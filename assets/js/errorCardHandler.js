var {
    shell
} = require('electron');
var moment = require('moment-timezone')

function createErrorCard(called_api, error_code) {

    var errorMeaning;
    var rateLimitError;

    switch (error_code) {
        case 400:
            errorMeaning = " (Bad Request)"
            break;

        case 401:
            errorMeaning = " (Unauthorized)"
            break;

        case 403:
            errorMeaning = " (Forbidden)"
            break;

        case 404:
            errorMeaning = " (Not Found)"
            break;

        case 405:
            errorMeaning = " (Not Allowed)"
            break;

        case 408:
            errorMeaning = " (Request Timeout)"
            break;

        case 429:
            errorMeaning = " (Rate limit exceeded,\n please try again later.)"
            rateLimitError = true;
            break;

        case 500:
            errorMeaning = " (Internal Server Error)"
            break;

        case 501:
            errorMeaning = " (Not Implemented)"
            break;

        case 502:
            errorMeaning = " (Bad Gateway)"
            break;

        case 503:
            errorMeaning = " (Service Unavailable)"
            break;

        case 504:
            errorMeaning = " (Gateway Timeout)"
            break;
    }

    var cardWrapper = document.createElement("div");
    cardWrapper.className = "error-code-mention-card"

    var cardXdiv = document.createElement("div");
    cardXdiv.className = "closeCardWrapper";

    var toggleWrapper = document.createElement("div");
    toggleWrapper.className = "error-card-relative-div-largeview";
    toggleWrapper.id = "closeErrorCard";

    var cardX = document.createElement("div");
    cardX.id = "toggle";

    toggleWrapper.appendChild(cardX);
    cardXdiv.appendChild(toggleWrapper);

    var cardHeader = document.createElement("div");
    cardHeader.className = "error-code-card-header";

    var cardHeaderText = document.createElement("h3");
    cardHeaderText.appendChild(document.createTextNode("AN ERROR OCCURRED"))
    $(cardHeaderText).css("margin", "0");
    var api_p = document.createElement("p");
    api_p.id = "error-code";
    var apiUrl = called_api.split("/")[2];
    api_p.appendChild(document.createTextNode("API: https://" + apiUrl))

    $(api_p).css("color", "grey")
    $(api_p).css("margin", "0")

    var error_p = document.createElement("p");
    error_p.id = "error-code";
    error_p.appendChild(document.createTextNode("Error Code: " + error_code + errorMeaning));

    $(error_p).css("color", "grey");
    $(error_p).css("margin-top", "0");
    $(error_p).css("margin-bottom", "0.5rem");

    cardHeader.appendChild(cardHeaderText);
    cardHeader.appendChild(api_p);
    cardHeader.appendChild(error_p);

    var hiddenError = document.createElement("div");
    hiddenError.className = "hidden-error";

    const errorDate = new Date(Date.now());
    var time = errorDate.toLocaleTimeString('en-us', {
        timeZone: 'Europe/Berlin'
    })
    var date = errorDate.toLocaleDateString('de-de', {
        timeZone: 'Europe/Berlin'
    })

    hiddenError.textContent =
        "```css\n" + // Codeblock with Colors :p
        "[///// API ERROR /////]\n" + // Header, [] Brackets for red color
        "\nAPI: " + called_api + "\n" + // API that was being called
        "Error Code: " + error_code + errorMeaning + "\n" + // Error code + Meaning
        "Page: " + window.location.href.split("/").pop() + '\n' + // Page the error happened on
        "\nTime of Error: " + date + ", " + time + // Time of Error, converted to Berlin TZ
        "\n```"; // End of codeblock

    var cardContent = document.createElement("div");
    cardContent.className = "error-code-card-content";

    var textSpan = document.createElement("span");
    $(textSpan).css("margin-bottom", "0.5rem");
    textSpan.textContent = "If this keeps happening, please join our ";

    var discordHrefSpan = document.createElement("span")
    discordHrefSpan.id = "discord-href";
    discordHrefSpan.textContent = "Discord Server";
    $(discordHrefSpan).css("text-decoration", "underline");
    $(discordHrefSpan).css("cursor", "pointer");

    textSpan.appendChild(discordHrefSpan);
    textSpan.appendChild(document.createTextNode(", copy the info below and paste it into the #support channel for help."))

    if(rateLimitError == true) {
        $(textSpan).empty();
        $(textSpan).text("Rate Limit exceeded. Please try again in 2 minutes.");
    }

    var reloadPageButton = document.createElement("button");
    reloadPageButton.className = "reload-page";
    reloadPageButton.id = "reload-page";
    reloadPageButton.textContent = "Reload Page";

    var copyToClipButton = document.createElement("button");
    copyToClipButton.className = "reload-page";
    copyToClipButton.id = "copy-to-clip";
    $(copyToClipButton).css("margin-left", "0.5rem");
    copyToClipButton.textContent = "Copy info to clipboard";

    cardContent.appendChild(textSpan);
    cardContent.appendChild(document.createElement("br"))
    cardContent.appendChild(reloadPageButton);
    cardContent.appendChild(copyToClipButton);

    cardWrapper.appendChild(cardXdiv);
    cardWrapper.appendChild(cardHeader);
    cardWrapper.appendChild(hiddenError);
    cardWrapper.appendChild(cardContent);

    var wrapper = document.getElementById("insertErrorCodes");
    var lastElement = document.getElementById("lastErrorElement");
    wrapper.insertBefore(cardWrapper, lastElement);

    var cardW = cardWrapper;
    $(cardW).fadeTo(150, 1)
    $(cardW).css("transform", "scale(1)");

    $('#discord-href').on("click", function () {
        shell.openExternal("https://discord.gg/aJfQ4yHysG");
    });
    $('#reload-page').on("click", function () {
        window.location.href = "";
    });
    $('#closeErrorCard').on("click", function () {
        var card = this.parentElement.parentElement;
        $(card).fadeTo(100, 0)
        $(card).css("transform", "scale(0.8)");
        setTimeout(function () {
            $(card).remove();
        }, 300)
    });
    $('#copy-to-clip').on("click", function () {
        var button = this

        function replaceButtonText(text) {
            $(button).text(text)
        }
        navigator.clipboard.writeText($('.hidden-error').text());
        replaceButtonText("Copied!")
        setTimeout(function () {
            replaceButtonText("Copy info to clipboard")
        }, 1000);
    });
}