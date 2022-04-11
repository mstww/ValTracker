function redirectToSkinView(uuid) {
   sessionStorage.setItem("skinID", uuid)
   sessionStorage.setItem("last_page", window.location.href)
   window.location.href = "../pages/skinView.html"
}

const ipc = require('electron').ipcRenderer;

function makeCallAndBuildElements() {
   var path = window.location.pathname;
   var page = path.split("/").pop();
   if(page == "cardsPage.html") {
      $.ajax({
         url: `https://valorant-api.com/v1/playercards`,
         type: 'get',
         success: function (data, jqXHR) {
            for (var count = 0; count < data.data.length; count++) {
               var skinHandler = document.createElement("div");
               skinHandler.className = "card-wrapper";
               skinHandler.setAttribute("onclick", `cardRedirect(this.lastChild.textContent, this.firstChild.src)`)

               var cardImage = document.createElement("img");
               cardImage.className = "wide-card-image";
               cardImage.src = data.data[count].wideArt;
               skinHandler.appendChild(cardImage);

               var cardName = document.createElement("span");
               cardName.className = "card-name";
               cardName.setAttribute("id", "itemName");
               cardName.appendChild(document.createTextNode(data.data[count].displayName))
               skinHandler.appendChild(cardName);

               if(data.data[count].isHiddenIfNotOwned == true || data.data[count].displayName.includes("Beta")) {
                  var isTitleObtainable = document.createElement("span");
                  isTitleObtainable.className = "exclusive-title"
                  isTitleObtainable.appendChild(document.createTextNode("! This Card is exclusive !"))

                  skinHandler.appendChild(isTitleObtainable);
               }

               var wrapper = document.getElementById("skins-handler");
               var nextElement = document.getElementById("pageBottom");
               wrapper.insertBefore(skinHandler, nextElement);
            }
         },
         error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
         }
      });
   } else if(page == "spraysPage.html") {
      $.ajax({
         url: `https://valorant-api.com/v1/sprays`,
         type: 'get',
         success: function (data, jqXHR) {
            for (var count = 0; count < data.data.length; count++) {
               var skinHandler = document.createElement("div");
               skinHandler.className = "spray-wrapper";

               var cardImage = document.createElement("img");
               cardImage.className = "wide-card-image";
               if(data.data[count].fullTransparentIcon) {
                  cardImage.src = data.data[count].fullTransparentIcon;
               } else {
                  cardImage.src = data.data[count].displayIcon;
               }
               skinHandler.appendChild(cardImage);

               var cardName = document.createElement("span");
               cardName.className = "card-name";
               cardName.setAttribute("id", "itemName");
               cardName.appendChild(document.createTextNode(data.data[count].displayName))
               skinHandler.appendChild(cardName);

               if(data.data[count].isHiddenIfNotOwned == true || data.data[count].displayName.includes("Beta")) {
                  var isTitleObtainable = document.createElement("span");
                  isTitleObtainable.className = "exclusive-title"
                  isTitleObtainable.appendChild(document.createTextNode("! This Card is exclusive !"))

                  skinHandler.appendChild(isTitleObtainable);
               }

               var wrapper = document.getElementById("skins-handler");
               var nextElement = document.getElementById("pageBottom");
               wrapper.insertBefore(skinHandler, nextElement);
            }
         },
         error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
         }
      });
   } else if(page == "titlesPage.html") {
      $.ajax({
         url: `https://valorant-api.com/v1/playertitles`,
         type: 'get',
         success: function (data, jqXHR) {
            for (var count = 0; count < data.data.length; count++) {
               if(data.data[count].titleText == null) {
                  continue;
               }
               var skinHandler = document.createElement("div");
               skinHandler.className = "title-wrapper";
               //skinHandler.setAttribute("onclick", "toggleSkinInfo(this.children[1].textContent)")

               var titleName = document.createElement("span");
               titleName.className = "title-name";
               titleName.appendChild(document.createTextNode(data.data[count].titleText))
               titleName.setAttribute("id", "itemName");
               skinHandler.appendChild(titleName);

               if(data.data[count].isHiddenIfNotOwned == true) {
                  var isTitleObtainable = document.createElement("span");
                  isTitleObtainable.className = "exclusive-title"
                  isTitleObtainable.appendChild(document.createTextNode("! This Title is exclusive !"))

                  skinHandler.appendChild(isTitleObtainable);
               }

               var wrapper = document.getElementById("skins-handler");
               var nextElement = document.getElementById("pageBottom");
               wrapper.insertBefore(skinHandler, nextElement);

            }
         },
         error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
         }
      });
   } else {
      $.ajax({
         url: `https://valorant-api.com/v1/weapons`,
         type: 'get',
         success: function (data, jqXHR) {
            $.ajax({
               url: `https://api.henrikdev.xyz/valorant/v1/store-offers`,
               type: 'get',
               success: function (data2, jqXHR) {
                  for (var count = 0; count < data.data.length; count++) {
                     var PageName = document.getElementById('pageheader').textContent;
                     var weapon = PageName.split(" ")
                     if(data.data[count].displayName == weapon[1]) {
                        $('.skin-page-default-img').attr("src", data.data[count].displayIcon)
                        $('.single-skin-img').attr("src", data.data[count].displayIcon)
                        $('.pageheader-skincount-nr').append(data.data[count].skins.length)
                        for (var count2 = 0; count2 < data.data[count].skins.length; count2++) {
                           if(data.data[count].skins[count2].displayName.includes("Standard") || data.data[count].skins[count2].displayName == "Melee" || data.data[count].skins[count2].displayName == "Luxe") {
                              continue;
                           }

                           var skinHandler = document.createElement("div");
                           skinHandler.className = "skin-wrapper";
                           skinHandler.setAttribute("onclick", "redirectToSkinView(this.children[3].textContent)")

                           var skinimg = document.createElement("img");
                           skinimg.className = "single-skin-img";
                           if(data.data[count].skins[count2].displayName == "Luxe Knife") {
                              skinimg.setAttribute("src", data.data[count].skins[count2].chromas[0].fullRender);
                           } else {
                              if(!data.data[count].skins[count2].displayIcon) {
                                 skinimg.setAttribute("src", data.data[count].skins[count2].chromas[0].fullRender);
                              } else {
                                 skinimg.setAttribute("src", data.data[count].skins[count2].levels[0].displayIcon);
                              }
                           }

                           var skinName = document.createElement("span");
                           skinName.className = "skin-name";
                           skinName.appendChild(document.createTextNode(data.data[count].skins[count2].displayName))
                           skinName.setAttribute("id", "itemName");

                           var skinPriceWrapper = document.createElement("div");
                           skinPriceWrapper.className = "skin-price-wrapper"

                           var skinPrice = document.createElement("span");
                           skinPrice.className = "skin-price";

                           for (var count3 = 0; count3 < data2.data.Offers.length; count3++) {
                              if(data2.data.Offers[count3].Rewards[0].ItemID == data.data[count].skins[count2].levels[0].uuid) {
                                 skinPrice.appendChild(document.createTextNode(data2.data.Offers[count3].Cost[Object.keys(data2.data.Offers[count3].Cost)[0]]))
                              }
                           }

                           if(skinPrice.textContent !== "") {
                              var skinPriceImg = document.createElement("img");
                              skinPriceImg.className = "skin-price-img"
                              skinPriceImg.src = '../assets/img/vp_icon.png'

                              skinPriceWrapper.appendChild(skinPrice)
                              skinPriceWrapper.appendChild(skinPriceImg)
                           } else {
                              skinPrice.classList.add('disabled')

                              var skinPriceImg = document.createElement("img");
                              skinPriceImg.className = "skin-price-img"
                              skinPriceImg.src = '../assets/img/vp_icon.png'

                              skinPrice.textContent = "-"

                              skinPriceWrapper.appendChild(skinPrice)
                              skinPriceWrapper.appendChild(skinPriceImg)
                           }

                           var hiddenSkinUUID = document.createElement("span");
                           hiddenSkinUUID.setAttribute("style", "display: none;")
                           hiddenSkinUUID.textContent = data.data[count].skins[count2].levels[0].uuid

                           skinHandler.appendChild(skinimg);
                           skinHandler.appendChild(skinName);
                           skinHandler.appendChild(skinPriceWrapper);
                           skinHandler.appendChild(hiddenSkinUUID);

                           var wrapper = document.getElementById("skins-handler");
                           var nextElement = document.getElementById("pageBottom");
                           wrapper.insertBefore(skinHandler, nextElement);
                        }
                     }
                  }
               },
               error: function (jqXHR) {
                  createErrorCard(this.url, jqXHR.status);
               }
            });
         },
         error: function (jqXHR) {
            createErrorCard(this.url, jqXHR.status);
         }
      });
   }
}

$(document).ready(() => {
   ipc.send('changeDiscordRP', `skins_activity`)
   makeCallAndBuildElements();
   $('#backToLastPage').on("click", function () {
      window.location.href = sessionStorage.getItem("last_page");
   });
})