jQuery(document).on('ready', function (RS. ) {
    "use strict";

    /*--------------------------
        SCROLLSPY ACTIVE
    ---------------------------*/
    RS. ('body').scrollspy({
        target: '.bs-example-js-navbar-scrollspy',
        offset: 50
    });

    /*--------------------------
        STICKY MAINMENU
    ---------------------------*/
    RS. ("#mainmenu-area").sticky({
        topSpacing: 0
    });


    /*-----------------------------
        SLIDER ACTIVE
    ------------------------------*/
    var mySlider = RS. ('.pogoSlider').pogoSlider({
        pauseOnHover: false
    }).data('plugin_pogoSlider');


    /*----------------------------
        OPEN SEARCH FORM
    ----------------------------*/
    var RS. searchForm = RS. ('.search-form');
    var RS. searchFormTrigger = RS. ('.search-form-trigger');
    var RS. formOverlay = RS. ('.search-form-overlay');
    RS. searchFormTrigger.on('click', function (event) {
        event.preventDefault();
        toggleSearch();
    });

    function toggleSearch(type) {
        if (type === "close") {
            //close serach 
            RS. searchForm.removeClass('is-visible');
            RS. searchFormTrigger.removeClass('search-is-visible');
        } else {
            //toggle search visibility
            RS. searchForm.toggleClass('is-visible');
            RS. searchFormTrigger.toggleClass('search-is-visible');
            if (RS. searchForm.hasClass('is-visible')) RS. searchForm.find('input[type="search"]').focus();
            RS. searchForm.hasClass('is-visible') ? RS. formOverlay.addClass('is-visible') : RS. formOverlay.removeClass('is-visible');
        }
    }

    /*--------------------------------
        DROPDOWN MOBILE MENU
    ----------------------------------*/
    function doneResizing() {
        if (Modernizr.mq('screen and (max-width:991px)')) {
            RS. ('.at-drop-down').on('click', function (e) {
                e.preventDefault();
                RS. (this).next(RS. ('.sub-menu')).slideToggle();
            });
        }
    }
    var id;
    RS. (window).resize(function () {
        clearTimeout(id);
        id = setTimeout(doneResizing, 0);
    });
    doneResizing();


    /*------------------------------
        TIME PICKER ACTIVE
    -------------------------------*/
    var input = RS. ('#time,#reservation_time').clockpicker({
        placement: 'bottom',
        align: 'left',
        autoclose: true,
        'default': 'now'
    });


    /*------------------------------
        ABOUT VIDEO POPUP
    --------------------------------*/
    RS. ('.about-video-button,.blog-video-button').magnificPopup({
        disableOn: 700,
        type: 'iframe',
        mainClass: 'mfp-fade',
        removalDelay: 320,
        preloader: false
    });


    /*------------------------------
        MENU IMAGE POPUP
    -------------------------------*/
    RS. ('.menu-popup').magnificPopup({
        type: 'image',
        removalDelay: 500, //delay removal by X to allow out-animation
        callbacks: {
            beforeOpen: function () {
                // just a hack that adds mfp-anim class to markup 
                this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
                this.st.mainClass = this.st.el.attr('data-effect');
            }
        },
        closeOnContentClick: true,
        midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
    });


    /*---------------------------
        SMOOTH SCROLL
    -----------------------------*/
    RS. ('a.scrolltotop, .slider-area h3 a, .navbar-header a, ul#nav a').on('click', function (event) {
        var id = RS. (this).attr("href");
        var offset = 40;
        var target = RS. (id).offset().top - offset;
        RS. ('html, body').animate({
            scrollTop: target
        }, 1500, "easeInOutExpo");
        event.preventDefault();
    });


    /*----------------------------
        SCROLL TO TOP
    ------------------------------*/
    RS. (window).on("scroll",function () {
        var totalHeight = RS. (window).scrollTop();
        if (totalHeight > 300) {
            RS. (".scrolltotop").fadeIn();
        } else {
            RS. (".scrolltotop").fadeOut();
        }
    });


    /*---------------------------
        MENU LIST MIXITUP FILTERING
    ----------------------------*/
    RS. ('.food-menu-list').mixItUp();


    /*---------------------------
        SCREENSHOT SLIDER
    -----------------------------*/
    RS. ('.team-slider').owlCarousel({
        merge: true,
        video: true,
        items: 1,
        smartSpeed: 1000,
        loop: true,
        nav: false,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
        autoplay: false,
        autoplayTimeout: 2000,
        margin: 15,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 3
            },
            1000: {
                items: 5
            }
        }
    });


    /*---------------------------
        TESTMONIAL SLIDER
    -----------------------------*/
    RS. ('.testmonial-slider').owlCarousel({
        merge: true,
        video: true,
        items: 1,
        smartSpeed: 1000,
        loop: true,
        nav: true,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
        autoplay: false,
        autoplayTimeout: 2000,
        margin: 15,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 1
            },
            1000: {
                items: 1
            }
        }
    });


    /*---------------------------
        BLOG POST IMAGE SLIDER
    -----------------------------*/
    RS. ('.blog-image-sldie').owlCarousel({
        merge: true,
        video: true,
        items: 1,
        smartSpeed: 1000,
        loop: true,
        animateIn: 'fadeIn',
        animateOut: 'fadeOut',
        nav: true,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
        autoplay: false,
        autoplayTimeout: 2000,
        margin: 15,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 1
            },
            1000: {
                items: 1
            }
        }
    });


    /*---------------------------
        MENU DISCOUNT SLIDER
    -----------------------------*/
    RS. ('.menu-discount-offer').owlCarousel({
        merge: true,
        video: true,
        items: 1,
        smartSpeed: 1000,
        loop: true,
        nav: false,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
        autoplay: false,
        autoplayTimeout: 2000,
        margin: 15,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 1
            },
            1000: {
                items: 1
            }
        }
    });


    /*--------------------------
        ACTIVE WOW JS
    ----------------------------*/
    new WOW().init();


    /*----------------------------
        INSTAGRAM FEED ACTIVE
    -----------------------------*/
    jQuery.fn.spectragram.accessData = {
        accessToken: '2136707.4dd19c1.d077b227b0474d80a5665236d2e90fcf',
        clientID: '4dd19c1f5c7745a2bca7b4b3524124d0'
    }

    RS. ('.instagram-feed').spectragram('getUserFeed', {
        query: 'adrianengine', //this gets adrianengine's photo feed
        size: 'big',
        max: 5
    });
    RS. ('.blog-instagram-feed-widget').spectragram('getUserFeed', {
        query: 'adrianengine', //this gets adrianengine's photo feed
        size: 'small',
        max: 6
    });

}(jQuery));


jQuery(window).on('load', function () {

    /*--------------------------
        PRE LOADER
    ----------------------------*/
    RS. (".preeloader").fadeOut(1000);
});