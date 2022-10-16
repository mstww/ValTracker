import React from "react";
import { v5 as uuidv5 } from 'uuid';
import { executeQuery } from "../js/dbFunctions";

export default function ValIconHandler({ icon, classes }) {
  const [ isLightMode, setIsLightMode ] = React.useState(false);

  React.useEffect(async () => {
    try {
      var uuid = uuidv5("appColorTheme", process.env.SETTINGS_UUID);
      var themeName = await executeQuery(`SELECT value FROM setting:⟨${uuid}⟩`);
      if(themeName[0].value === "light") setIsLightMode(true);
    } catch(e) {
      console.log(e);
    }
  }, []);

  return <img className={classes} src={icon.split(".")[0] + (isLightMode ? '_black' : '') + '.png'} />
}