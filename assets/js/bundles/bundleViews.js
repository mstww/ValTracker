async function shiftBundleView(event, imageid, bundledescmonke) {
   var bundleID = imageid.split("/")[4]
   var leaveShift = 1.05;
   var hiddenShift = 0.9;
   var endShift = 1;
   $('.bundlecard').attr('onclick', '');
   $('body').css('overflow', 'hidden');
   $('.app').css('transform', 'scale(' + leaveShift + ')');
   $('.bundle-largeview').css('transform', 'scale(' + hiddenShift + ')');
   $('.app').fadeTo(200, 0);
   $('.header-relative-div-largeview').fadeTo(100, 1);
   $(".bundle-largeview").css({
      display: "block"
   });

   setTimeout(function () {
      $('.app').css('display', 'none');
      $(".bundle-largeview").css({
         display: "block"
      });
      $('.bundle-largeview').css('transform', 'scale(' + endShift + ')');
      $('body').css('border-bottom', 'none');
      $('.bundle-largeview').css('opacity', '1');
   }, 500)

   //------------------------------------ CREATING ELEMENT --------------------------------------------------------

   var largeviewBundleName = document.createElement("h1");
   largeviewBundleName.classList.add("largeview-bundlename");
   var BundleNameSpan = document.createElement("span");
   BundleNameSpan.classList.add("largeview-bundlename-span");
   BundleNameSpan.setAttribute("id", "largeviewBundlenameSpan");
   BundleNameSpan.appendChild(document.createTextNode("Bundle: " + event));

   var bundleinfoFlex = document.createElement("div");
   bundleinfoFlex.className = "largeview-bundleinfo-flex";

   var bundleImage = document.createElement("img");
   bundleImage.setAttribute("draggable", `false`);
   bundleImage.className = "largeview-bundleimage";
   var string = imageid;
   var newstring = string.replace(/displayicon2.png/, 'verticalpromoimage.png');
   var request;
   if (window.XMLHttpRequest)
      request = new XMLHttpRequest();
   else
      request = new ActiveXObject("Microsoft.XMLHTTP");
   request.open('GET', newstring, false);
   request.send(); // there will be a 'pause' here until the response to come.
   // the object request will be actually modified
   if (request.status === 404) {
      var newstring = string.replace(/displayicon2.png/, 'displayicon.png');
   }

   bundleImage.src = newstring;

   var infoFlexRight = document.createElement("div");
   infoFlexRight.className = "largeinfo-bundleinfo-flex-right";

   var bundleinfoH1 = document.createElement("h1");
   bundleinfoH1.appendChild(document.createTextNode("Bundleinfo: "));
   var bundleInfoUl = document.createElement("ul");
   bundleInfoUl.className = "largeinfo-bundleinfo-flex-right-ul";

   var bundleInfoLi1 = document.createElement("li");
   var bundleInfoLi1Span = document.createElement("span");
   bundleInfoLi1Span.className = "bundle-cost";
   bundleInfoLi1Span.appendChild(document.createTextNode("Cost: "))

   var bundleInfoLi2 = document.createElement("li");
   var bundleInfoLi2Span = document.createElement("span");
   bundleInfoLi2Span.className = "extra-bundle-desc";
   if (bundledescmonke == "null") {
      bundleInfoLi2Span.appendChild(document.createTextNode("Description: -"))
   } else {
      bundleInfoLi2Span.appendChild(document.createTextNode("Description: " + bundledescmonke))
   }


   var hr = document.createElement("hr");
   hr.className = "largeview-seperator";


   var bundleWeapons = document.createElement("div");
   bundleWeapons.className = "largeview-bundle-weapons";

   var bundleColorOptions = document.createElement("div");
   bundleColorOptions.className = "largeview-bundle-colors";

   var swatchImage;

   async function getBundles() {
      return (await (await this.fetch('https://api.valtracker.gg/bundles/' + bundleID, {
         method: 'GET',
      })).json());
   }

   var data = await getBundles();

   if (data.data.price !== undefined) {
      bundleInfoLi1Span.appendChild(document.createTextNode(data.data.price))
   } else {
      bundleInfoLi1Span.appendChild(document.createTextNode("Bundle not being sold."))
   }

   for (var i2 = 0; i2 < data.data.weapons.length; i2++) {
      for (var count3 = 0; count3 < data.data.weapons[i2].chromas.length; count3++) {
         var actualBundleWeapons = document.createElement("div");
         actualBundleWeapons.className = "bundle-weapons";

         var bundleWeaponFlex = document.createElement("div");
         bundleWeaponFlex.className = `largeview-bundle-weapon-flex`;

         var bundleWeaponImage = document.createElement("img");
         bundleWeaponImage.className = "largeview-bundle-weapon-img";
         bundleWeaponImage.setAttribute("draggable", `false`);

         bundleWeaponImage.src = data.data.weapons[i2].chromas[0].fullRender;

         var bundleWeaponFlexText = document.createElement("div");
         bundleWeaponFlexText.className = "largeview-bundle-weapon-info";

         var flexUl = document.createElement("ul");
         flexUl.className = "bundle-weapon-info-flex-ul"
         var flexLi1 = document.createElement("li");
         var flexLi1H2 = document.createElement("h2");
         flexLi1H2.className = "bundle-weapon-info-gunname";
         flexLi1H2.appendChild(document.createTextNode(data.data.weapons[i2].name));

         if (data.data.weapons[i2].levels[data.data.weapons[i2].levels.length - 1].video) {
            var flexLi2 = document.createElement("li");
            var flexLi2Button = document.createElement("button");
            flexLi2Button.className = "largeview-bundleweapon-preview";
            flexLi2Button.setAttribute("id", `${i2}`);
            flexLi2Button.setAttribute("onclick", "showPromoVid(this.parentElement.firstChild.textContent, this.id, '" + bundleID + "')");
            flexLi2Button.appendChild(document.createTextNode("Preview Video"));
         } else {
            var flexLi2 = document.createElement("li");
            var flexLi2Button = document.createElement("button");
            flexLi2Button.className = "largeview-bundleweapon-preview";
            flexLi2Button.setAttribute("id", `${i2}`);
            flexLi2Button.setAttribute("onclick", "showPromoVid(this.parentElement.firstChild.textContent, this.id, '" + bundleID + "')");
            flexLi2Button.setAttribute("style", "display: none;");
            flexLi2Button.appendChild(document.createTextNode("Preview Video"));
         }

         var flexLi3 = document.createElement("li");
         var flexLi3Span = document.createElement("span");
         if (data.data.weapons[i2].price !== undefined) {
            flexLi3Span.className = "single-weapon-price";
            flexLi3Span.appendChild(document.createTextNode("Cost: " + data.data.weapons[i2].price))
         } else {
            flexLi3Span.className = "single-weapon-price-disabled";
            flexLi3Span.appendChild(document.createTextNode("Cost: Not being sold."))
         }
         flexLi3.appendChild(flexLi3Span)

         var bundlePromoVid;

         if (data.data.weapons[i2].chromas[count3].video == !null) {
            bundlePromoVid = data.data.weapons[i2].chromas[count3].video;
         } else {
            var manualCount = data.data.weapons[i2].levels.length;
            bundlePromoVid = data.data.weapons[i2].levels[manualCount - 1].video;
         }

         var flexLi2HiddenSpan = document.createElement("span");
         flexLi2HiddenSpan.setAttribute("id", `largeview-bundleweapon-preview-link-hidden`);
         flexLi2HiddenSpan.appendChild(document.createTextNode(bundlePromoVid));
         flexLi2.appendChild(flexLi2HiddenSpan);

         actualBundleWeapons.appendChild(bundleWeaponFlex);

         bundleWeaponFlex.appendChild(bundleWeaponImage);
         bundleWeaponFlex.appendChild(bundleWeaponFlexText);

         bundleWeaponFlexText.appendChild(flexUl);

         flexUl.appendChild(flexLi1);
         flexUl.appendChild(flexLi3);
         flexUl.appendChild(flexLi2);

         flexLi1.appendChild(flexLi1H2);

         flexLi2.appendChild(flexLi2Button);

         bundleinfoFlex.appendChild(bundleImage);
         bundleinfoFlex.appendChild(infoFlexRight);
         infoFlexRight.appendChild(bundleinfoH1);
         infoFlexRight.appendChild(bundleInfoUl);

         bundleInfoUl.appendChild(bundleInfoLi1);
         bundleInfoUl.appendChild(bundleInfoLi2);

         bundleWeapons.appendChild(bundleColorOptions);
         bundleWeapons.appendChild(actualBundleWeapons);
         break;
      }
      var bundledesc;

      if (bundledescmonke == "null") {
         bundledesc = "-";
      } else {
         bundledesc = bundledescmonke;
      }

      bundleInfoLi1.appendChild(bundleInfoLi1Span);

      bundleInfoLi2.appendChild(bundleInfoLi2Span);

      largeviewBundleName.appendChild(BundleNameSpan);

      var cardGrid = document.getElementById("largeview-handler");
      var nextElement = document.getElementById("promo-vid-div");
      cardGrid.insertBefore(bundleWeapons, nextElement);
      cardGrid.insertBefore(hr, bundleWeapons);
      cardGrid.insertBefore(bundleColorOptions, hr);
      cardGrid.insertBefore(bundleinfoFlex, bundleColorOptions);
      cardGrid.insertBefore(largeviewBundleName, bundleinfoFlex);
   }

   for (var count3 = 0; count3 < data.data.weapons[0].chromas.length; count3++) {
      if (data.data.weapons[0].chromas[count3].swatch) {

         swatchImage = document.createElement("img");
         swatchImage.className = "swatch";
         swatchImage.setAttribute("id", count3)
         swatchImage.setAttribute("onclick", `changeBundleChroma('${count3}', '${bundleID}')`);
         swatchImage.src = data.data.weapons[0].chromas[count3].swatch;
         swatchImage.setAttribute("draggable", `false`);

         bundleColorOptions.appendChild(swatchImage);
      } else {
         break;
      }
   }
   //----------------------------------------------------------------------------------------------------------------
}