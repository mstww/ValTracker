## __New Features__

- Reworked the Match view! All information is now displayed properly sorted and spaced, and rounds have been added.

- The Matchview now has it's own Discord Status.

- You can now see your last 5 searched players on the player search page! Clicking on one of these tiles will load their player profile and display it as usual.

- Added a custom VALORANT Rich Presence Feature. It will automatically activate if you don't turn it off in the settings. This Rich Presence will show what Map and Mode you are currently playing.

- Changed VALTracker's Font! (From 'Readex Pro' to 'Bahnschrift')

- Changed the color of a few borders.

## __Bugfixes__

- Fixed a bug that showed the wrong bundle price in the store.

- Fixed a visual bug that misaligned the RR gain on a player profile.

- Fixed a bug that prevented you from going back to a players profile when viewing a match they played.

- Fixed a bug that prevented the single skin prices from being shown when looking at a single skin.

- Fixed a bug that would prevent you from logging in with your Riot Account because a few files were missing. These will now properly be created on startup.

- Fixed a bug that prevented you from creating/editing custom themes.

- Fixed a visual bug that still showed the loading circle on the player search page when not entering a "#" for the Riot tag.

- Fixed a visual bug that showed the wrong neon color/hover color in the color picker when creating a custom theme.

- Fixed a bug that prevented you from changing the app's main colors and saving it.

- Fixed a bug that showed the wrong rank icon in some cases. (This has been fixed by switching from local files to online hosted images with specific IDs.)

## __Everything Else__

- Reworked the way VALTracker loads the Map images for both the Favorite Matches and the player profiles. (Switched from local images that had to be updated manually to an API call that returnes the images)

- Moved all pages into their own directory because I got annoyed by the messy structure of the GitHub Repo.

- Switched all API Requests that fetch specific user data from using their Name and Tag to a players UUID. This allows for more reliable requests and results.