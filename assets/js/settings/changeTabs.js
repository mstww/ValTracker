$(document).ready(() => { 
    let searchParams = new URLSearchParams(window.location.search)
    let hasQuery = searchParams.has('tab')
    if(hasQuery == true) {
        let tab = searchParams.get('tab')
        switch (tab) {
            case 'valtracker':
                // Switch to valtracker tab (Do nothing as it is already active)
                break;
            case 'themes':
                $('.settings-navbar span.active').removeClass('active');
                $('.settings-navbar span#settings-themes').addClass('active');

                $('.settings-wrapper.valtracker').attr("id", "");
    
                $('.settings-wrapper.valtracker').css("display", "none");
                $('.settings-wrapper.valtracker').css("opacity", "0");
    
                $('.settings-wrapper.themes').attr("id", "active-wrapper");
                break;
            case 'rpc':
                $('.settings-navbar span.active').removeClass('active');
                $('.settings-navbar span#settings-rpc').addClass('active');

                $('.settings-wrapper.valtracker').attr("id", "");
    
                $('.settings-wrapper.valtracker').css("display", "none");
                $('.settings-wrapper.valtracker').css("opacity", "0");
    
                $('.settings-wrapper.rpc').attr("id", "active-wrapper");
                break;
            case 'riot':
                $('.settings-navbar span.active').removeClass('active');
                $('.settings-navbar span#settings-riot').addClass('active');

                $('.settings-wrapper.valtracker').attr("id", "");
    
                $('.settings-wrapper.valtracker').css("display", "none");
                $('.settings-wrapper.valtracker').css("opacity", "0");
    
                $('.settings-wrapper.riot').attr("id", "active-wrapper");
                break;
            case 'other':
                $('.settings-navbar span.active').removeClass('active');
                $('.settings-navbar span#settings-other').addClass('active');

                $('.settings-wrapper.valtracker').attr("id", "");
    
                $('.settings-wrapper.valtracker').css("display", "none");
                $('.settings-wrapper.valtracker').css("opacity", "0");
    
                $('.settings-wrapper.other').attr("id", "active-wrapper");
                break;
        }
    }
    // Click on Element will let one of the tabs slide out and a new one slide in
    $('.settings-navbar span').on("click", function() {
        if(!this.classList.contains("active")) {

            $('.settings-navbar span.active').removeClass('active');
            $(this).addClass('active');

            $('#active-wrapper').css("display", "none");
            $('#active-wrapper').css("opacity", "0");

            $('#active-wrapper').attr("id", "");

            var wrapper_to_show = $('.settings-wrapper.' + this.id.split("-")[1])[0];
            $(wrapper_to_show).attr("id", "active-wrapper");
            $(wrapper_to_show).css("display", "block");
            $(wrapper_to_show).css("opacity", "1");
        }
    })
});