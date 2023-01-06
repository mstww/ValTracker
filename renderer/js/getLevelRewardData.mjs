import APIi18n from "../components/translation/ValApiFormatter.jsx";

export const getLevelRewardData = async (uuid, rewardType, lang) => {
  try {
    switch(rewardType) {
      case "EquippableSkinLevel":
        return {
          isText: false,
          image: 'https://media.valorant-api.com/weaponskinlevels/' + uuid + '/displayicon.png',
          uuid: uuid,
          text: null
        }
      case "EquippableCharmLevel":
        return {
          isText: false, 
          image: 'https://media.valorant-api.com/buddylevels/' + uuid + '/displayicon.png',
          uuid: uuid,
          text: null
        }
      case "Currency":
        return {
          isText: false, 
          image: '/images/radianite_icon.png',
          text: null
        }
      case "PlayerCard":
        return { 
          isText: false, 
          image: 'https://media.valorant-api.com/playercards/' + uuid + '/smallart.png' ,
          uuid: uuid,
          text: null
        }
      case "Spray":
        return { 
          isText: false, 
          image: 'https://media.valorant-api.com/sprays/' + uuid + '/fulltransparenticon.png',
          uuid: uuid,
          text: null
        }
      case "Title":
        var titleData = await (await fetch('https://valorant-api.com/v1/playertitles/' + uuid + `?language=${APIi18n(lang)}`, { 'Content-Type': 'application/json' })).json();
        return {
          isText: true,
          image: null,
          uuid: uuid,
          text: titleData.data.displayName
        }
      case "Character":
        return {
          isText: false,
          image: 'https://media.valorant-api.com/agents/' + uuid + '/displayicon.png',
          uuid: uuid,
          text: null
        }
    } 
  } catch(e) {
    console.log(e);
  }
}