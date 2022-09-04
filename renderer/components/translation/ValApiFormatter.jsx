const langs = {
  "en-US": "en-US",
  "de-DE": "de-DE",
  "es-CL": "es-ES",
  "": "en-US",
  undefined: "en-US"
}

export default function APIi18n(i18nInput) {
  return langs[i18nInput];
}