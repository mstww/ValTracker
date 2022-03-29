const colorFS = require('fs');

if (!colorFS.existsSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json')) {
    var dataToWrite = {
        "isCustomTheme": false,
        "themeName": "normal"
    }

    colorFS.writeFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json', JSON.stringify(dataToWrite))
}

let rawColorData = colorFS.readFileSync(process.env.APPDATA + '/VALTracker/user_data/themes/color_theme.json');
let colorData = JSON.parse(rawColorData);

let root = document.documentElement;

if (colorData.isCustomTheme == true) {
    let newColorData;
    if (colorFS.existsSync(process.env.APPDATA + `/VALTracker/user_data/themes/custom_themes/${colorData.themeName}.json`)) {
        let newRawColorData = colorFS.readFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/custom_themes/${colorData.themeName}.json`);
        newColorData = JSON.parse(newRawColorData);
    } else {
        let newRawColorData = colorFS.readFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/preset_themes/normal.json`);
        newColorData = JSON.parse(newRawColorData);
    }
    root.style.setProperty('--app-color', newColorData.app_color);
    root.style.setProperty('--app-color-light', newColorData.app_subcolor_1);
    root.style.setProperty('--app-color-lightest', newColorData.app_subcolor_2);

    root.style.setProperty('--gradient-left', newColorData.gradient_left);
    root.style.setProperty('--gradient-right', newColorData.gradient_right);

    root.style.setProperty('--box-shadow', newColorData.box_shadow);
    root.style.setProperty('--text-shadow', newColorData.text_shadow);

    root.style.setProperty('--button-color', newColorData.button_color);
    root.style.setProperty('--button-hover-color', newColorData.button_hover_color);
    root.style.setProperty('--button-color-var', newColorData.button_color_var);
    root.style.setProperty('--global-textcolor', newColorData.global_color);

    var logo_top = document.getElementById('valtracker-logo');

    var pathvar = document.location.pathname;
    var path2 = pathvar.substring(pathvar.indexOf('/'), pathvar.lastIndexOf('/'));
    var directoryName = path2.split("/").pop();

    var page = pathvar.split("/").pop();
    if (page == "decoyIndex.html") {
        $('.home-loading-img').attr("src", "../iconss/VALTracker_Logo_default.png")
    }

    if (directoryName == "CollectablePages") {
        logo_top.setAttribute("src", `../iconss/VALTracker_Logo_default.ico`);
    } else {
        logo_top.setAttribute("src", `../iconss/VALTracker_Logo_default.ico`);
    }
} else {
    let newRawColorData = colorFS.readFileSync(process.env.APPDATA + `/VALTracker/user_data/themes/preset_themes/${colorData.themeName}.json`);
    let newColorData = JSON.parse(newRawColorData);
    root.style.setProperty('--app-color', newColorData.app_color);
    root.style.setProperty('--app-color-light', newColorData.app_subcolor_1);
    root.style.setProperty('--app-color-lightest', newColorData.app_subcolor_2);

    root.style.setProperty('--gradient-left', newColorData.gradient_left);
    root.style.setProperty('--gradient-right', newColorData.gradient_right);

    root.style.setProperty('--box-shadow', newColorData.box_shadow);
    root.style.setProperty('--text-shadow', newColorData.text_shadow);

    root.style.setProperty('--button-color', newColorData.button_color);
    root.style.setProperty('--button-hover-color', newColorData.button_hover_color);
    root.style.setProperty('--button-color-var', newColorData.button_color_var);
    root.style.setProperty('--global-textcolor', newColorData.global_color);

    var logo_top = document.getElementById('valtracker-logo');

    var pathvar = document.location.pathname;
    var path2 = pathvar.substring(pathvar.indexOf('/'), pathvar.lastIndexOf('/'));
    var directoryName = path2.split("/").pop();

    var page = pathvar.split("/").pop();
    if (page == "decoyIndex.html") {
        if (newColorData.logo_style == "default" || newColorData.logo_style == undefined) {
            $('.home-loading-img').attr("src", "../iconss/VALTracker_Logo_default.png")
        } else {
            $('.home-loading-img').attr("id", "custom-img")
            $('.home-loading-img').attr("src", `../iconss/VALTracker_Logo_${newColorData.logo_style}.png`)
        }
    }

    if (directoryName == "CollectablePages") {
        logo_top.setAttribute("src", `.../iconss/VALTracker_Logo_${newColorData.logo_style}.ico`);
    } else {
        logo_top.setAttribute("src", `../iconss/VALTracker_Logo_${newColorData.logo_style}.ico`);
    }
}