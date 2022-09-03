import { ipcRenderer } from "electron";
import React from "react";
import { useRouter } from 'next/router';

export default function IpcLayer() {
  const router = useRouter();

  var page = router.pathname.split("/").pop();

  React.useEffect(() => {
    ipcRenderer.on('setDRPtoCurrentPage', function(event, args) {
      switch(page) {
        case("home"): {
          ipcRenderer.send('changeDiscordRP', 'hub_activity');
          break;
        }
        case("inventory"): case("skinchanger"): case("spraychanger"): case("cardchanger"): {
          ipcRenderer.send('changeDiscordRP', 'skins_activity');
          break;
        }
        case("player"): {
          ipcRenderer.send('changeDiscordRP', 'pprofile_activity');
          break;
        }
        case("favorites"): {
          ipcRenderer.send('changeDiscordRP', 'favmatches_activity');
          break;
        }
        case("settings"): {
          ipcRenderer.send('changeDiscordRP', 'settings_acitivity');
          break;
        }
        case("matchview"): {
          ipcRenderer.send('changeDiscordRP', 'matchview_activity');
          break;
        }
        case("shop"): {
          ipcRenderer.send('changeDiscordRP', 'shop_activity');
          break;
        }
        default: {
          ipcRenderer.send('changeDiscordRP', 'clear');
          break;
        }
      }
    });

    return () => {
      ipcRenderer.removeAllListeners();
    }
  }, []);

  return(
    <></>
  )
}