import React from "react";
import fs from 'fs';

export default function ValIconHandler({ icon, classes }) {
  const [ isLightMode, setIsLightMode ] = React.useState(false);

  React.useEffect(() => {
    var data = JSON.parse(fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/themes/color_theme.json"));
    if(data.themeName === "light") setIsLightMode(true);
  }, []);

  return <img className={classes} src={icon.split(".")[0] + (isLightMode ? '_black' : '') + '.png'} />
}