var axios = require('axios');
var fs = require('fs');
var moment = require('moment');
const parser = require('showdown');

var md_conv = new parser.Converter();

var lastDate;

if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/message_data/last_checked_date.json')) {
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/message_data/last_checked_date.json')
    var parsed = JSON.parse(raw);
    lastDate = parsed.date;
} else {
    lastDate = 0;
}

function closeMessage(message, date) {
    $(message).remove();
    var raw = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/message_data/last_checked_date.json')
    var parsed = JSON.parse(raw);
    if(parsed.date < date) {
        var obj = {
            "date": parseInt(date)
        }
        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/message_data/last_checked_date.json', JSON.stringify(obj))
    }
}

$(document).ready(async () => {
    var messages = (await axios.get(`https://api.valtracker.gg/messages`)).data.data
    var i = 0;
    messages.forEach(message => {
        if(lastDate < message.date && i < 6) {
            var wrapper = document.createElement("div");
            wrapper.className = "messages-card";

            var card_header = document.createElement("div");
            card_header.className = "message-card-header";

            var header_text = document.createElement("div");

            card_header.appendChild(header_text);

            var card_header_text = document.createElement("p");
            card_header_text.setAttribute("style", "margin: 0; font-size: 1.1em; font-weight: 500;");
            card_header_text.textContent = ">> NEW MESSAGE";
            
            var date_span = document.createElement("span");
            date_span.style.color = "rgb(62, 70, 102)";

            var date = moment(message.date).format('MMMM DD, YYYY');

            date_span.textContent = date;

            var hiddenUnixStamp = document.createElement("span");
            hiddenUnixStamp.setAttribute("style", "display: none;");
            hiddenUnixStamp.textContent = message.date;

            header_text.appendChild(card_header_text);
            header_text.appendChild(date_span);
            header_text.appendChild(hiddenUnixStamp);

            var close_message = document.createElement("div");
            close_message.className = "close-card";
            close_message.id = "close-card";
            close_message.setAttribute('onclick', 'closeMessage(this.parentElement.parentElement, this.parentElement.firstChild.lastChild.textContent)')

            var close_x = document.createElement("div");
            close_x.id = "toggle";

            close_message.appendChild(close_x);
            card_header.appendChild(close_message);

            var parsed_md = md_conv.makeHtml(message.message);

            var message_div = document.createElement("div");
            message_div.className = "message";
            $(message_div).append(parsed_md)

            wrapper.appendChild(card_header);
            wrapper.appendChild(message_div);

            var messageHandler = document.getElementById("messages-handler");
            var lastElement = document.getElementById("lastMessageElement");

            messageHandler.insertBefore(wrapper, lastElement)

            $('.message a').attr('onclick', 'event.preventDefault(); openInDefaultBrowser(this.href);')
            
            i++;
        }
    })
});