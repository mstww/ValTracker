const showdown = require('showdown');
const converter = new showdown.Converter();
var { ipcRenderer } = require('electron');

$(document).ready(() => {
    ipcRenderer.send('changeDiscordRP', `patchnotes_activity`)

    var pjson = require('../package.json');
    $('#patchnotes-pageheader').append("Patchnotes for " + pjson.version)
    $.ajax({
        url: `https://api.valtracker.gg/patchnotes/v${pjson.version}`,
        type: 'get',
        success: function (data, xhr) {
            var patchnotes = data.data.patchnotes
            var html = converter.makeHtml(patchnotes);
            $('#patchnotes-wrapper').append(html);
        },
        error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
        }
    });
});