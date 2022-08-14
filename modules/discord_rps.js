const starting_activity = {
    details: "Starting VALTracker...",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const hub_activity = {
    details: "Browsing Hub",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "home",
        small_text: "Hub",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const skins_activity = {
    details: "Changing Skins",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "user-square",
        small_text: "Browsing Skins",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const pprofile_acitivity = {
    details: "Browsing a player's profile",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "search",
        small_text: "Browsing a player's profile",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const favmatches_activity = {
    details: "Browsing favourite matches",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "star",
        small_text: "Browsing favourite matches",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const settings_acitivity = {
    details: "Editing settings",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "settings",
        small_text: "Editing settings",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const matchview_activity = {
    details: "Looking at a Match",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "clipboard",
        small_text: "Looking at a Match",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

const shop_activity = {
    details: "Checking the Store",
    assets: {
        large_image: "valtracker_logo",
        large_text: "VALTracker.gg",
        small_image: "store",
        small_text: "Checking the Store",
    },
    buttons: [{
            "label": "Download VALTracker",
            "url": "https://valtracker.gg"
        },
        {
            "label": "Join the Discord",
            "url": "https://discord.gg/aJfQ4yHysG"
        }
    ],
    timestamps: {
        start: Date.now()
    },
    instance: true
}

export {
    starting_activity,
    hub_activity,
    skins_activity,
    pprofile_acitivity,
    favmatches_activity,
    settings_acitivity,
    matchview_activity,
    shop_activity
}