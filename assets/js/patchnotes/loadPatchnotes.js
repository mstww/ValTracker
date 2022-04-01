const showdown = require('showdown');
const converter = new showdown.Converter();
const ipc = require('electron').ipcRenderer;

$(document).ready(() => {
    ipc.send('changeDiscordRP', `patchnotes_activity`)

    var pjson = require('../package.json');
    $('#patchnotes-pageheader').append("Patchnotes for " + pjson.version)
    $.ajax({
        url: `https://api.valtracker.gg/patchnotes/v${pjson.version}`,
        type: 'get',
        success: function (data, xhr) {
            console.log(data)
            var patchnotes = data.data.patchnotes
            var html = converter.makeHtml(patchnotes);
            $('#patchnotes-wrapper').append(html);
        },
        error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
        }
    });
});