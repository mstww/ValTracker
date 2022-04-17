var fs = require('fs')
const client = require('https');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function download_image(url, filepath) {
    return new Promise(async (resolve, reject) => {
        await delay(2500);
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

$(document).ready(() => {
    img_loc = process.env.APPDATA + '/VALTracker/user_data/images'

    if(!fs.existsSync(img_loc)) {
        fs.mkdirSync(img_loc);
        fs.mkdirSync(img_loc + '/bundles');
    }

    if(!fs.existsSync(img_loc + '/bundles')) {
        fs.mkdirSync(img_loc + '/bundles');
    }

    setTimeout(async () => {
        var bundles = document.getElementsByClassName('bundle-image')
        for(var i = 0; i < bundles.length; i++) {
            if(!fs.existsSync(img_loc + '/bundles/' + bundles[i].getAttribute('src').split("/")[4] + ".png") && bundles[i].getAttribute('src').split("\\")[0] != "C:") {
                await download_image(bundles[i].getAttribute('src'), img_loc + '/bundles/' + bundles[i].getAttribute('src').split("/")[4] + ".png");
            } 
        }
    }, 1000);
});