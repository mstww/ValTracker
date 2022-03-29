var ipc = require('electron').ipcRenderer;
const path = require('path')
var select = document.getElementById('selected-color-theme');
const fs = require('fs')

//JSON check + colors writen
if (!fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json')) {
    var dataToWrite = {
        "isCustomTheme": false,
        "themeName": "normal"
    }

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(dataToWrite))
}

$('#reset-colortheme-button').on("click", function () {
    $(select).val("Default")
    var dataToWrite = {
        "isCustomTheme": false,
        "themeName": "normal"
    }

    var dataToWriteDown = JSON.stringify(dataToWrite)

    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
    window.location.href = ""
})

select.addEventListener('change', function () {
    switch (select.value) {
        case "Default":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": "normal"
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Brimstone":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)

            window.location.href = ""
            break;
        case "Phoenix":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Sage":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Sova":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Viper":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Cypher":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Reyna":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Killjoy":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Breach":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Omen":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Jett":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Raze":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Skye":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Yoru":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Astra":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Kayo":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Chamber":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "Neon":
            var dataToWrite = {
                "isCustomTheme": false,
                "themeName": select.value.toLowerCase()
            }

            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
        case "custom-theme":
            var dataToWrite = {
                "isCustomTheme": true,
                "themeName": select.options[select.selectedIndex].text
            }
            var dataToWriteDown = JSON.stringify(dataToWrite)

            fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
            window.location.href = ""
            break;
    }
});

$(document).ready(() => {
    let rawColorData = fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json');
    let colorData = JSON.parse(rawColorData);

    var i = 0;
    fs.readdir(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes", (err, files) => {
        files.forEach(file => {
            var option = document.createElement("option")
            option.appendChild(document.createTextNode(path.parse(file).name))
            option.value = `custom-theme`
            option.className = "customThemeOption"

            var wrapper = document.getElementById("selected-color-theme")
            var nextElement = document.getElementById("themes-bottom");
            wrapper.insertBefore(option, nextElement);
            i++;
        });
    });

    setTimeout(function () {
        if (colorData.isCustomTheme == true) {
            for (var count = 0; count < i; count++) {
                if (document.getElementsByClassName('customThemeOption').item(count).textContent == colorData.themeName) {
                    document.getElementsByClassName('customThemeOption')[count].value = "custom-theme-used"
                    $(select).val("custom-theme-used")
                }
            }
            $('#edit-custom-theme-button').css("display", "inline-block");
        } else {
            let word = colorData.themeName;
            if (word == "normal") {
                word = "default"
            }
            let titleCase = word[0].toUpperCase() + word.substr(1);
            $(select).val(titleCase)
        }
    }, 200)

    const {
        shell
    } = require('electron')
    $('#open-custom-theme-folder-button').on("click", function () {
        shell.openPath(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes");
    })
})