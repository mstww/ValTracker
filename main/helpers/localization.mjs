import fs from 'fs';

export default function LocalText(json, path, num1replace, num2replace, num3replace) {
  if(fs.existsSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json')) {
    var on_load = JSON.parse(fs.readFileSync(process.env.APPDATA + '/VALTracker/user_data/load_files/on_load.json'));
      
    if(on_load.appLang === undefined) var lang = 'en-US'
    else var lang = on_load.appLang;
  } else {
    var lang = 'en-US';
  }

  var str = (lang + '.' + path);

  var res = str.split('.').reduce(function(o, k) {
    return o && o[k];
  }, json);

  if(res === undefined) {
    var str = 'en-US.' + path;
    var res = str.split('.').reduce(function(o, k) {
      return o && o[k];
    }, json);
  }

  if(typeof res === "string") {
    res = res.replace("{{ val1 }}", num1replace);
    res = res.replace("{{ val2 }}", num2replace);
    res = res.replace("{{ val3 }}", num3replace);
  }

  return res;
}