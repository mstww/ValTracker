var lastPage = sessionStorage.getItem("last_page");
$('#backToLastPage').on("click", function () {
    window.location.href = lastPage
})

function hideVideo() {
    $('.header-relative-div-largeview').css("display", "block")
    $('.largeview-vid').css("display", "none")
    document.getElementById('largeview-vid-element').pause();
    setTimeout(function () {
        $('.largeview-vid').css("background-color", "rgba(0, 0, 0, 0)")
    }, 100)
}

$.ajax({
    url: `https://valorant-api.com/v1/weapons/skins`,
    type: 'get',
    success: function (data, jqXHR) {
        for (var wcount = 0; wcount < data.data.length; wcount++) {
            if (data.data[wcount].uuid == sessionStorage.getItem("skinID") || data.data[wcount].levels[0].uuid == sessionStorage.getItem("skinID") || data.data[wcount].chromas[0].uuid == sessionStorage.getItem("skinID")) {
                $('#pageheader').append(data.data[wcount].displayName);
                var dataLevels = data.data[wcount].levels
                var dataChromas = data.data[wcount].chromas

                if (data.data[wcount].displayName == "Luxe Knife") {
                    $('.weapon-image').attr("src", data.data[wcount].chromas[0].fullRender);
                } else {
                    if (!data.data[wcount].levels[0].displayIcon) {
                        $('.weapon-image').attr("src", data.data[wcount].chromas[0].fullRender);
                    } else {
                        $('.weapon-image').attr("src", data.data[wcount].levels[0].displayIcon);
                    }
                }

                var total_radianite = -1;
                for (var count = data.data[wcount].levels.length; count > 0; count--) {
                    total_radianite++;
                    var li_handler = document.createElement('li')
                    if (count == 1) {
                        li_handler.classList.add('level-options-li', 'active-option')
                    } else {
                        li_handler.className = "level-options-li"
                    }
                    li_handler.id = count - 1;

                    li_handler.appendChild(document.createTextNode(`Level ${count}`))
                    var wrapper = document.getElementById('levels-wrapper')
                    var lastelement = document.getElementById('last-element')
                    wrapper.insertBefore(li_handler, lastelement)
                }
                if (total_radianite == 0) {
                    $('#skin-radprice').append("0")
                } else {
                    $('#skin-radprice').append(total_radianite + "0")
                }

                for (var count = 0; count < data.data[wcount].chromas.length; count++) {
                    var swatch_img = document.createElement('img')
                    swatch_img.className = "singleview-swatch"
                    swatch_img.id = `swatch-${count}`
                    if (data.data[wcount].chromas[count].swatch == null) {
                        $('.singleview-colors').css("display", "none")
                        continue;
                    }
                    swatch_img.src = data.data[wcount].chromas[count].swatch

                    var wrapper = document.getElementById('swatch-handler')
                    var lastelement = document.getElementById('last-swatch')
                    wrapper.insertBefore(swatch_img, lastelement)
                }

                $.ajax({
                    url: `https://api.henrikdev.xyz/valorant/v1/store-offers`,
                    type: 'get',
                    success: function (data2, jqXHR) {
                        for (var count = 0; count < data2.data.Offers.length; count++) {
                            if (data2.data.Offers[count].Rewards[0].ItemID == sessionStorage.getItem("skinID")) {
                                $('#skin-vpprice').append(data2.data.Offers[count].Cost[Object.keys(data2.data.Offers[count].Cost)[0]])
                            }
                        }

                        if ($('#skin-vpprice').text() == "") {
                            $('#skin-vpprice').append("-")
                            $('#skin-vpprice').addClass("disabled")
                        }

                        if (dataLevels[0].streamedVideo !== null) {
                            $('#largeview-vid-element').attr('src', dataLevels[0].streamedVideo);
                            $('.show-skinvid').css('display', 'block');
                        } else {
                            $('.show-skinvid').css('display', 'none');
                        }

                        $('.level-options-li').on("click", function () {
                            $('.active-option').removeClass("active-option")
                            $(this).addClass("active-option")
                            if (this.id < dataLevels.length - 1) {
                                $('.swatch-active').removeClass("swatch-active")
                            } else if (this.id == dataLevels.length - 1) {
                                $('#swatch-0').addClass("swatch-active")
                            }
                            var i = this.id
                            while (dataLevels[i].displayIcon == null) {
                                i--;
                            }
                            $('.weapon-image').attr("src", dataLevels[i].displayIcon);
                            if (dataLevels[i].streamedVideo !== null) {
                                $('#largeview-vid-element').attr('src', dataLevels[i].streamedVideo);
                                $('.show-skinvid').css('display', 'block');
                            } else {
                                $('.show-skinvid').css('display', 'none');
                            }
                        })

                        $('.singleview-swatch').on("click", function () {
                            if ($('.active-option').attr("id") !== dataLevels.length - 1) {
                                $('.active-option').removeClass("active-option")
                                $(`#${dataLevels.length-1}`).addClass("active-option")
                            }
                            $('.swatch-active').removeClass("swatch-active")
                            $(this).addClass("swatch-active")
                            var str = this.id
                            var newStr = str.split('-').pop()
                            if (dataChromas[newStr].displayIcon == null) {
                                $('.weapon-image').attr("src", dataChromas[newStr].fullRender);
                            } else {
                                $('.weapon-image').attr("src", dataChromas[newStr].displayIcon);
                            }
                            if (newStr == 0) {
                                $('#largeview-vid-element').attr('src', dataLevels[dataLevels.length - 1].streamedVideo);
                                $('.show-skinvid').css('display', 'block');
                            } else {
                                if (dataChromas[newStr].streamedVideo !== null) {
                                    if (newStr == 0) {
                                        $('#largeview-vid-element').attr('src', dataLevels[dataLevels.length - 1].streamedVideo);
                                    } else {
                                        $('#largeview-vid-element').attr('src', dataChromas[newStr].streamedVideo);
                                    }
                                    $('.show-skinvid').css('display', 'block');
                                } else {
                                    $('.show-skinvid').css('display', 'none');
                                }
                            }
                        });

                        $('.show-skinvid').on("click", function () {
                            var video = document.getElementById("largeview-vid-element");
                            video.currentTime = 0;
                            $('html, body, .bundle-largeview').css("overflow", "hidden")
                            $('.largeview-vid').css("display", "grid")
                            $('.header-relative-div-largeview').css("display", "none")
                            $('.header-relative-div-video').css("opacity", "1")
                            setTimeout(function () {
                                $('.largeview-vid').css("background-color", "rgba(0, 0, 0, 0.5)")
                            }, 400)
                        });
                    },
                    error: function (jqXHR) {
                        createErrorCard(this.url, jqXHR.status);
                    }
                });
            }
        }
    },
    error: function (jqXHR) {
        createErrorCard(this.url, jqXHR.status);
    }
});