function redirectInDefaultBrowser(id, url) {
    var str = url;
    var midStr = str.split('https://').pop();
    var midStr2 = "https://" + midStr;
    finalStr = midStr2.replace(" ", "");
    shell.openExternal(finalStr);
}
$(document).ready(() => {
    setTimeout(function () {
        $.ajax({
            dataType: "json",
            url: `https://api.henrikdev.xyz/valorant/v1/website/en-us`,
            type: 'get',
            success: function (data, xhr) {
                for (var count = 0; count < 3; count++) {
                    $(`#text-${count}`).append(data.data[count].title);
                    $(`#img-${count}`).attr("src", data.data[count].banner_url);
                    if(data.data[count].external_link) {
                        $(`#hiddenurl-${count}`).append(data.data[count].external_link)
                    } else {
                        $(`#hiddenurl-${count}`).append(data.data[count].url)
                    }
                }
            },
            error: function (jqXHR) {
                createErrorCard(this.url, jqXHR.status);
            }
        });
    }, 150)
})