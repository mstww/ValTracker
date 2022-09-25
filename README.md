<p align="center"><img width="230px" src="renderer/public/icons/VALTracker_Logo_default.png"></p>

<h3 align="center">A completely free Stats Tracker/Gameinfo Client for VALORANT.</h3>
<h5 align="center">VALTracker was created under Riot Games' "Legal Jibber Jabber" policy using assets that are owned by Riot Games.</h5>
<h5 align="center">Riot Games does not endorse or sponsor this project.</h5>
<p align="center">
  </a>
  <a href="https://discord.gg/aJfQ4yHysG"><img src="https://discordapp.com/api/guilds/927898163094900777/widget.png"></a>
  <a href="https://twitter.com/valtracker_gg"><img src="https://img.shields.io/badge/Twitter-@VALTracker_gg-1da1f2.svg?logo=twitter?style=for-the-badge&logo=appveyor"></a>
  <br>
  <a href="https://ko-fi.com/valtrackergg"><img src="https://ko-fi.com/img/githubbutton_sm.svg"></a>
  <br>
  <br>
  <a href="https://valtracker.gg"><img width="250px" src="https://media.codedotspirit.dev/assets/valtracker/github/download-button.png?version=1"></a>
</p>

# Table of Contents
- [Features](https://github.com/VALTracker/DesktopClient#features)
- [Translation](https://github.com/VALTracker/DesktopClient#translation)

# Features

- **The Hub**
  - See a detailed view and the stats of your last 15 Matches
  - Load more matches if needed
  - See Graphs of your last 8 Matches' Stats
  - Check your Battle Pass and Agent Contract Progress
  - See the Featured Bundle and it's price
      <details>
        <summary>Screenshots:</summary>
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/the_hub.png" align="center">
      </details>

- **Shop**
  - Check your daily shop
  - See the current Bundle
  - See your Night Market if available
      <details>
        <summary>Screenshots:</summary>
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/shop.png" align="center">
      </details>

- **Inventory Manager**
  - See your current inventory
  - Change your Skins 
  - Save Presets of your Inventory and switch between them in seconds
      <details>
        <summary>Screenshots:</summary>
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/inventory.png" align="center">
      </details>

- **Favorite Matches**
  - Mark any matches in the hub
  - Check them any time, even in a year or two
      <details>
        <summary>Screenshots:</summary>
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/favorites.png" align="center">
      </details>

- **Wishlist**
  - Add skins to your wishlist from unowned skins in your inventory or shop
  - Get a notification whenever one of your wishlisted skins is in your shop
      <details>
        <summary>Screenshots:</summary>
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/wishlist_1.png" align="center">
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/wishlist_2.png" align="center">
      </details>

- **Matchview**
  - See a detailed view of your Matches, including various stats and info
  - Gain Awards depending on how you played
      <details>
        <summary>Screenshots:</summary>
        <img src="https://media.codedotspirit.dev/valtracker/github-readme/matchview.png" align="center">
      </details>

# Translation
If you want to help with Translating VALTracker, then please take a look at this guide.

### Take a look at this List of supported Languages. Proceed only if you do not see the Language you want to Translate here.
  - English 
  - German
  - French
  - Spanish (LATAM) (Work in Progress)
  - Korean (Work in Progress)
  
### Clone the repository.

### Take a look at the files that need to be translated.

The Translation is broken down into 2 separate parts: The Main Process and the Renderer Process. <br />
The Translation files, which are stored in the `.json` format, can be found in the `/translation/main_process.json` file and in the `/renderer/locales/translations` Folder. Choose a file you want to translate.

### Prepare the file for translation.
The Files are structured like this:
https://github.com/VALTracker/DesktopClient/blob/d802d819346b7297f68eaf594da78f17dd34cb3f/renderer/locales/translations/navbar.json#L2-L17
Copy the `en-US` Key and the object it refers to, then add the copied text to the JSON structure at the bottom. Now, change the key you just copied to the locale of your language and country. <br />
To find out what this code is, take a look at [this Table](https://github.com/TiagoDanin/Locale-Codes#locale-list).

### Begin translating the file.
Only change the __values__ of the text you just copied, **not** the keys, otherwise, the translation will not show and will instead default back to English.
https://github.com/VALTracker/DesktopClient/blob/d802d819346b7297f68eaf594da78f17dd34cb3f/renderer/locales/translations/setup.json#L11
In the example above, the "values" are the __blue__ text. <br/>
After you're done translating this file, repeat this process for all other files. Don't forget to check [here]([#](https://github.com/VALTracker/DesktopClient#)take-a-look-at-the-files-that-need-to-be-translated) to see which files need to be translated.

### Done translating all the files?
Open this file: `/renderer/locales/languages.json`. You will see something like this:
https://github.com/VALTracker/DesktopClient/blob/d802d819346b7297f68eaf594da78f17dd34cb3f/renderer/locales/languages.json#L1-L11
Now, add your own language to the JSON File, structured like usual. Also, change the ``displayName`` key to the localized name of your language. <br />
After you're done, create a pull request on GitHub. We'll check your translations and then merge the request. <br /><br />
**That's it! 👍**
