$(document).ready(() => {
    var loadFile = process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'
    let rawdata = fs.readFileSync(loadFile);
    let dataToRead = JSON.parse(rawdata);
    if(dataToRead.hasValorantRPenabled == "true" || dataToRead.hasValorantRPenabled == undefined  || load_data.hasValorantRPenabled == true) {
        $('#val-rp-switch input[type="checkbox"]').prop('checked', true);
    } else {
        $('#val-rp-switch input[type="checkbox"]').prop('checked', false);
    }

    $('#val-rp-switch').on('change', function () {
        console.log($(`#val-rp-switch input[type="checkbox"]`).is( ":checked" ))
        if($(`#val-rp-switch input[type="checkbox"]`).is( ":checked" )) {
            dataToRead.hasValorantRPenabled = true;
    
            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);
        } else {
            dataToRead.hasValorantRPenabled = false;
    
            let dataToWrite = JSON.stringify(dataToRead);
            fs.writeFileSync(loadFile, dataToWrite);
        }
    });
})