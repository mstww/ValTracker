import { useRouter } from 'next/router';

export default function LocalText(json, path, num1replace, num2replace) {
  const router = useRouter();

  var str = (router.query.lang + '.' + path);

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
  }

  return res;
}