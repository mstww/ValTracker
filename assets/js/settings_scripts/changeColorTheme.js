var ipc = require('electron').ipcRenderer;
const path = require('path')
var select = document.getElementById('selected-color-theme');
const fs = require('fs')
const chokidar = require('chokidar')

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
            if(file.split(".").pop() == "json") {
                var option = document.createElement("option")
                option.appendChild(document.createTextNode(path.parse(file).name))
                option.value = `custom-theme`
                option.className = "customThemeOption"

                var wrapper = document.getElementById("custom-color-themes")
                var nextElement = document.getElementById("themes-bottom");
                wrapper.insertBefore(option, nextElement);
                i++;
            }
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
            $('#delete-custom-theme-button').css("display", "inline-block");
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

    var watcher = chokidar.watch(process.env.APPDATA + '/VALTracker/user_data/themes/custom_themes', { awaitWriteFinish: true});

    setTimeout(function() {
        watcher.on('add', async function(file) {
            if(file.split(".").pop() == "json") {
                var usedTheme = colorData.themeName;

                $('.customThemeOption').remove();
                
                var files = fs.readdirSync(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes")
                files.forEach(file => {
                    if(file.split(".").pop() == "json") {
                        var option = document.createElement("option")
                        option.appendChild(document.createTextNode(path.parse(file).name))
                        if(path.parse(file).name == usedTheme) {
                            option.value = `custom-theme-used`
                        } else {
                            option.value = `custom-theme`
                        }
                        option.className = "customThemeOption"
        
                        var wrapper = document.getElementById("custom-color-themes")
                        var nextElement = document.getElementById("themes-bottom");
                        wrapper.insertBefore(option, nextElement);
                    }
                });

                if(colorData.isCustomTheme == true) {
                    $(`.customThemeOption[value="${usedTheme}"]`).val("custom-theme-used")

                    $(select).val("custom-theme-used")
                }
            }
        })
        watcher.on('unlink', async function(file) {
            var currentTheme = colorData.themeName
            var deletedTheme = file.split('\\').pop()
            if(colorData.isCustomTheme == false) {
                var deletedFileWithoutType = deletedTheme.substring(0, deletedTheme.lastIndexOf("."));
                $(`#custom-color-themes option[value="${deletedFileWithoutType}"]`).remove();
            } else {
                if(currentTheme == deletedTheme) {
                    var dataToWrite = {
                        "isCustomTheme": false,
                        "themeName": "normal"
                    }
        
                    var dataToWriteDown = JSON.stringify(dataToWrite)
        
                    fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)
                    window.location.href = ""
                } else {
                    var deletedFileWithoutType = deletedTheme.substring(0, deletedTheme.lastIndexOf("."));
                    $(`#custom-color-themes option[value="${deletedFileWithoutType}"]`).remove();
                }
            }
        })
    }, 200)
    
    $('#delete-custom-theme-button').on("click", function() {
        console.log("E")
        if(colorData.isCustomTheme == true) {
            var files = fs.readdirSync(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes")
            files.forEach(file => {
                if(file.split(".").pop() == "json") {
                    if(file.substring(0, file.lastIndexOf(".")) == colorData.themeName) {
                        fs.unlinkSync(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes/" + file)
                        
                        var dataToWrite = {
                            "isCustomTheme": false,
                            "themeName": "normal"
                        }
            
                        var dataToWriteDown = JSON.stringify(dataToWrite)
            
                        fs.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', dataToWriteDown)

                        window.location.href = ""
                    }
                }
            });
        }
    });
})