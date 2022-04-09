const colorFS2 = require('fs')

let rawColorDataPre = colorFS2.readFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json');
let colorDataPre = JSON.parse(rawColorDataPre);

var colorData2;

if (colorDataPre.isCustomTheme == true) {
    let rawColorData3 = colorFS2.readFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/custom_themes/${colorDataPre.themeName}.json`);
    colorData2 = JSON.parse(rawColorData3);
} else {
    let rawColorData2 = colorFS2.readFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/preset_themes/${colorDataPre.themeName}.json`);
    colorData2 = JSON.parse(rawColorData2);
}

function rgbToHex(red, green, blue) {
    const rgb = (red << 16) | (green << 8) | (blue << 0);
    return '#' + (0x1000000 + rgb).toString(16).slice(1);
}

function hexToRgb(hex) {
    const normal = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (normal) return normal.slice(1).map(e => parseInt(e, 16));

    const shorthand = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (shorthand) return shorthand.slice(1).map(e => 0x11 * parseInt(e, 16));

    return null;
}

//RGB TO HEX FOR INPUT

var values = colorData2.box_shadow.split(')');
var r = values[0] + ")"

var r2 = r.replace("0 0 2.5px rgba(", "")
var r3 = r2.replace(")", "")

var values2 = r3.split(', ');

let root2 = document.documentElement;

var select1 = document.getElementById('select_1')
var select2 = document.getElementById('select_2')
var select3 = document.getElementById('select_3')
var select4 = document.getElementById('select_4')
var select5 = document.getElementById('select_5')
var select6 = document.getElementById('select_6')
var select7 = document.getElementById('select_7')
var select8 = document.getElementById('select_8')
var select9 = document.getElementById('select_9')
var select10 = document.getElementById('select_10')

var newLeftGradient;
var newRightGradient;
var newButtonColor;
var newButtonHoverColor;
var newNeonEffectColor;
var newButtonTextColor;
var newBaseColor;
var newSubColor1;
var newSubColor2;
var newNeonEffectRGB;
var newFontColor;

select1.addEventListener('change', function () {
    newLeftGradient = select1.value;
    root2.style.setProperty('--gradient-left', newLeftGradient);
});

select2.addEventListener('change', function () {
    newRightGradient = select2.value;
    root2.style.setProperty('--gradient-right', newRightGradient);
});

select3.addEventListener('change', function () {
    newButtonColor = select3.value;
    root2.style.setProperty('--button-color', newButtonColor);
});

select4.addEventListener('change', function () {
    newButtonHoverColor = select4.value;
    root2.style.setProperty('--button-hover-color', newButtonHoverColor);
});

select5.addEventListener('change', function () {
    newNeonEffectColor = select5.value;
    newNeonEffectRGB = hexToRgb(newNeonEffectColor);
    root2.style.setProperty('--box-shadow', `0 0 2.5px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7), 0 0 10px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7), 0 0 30px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7)`);
    root2.style.setProperty('--text_shadow', `0 0 2.5px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6), 0 0 10px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6), 0 0 30px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6)`);
});

select6.addEventListener('change', function () {
    newButtonTextColor = select6.value;
    root2.style.setProperty('--button-color-var', newButtonTextColor);
});

select7.addEventListener('change', function () {
    newBaseColor = select7.value;
    root2.style.setProperty('--app-color', newBaseColor);
});

select8.addEventListener('change', function () {
    newSubColor1 = select8.value;
    root2.style.setProperty('--app-color-light', newSubColor1);
});

select9.addEventListener('change', function () {
    newSubColor2 = select9.value;
    root2.style.setProperty('--app-color-lightest', newSubColor2);
});

select10.addEventListener('change', function () {
    newFontColor = select10.value;
    root2.style.setProperty('--global-textcolor', newFontColor);
});

$(document).ready(() => {
    $('.app').css("overflow", "scroll")
    $('.app').css("overflow-x", "hidden")
    $('.app').css("height", "inherit")
    $('.custom-color-1-gradiant').val(colorData2.gradient_left)
    $('.custom-color-2-gradiant').val(colorData2.gradient_right)
    $('.button-color').val(colorData2.button_color)
    $('.button-textcolor').val(colorData2.button_color_var)
    $('.button-hover-color').val(colorData2.button_hover_color)
    $('.button-neon-effect').val(rgbToHex(values2[0], values2[1], values2[2]))
    $('.app-color-1').val(colorData2.app_color)
    $('.app-subcolor-1').val(colorData2.app_subcolor_1)
    $('.app-subcolor-2').val(colorData2.app_subcolor_2)
    $('.app-fontcolor').val(colorData2.global_color)
    $('.subcolor-palette-preview-1').css("background-color", "var(--app-color-light)")
    $('.subcolor-palette-preview-2').css("background-color", "var(--app-color-lightest)")

    $("#colortheme-name").keyup(function (event) {
        if (event.keyCode === 13) {
            $("#save-colortheme").click();
        }
    });
    const replaceText = (text) => {
        const element = document.getElementById("replace-text");
        if (element) element.innerText = text
    }
    $('#save-colortheme').on("click", function () {
        var searchbar = document.getElementById('colortheme-name')
        var customThemeName = searchbar.value
        if (customThemeName == "") {
            replaceText("Please enter a Name.")
        } else {
            replaceText("")
            if (!colorFS2.existsSync(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes")) {

                var newLeftGradient = select1.value;
                var newRightGradient = select2.value;
                var newButtonColor = select3.value;
                var newButtonHoverColor = select4.value;
                var newNeonEffectColor = select5.value;
                var newNeonEffectRGB = hexToRgb(newNeonEffectColor);
                var newButtonTextColor = select6.value;
                var newBaseColor = select7.value;
                var newSubColor1 = select8.value;
                var newSubColor2 = select9.value;
                var newFontColor = select10.value;

                var fixedThemeName = customThemeName.replace(/\s/g, '-')

                var themeAlreadyFound = false;
                colorFS2.readdirSync(process.env.APPDATA + "/VALTracker/user_data/thtmes/custom_themes", (err, files) => {
                    files.forEach(file => {
                        if (fixedThemeName + ".json" == file) {
                            themeAlreadyFound = true;
                            replaceText("You already have a Theme with this Name.")
                        }
                    });
                });

                if (themeAlreadyFound == false) {
                    var dataToWrite = {
                        "app_color": newBaseColor,
                        "app_subcolor_1": newSubColor1,
                        "app_subcolor_2": newSubColor2,
                        "gradient_left": newLeftGradient,
                        "gradient_right": newRightGradient,
                        "box_shadow": `0 0 2.5px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7), 0 0 10px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7), 0 0 30px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7)`,
                        "text_shadow": `0 0 2.5px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6), 0 0 10px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6), 0 0 30px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6)`,
                        "button_color": newButtonColor,
                        "button_hover_color": newButtonHoverColor,
                        "logo_style": "normal",
                        "button_color_var": newButtonTextColor,
                        "global_color": newFontColor
                    }

                    var dataToWriteDown = JSON.stringify(dataToWrite)
                    colorFS2.writeFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/custom_themes/${fixedThemeName.toLowerCase()}.json`, dataToWriteDown)

                    var dataToWrite2 = {
                        "isCustomTheme": true,
                        "themeName": fixedThemeName.toLowerCase()
                    }

                    colorFS2.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(dataToWrite2))
                    window.location.href = "settings.html"
                }
            } else {
                var newLeftGradient = select1.value;
                var newRightGradient = select2.value;
                var newButtonColor = select3.value;
                var newButtonHoverColor = select4.value;
                var newNeonEffectColor = select5.value;
                var newNeonEffectRGB = hexToRgb(newNeonEffectColor);
                var newButtonTextColor = select6.value;
                var newBaseColor = select7.value;
                var newSubColor1 = select8.value;
                var newSubColor2 = select9.value;
                var newFontColor = select10.value;

                var fixedThemeName = customThemeName.replace(/\s/g, '-')

                var themeAlreadyFound = false;
                colorFS2.readdirSync(process.env.APPDATA + "/VALTracker/user_data/themes/custom_themes", (err, files) => {
                    files.forEach(file => {
                        if (fixedThemeName + ".json" == file) {
                            themeAlreadyFound = true;
                            console.log("ERROR")
                            replaceText("You already have a Theme with this Name.")
                        }
                    });
                });

                if (themeAlreadyFound == false) {
                    var dataToWrite = {
                        "app_color": newBaseColor,
                        "app_subcolor_1": newSubColor1,
                        "app_subcolor_2": newSubColor2,
                        "gradient_left": newLeftGradient,
                        "gradient_right": newRightGradient,
                        "box_shadow": `0 0 2.5px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7), 0 0 10px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7), 0 0 30px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.7)`,
                        "text_shadow": `0 0 2.5px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6), 0 0 10px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6), 0 0 30px rgba(${newNeonEffectRGB[0]}, ${newNeonEffectRGB[1]}, ${newNeonEffectRGB[2]}, 0.6)`,
                        "button_color": newButtonColor,
                        "button_hover_color": newButtonHoverColor,
                        "logo_style": "normal",
                        "button_color_var": newButtonTextColor,
                        "global_color": newFontColor
                    }

                    var dataToWriteDown = JSON.stringify(dataToWrite)
                    colorFS2.writeFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/custom_themes/${fixedThemeName.toLowerCase()}.json`, dataToWriteDown)

                    var dataToWrite2 = {
                        "isCustomTheme": true,
                        "themeName": fixedThemeName.toLowerCase(),
                    }

                    colorFS2.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(dataToWrite2))
                    window.location.href = "settings.html"
                }
            }
        }
    })
    $('#back-to-settings').on("click", function () {
        window.location.href = "settings.html"
    })
});

//var box_shadow = `0 0 5px rgba(${r}, ${g}, ${b}, 0.7), 0 0 20px rgba(${r}, ${g}, ${b}, 0.7), 0 0 60px rgba(${r}, ${g}, ${b}, 0.7)`
//var text_shadow = `0 0 5px rgba(${r}, ${g}, ${b}, 0.6), 0 0 20px rgba(${r}, ${g}, ${b}, 0.6), 0 0 60px rgba(${r}, ${g}, ${b}, 0.6)`