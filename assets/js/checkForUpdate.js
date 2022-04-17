var compareVersions = require('compare-versions');
var moment = require('moment');
var axios = require('axios');
var { ipcRenderer } = require('electron');

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function checkForUpdate() {
  if(!sessionStorage.getItem('update-denied')) {
    await delay(500)
    var res = await axios.get(`https://api.valtracker.gg/patchnotes`)

    var newest_version = res.data.data.version;
    var current_version = require('../package.json').version;
  
    var newest_date = res.data.data.date;
    var newest_desc = res.data.data.desc;
  
    var version_compare = compareVersions(current_version, newest_version);
  
    if(version_compare == -1) {
      var formatted_date = moment(newest_date).format('D. MMMM, YYYY');
  
      var info = `${newest_version} (${formatted_date})`;

      $('#update-info').append(info);
      $('#update-desc').append(newest_desc);
  
      $('.update-layer').css("opacity", "0");
      $('.update-layer').css("display", "flex");
      $('.update-layer').fadeTo(150, 1);
      $('.update-noti').css("display", "flex");
      setTimeout(function () {
        $('.update-noti').fadeTo(150, 1)
        $('.update-noti').css("transform", "scale(1)");
      }, 100)
    }
  }
}

$(document).ready(async () => {
  checkForUpdate();
  setInterval(checkForUpdate, 600000);

  $('#cancel-update').on("click", async function() {
    $('.update-noti').fadeTo(100, 0)
    $('.update-noti').css("transform", "scale(0.8)");
    $('.update-layer').fadeTo(150, 0)
    await delay(150)
    $('.update-layer').css("display", "none");
    
    sessionStorage.setItem('update-denied', true);
  });

  $('#download-update').on("click", async function() {
    $('.update-noti').fadeTo(100, 0)
    $('.update-noti').css("transform", "scale(0.8)");
    $('.update-layer').fadeTo(150, 0)
    await delay(150)
    $('.update-layer').css("display", "none");

    ipcRenderer.send('update-download');
  });

  $('#close-finish-noti').on("click", async function() {
    $('.download-finished-noti').fadeTo(100, 0)
    $('.download-finished-noti').css("transform", "scale(0.8)");
    $('.update-download-layer').fadeTo(150, 0)
    await delay(150)
    $('.update-download-layer').css("display", "none");
  });

  $('#update-restart-app').on("click", async function() {
    ipcRenderer.send('quit-app-and-install');
  })

  ipcRenderer.on('update-error', function(event, args) {
    console.log("Update error: " + args);
  });

  ipcRenderer.on('update-download-finished', async function() {
    $('.download-finished-noti').css("display", "flex");
    setTimeout(function () {
      $('.download-finished-noti').fadeTo(150, 1)
      $('.download-finished-noti').css("transform", "scale(1)");
    }, 100)
  });
})