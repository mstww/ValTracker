const langs = {
  "en-US": "en-US",
  "de-DE": "de-DE",
  "es-CL": "es-ES",
  "fr-FR": "fr-FR",
  "": "en-US",
  undefined: "en-US"
}

export default function APIi18n(i18nInput) {
  return langs[i18nInput];
}