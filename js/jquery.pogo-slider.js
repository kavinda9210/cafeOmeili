/**
 * 
 * jQuery Pogo Slider v0.7
 * 
 * Copyright 2015, Michael Griffin (mike@fluice.com)
 * 
 **/

(function (RS. , window, document, undefined) {

    function appendPrefixedStyles(obj, prop, val) {

        if (prop.charAt(0) === '*') {

            obj[prop.substring(1)] = val;

        } else {

            obj['-ms-' + prop] = val;
            obj['-webkit-' + prop] = val;
            obj[prop] = val;

        }

    }

    RS. .fn.precss = function (styles) {

        var prefixedStyles = {};

        if (arguments.length === 1) {

            for (style in styles) {
                if (styles.hasOwnProperty(style)) {
                    appendPrefixedStyles(prefixedStyles, style, styles[style]);
                }
            }

        } else {
            appendPrefixedStyles(prefixedStyles, arguments[0], arguments[1]);
        }

        this.css(prefixedStyles);

        return this;

    }

})(jQuery, window, document);


(function (RS. , window, document, undefined) {

    'use strict';

    var supportsCSSProp = function (featurename) {

        var feature = false;
        var domPrefixes = 'Webkit Moz ms O'.split(' ');
        var elm = document.createElement('div');
        var featurenameCapital = null;

        featurename = featurename.toLowerCase();

        if (elm.style[featurename]) {
            feature = true;
        }

        if (feature === false) {

            featurenameCapital = featurename.charAt(0).toUpperCase() + featurename.substr(1);

            for (var i = 0; i < domPrefixes.length; i++) {

                if (elm.style[domPrefixes[i] + featurenameCapital] !== undefined) {
                    feature = true;
                    break;
                }

            }

        }

        return feature;

    };

    var supports = {};
    supports.animation = supportsCSSProp('animation');
    supports.transition = supportsCSSProp('transition');
    supports.transform = supportsCSSProp('transform');

    var pluginName = 'pogoSlider';

    var defaults = {
        autoplayTimeout: 4000,
        autoplay: true,
        baseZindex: 1,
        displayProgess: true,
        onSlideStart: null,
        onSlideEnd: null,
        onSliderPause: null,
        onSliderResume: null,
        slideTransition: 'slide',
        slideTransitionDuration: 1000,
        elementTransitionStart: 500,
        elementTransitionDuration: 1000,
        elementTransitionIn: 'slideUp',
        elementTransitionOut: 'slideDown',
        generateButtons: true,
        buttonPosition: 'CenterHorizontal',
        generateNav: true,
        navPosition: 'Bottom',
        preserveTargetSize: false,
        targetWidth: 1000,
        targetHeight: 300,
        responsive: false,
        pauseOnHover: true
    };

    function Plugin(element, options) {

        this.element = element;
        this.RS. element = RS. (element);
        this.settings = RS. .extend({}, defaults, options);
        this.currentSlideIndex = 0;
        this.prevSlideIndex = 0;
        this.slideTimeoutId = 0;
        this.slides = [];
        this.calls = [];
        this.paused = false;
        this.navigating = false;
        this.slideStartTime = null;
        this.slideTimeRemaining = 0;

        this._init();

    }

    Plugin.prototype = {

        // creates the slides object to store all slide data
        // sets initial state and starts the wheels in motion
        _init: function () {

            var self = this;

            self.RS. element.find('.pogoSlider-slide').each(function () {

                var children = [];
                var elementTransitionDuration = 0;

                // store the original styles, so that we can restore them later
                RS. (this).data('original-styles', RS. (this).attr('style'));

                // create the slides object sotring all data
                RS. (this).find('.pogoSlider-slide-element').each(function () {

                    var startTime = parseInt(RS. (this).data('start')) !== undefined ? RS. (this).data('start') : self.settings.elementTransitionStart;
                    var duration = parseInt(RS. (this).data('duration')) || self.settings.elementTransitionDuration;

                    if ((startTime + duration) > elementTransitionDuration) {
                        elementTransitionDuration = (startTime + duration);
                    }

                    children.push({
                        RS. element: RS. (this),
                        element: this,
                        startTime: startTime,
                        duration: duration,
                        transitionIn: RS. (this).data('in') || self.settings.elementTransitionIn,
                        transitionOut: RS. (this).data('out') || self.settings.elementTransitionOut
                    });

                    RS. (this).css('opacity', 0);

                });

                var slide = {
                    RS. element: RS. (this),
                    element: this,
                    transition: RS. (this).data('transition') || self.settings.slideTransition,
                    duration: parseInt(RS. (this).data('duration')) || self.settings.slideTransitionDuration,
                    elementTransitionDuration: elementTransitionDuration,
                    totalSlideDuration: self.settings.autoplayTimeout + elementTransitionDuration,
                    children: children
                };

                self.slides.push(slide);

            });

            self.numSlides = self.slides.length;

            // initialize the first slide
            self.slides[0].RS. element.css('opacity', 1);

            // if autoplay set the corrext startTime and time remaining properties
            if (self.settings.autoplay && self.settings.displayProgess) {
                self._createProgessBar();
            }

            // set the correct aspect ratio of the slider
            self.RS. element.css('padding-bottom', (100 / (self.settings.targetWidth / self.settings.targetHeight)) + '%');

            var numImages = self.RS. element.find('img').length;

            // if there are images to load
            if (numImages > 0) {

                var imagesLoaded = 0;

                // show a loading div while assets are being loaded
                self.RS. element.prepend('<div class="pogoSlider-loading"><div class="pogoSlider-loading-icon"></div></div>');

                // when all images have loaded
                self.RS. element.find('img').one('load', function () {

                    if (++imagesLoaded === numImages) {

                        RS. ('.pogoSlider-loading').remove();

                        self._onSliderReady();

                    }

                }).each(function () {
                    if (this.complete) {
                        RS. (this).trigger('load');
                    }
                });

            } else {

                self._onSliderReady();

            }

        },

        _onSliderReady: function () {

            var self = this;

            // start the slider if autoplay is true
            if (self.settings.autoplay) {
                self.slideStartTime = new Date();
                self.slideTimeRemaining = self.slides[0].totalSlideDuration;
                self._slideTimeout(self.slideTimeRemaining);
            }

            if (self.settings.generateButtons && self.slides.length > 1) {
                self._createDirButtons();
            }

            if (self.settings.generateNav && self.slides.length > 1) {
                self._createNavigation();
            }

            if (self.settings.preserveTargetSize) {
                self._preserveTargetSize();

                if (self.settings.responsive) {
                    RS. (window).on('resize', function () {
                        self._preserveTargetSize();
                    });
                }

            }

            if (self.settings.pauseOnHover) {

                self.RS. element.on('mouseenter', function () {
                    self.pause();
                });

                self.RS. element.on('mouseleave', function () {
                    self.resume();
                });

            }

            self._onSlideStart(0);

        },

        _createDirButtons: function () {

            var self = this;

            self.RS. element.addClass('pogoSlider--dir' + self.settings.buttonPosition);

            RS. ('<button class="pogoSlider-dir-btn pogoSlider-dir-btn--prev"><i class="fa fa-angle-left"></i></button>').appendTo(self.RS. element).on('click', function () {
                self.prevSlide();
            });

            RS. ('<button class="pogoSlider-dir-btn pogoSlider-dir-btn--next"><i class="fa fa-angle-right"></i></button>').appendTo(self.RS. element).on('click', function () {
                self.nextSlide();
            });

        },

        _createNavigation: function () {

            var self = this;

            self.RS. element.addClass('pogoSlider--nav' + self.settings.navPosition);

            var RS. navContainer = RS. ('<ul class="pogoSlider-nav"></ul>').appendTo(self.RS. element);

            for (var i = 0; i < self.slides.length; i++) {
                RS. ('<li data-num="' + i + '"><button class="pogoSlider-nav-btn"></button></li>').appendTo(RS. navContainer).on('click', function () {
                    self.toSlide(RS. (this).data('num'));
                });
            }

        },

        getAppliedProps: function (el) {

            var styleSheets = document.styleSheets;
            var stylesReg = new RegExp('{(.+)}');
            el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;
            var inlineStyles = el.getAttribute('style').replace(/ /g, '').split(';');
            var props = [];

            for (var k = 0; k < inlineStyles.length; k++) {
                var inlineProp = inlineStyles[k].split(':')[0];
                // if this prop is not empty and has a value and is not already in the props array
                if (inlineProp && props.indexOf(inlineProp) === -1) {
                    props.push(inlineProp);
                }
            }

            for (var sheet in styleSheets) {
                if (styleSheets.hasOwnProperty(sheet)) {
                    var cssRules = styleSheets[sheet].rules || styleSheets[sheet].cssRules;
                    for (var r in cssRules) {
                        if (el.matches(cssRules[r].selectorText)) {
                            var matchedStyles = stylesReg.exec(cssRules[r].cssText.replace(/ /g, ''));
                            if (matchedStyles) {
                                var styles = matchedStyles[1].split(';');
                                for (var j = 0; j < styles.length; j++) {
                                    var prop = styles[j].split(':')[0];
                                    // if this prop is not empty and has a value and is not already in the props array
                                    if (prop && props.indexOf(prop) === -1) {
                                        props.push(prop);
                                    }
                                }
                            }

                        }
                    }
                }
            }

            return props;

        },

        _preserveTargetSize: function () {

            var self = this;
            var unitReg = new RegExp('px|%|em', 'i');
            var numReg = new RegExp('[0-9]*.?[0-9]+');
            var pixelReg = new RegExp('px', 'i');
            var scaleFactor = 1;

            if (this.scaledBy) {
                scaleFactor = (this.RS. element.width() / this.settings.targetWidth) / this.scaledBy;
            } else {
                scaleFactor = this.RS. element.width() / this.settings.targetWidth;
            }

            this.scaledBy = this.RS. element.width() / this.settings.targetWidth;

            this.RS. element.find('.pogoSlider-slide-element').each(function () {

                var elementStyles = window.getComputedStyle(this);
                var appliedProps = self.getAppliedProps(this);
                var styleObj = {};

                // store the oringal styles
                if (!RS. .data(self, 'originalStyles')) {
                    RS. .data(self, 'originalStyles', RS. (this).attr('style'));
                }

                for (var i = 0; i < appliedProps.length; i++) {

                    var cssVal = elementStyles.getPropertyValue(appliedProps[i]);

                    if (unitReg.test(cssVal) && numReg.test(cssVal)) {

                        // get the number
                        var numVal = numReg.exec(cssVal);
                        // get the unit
                        var unitVal = unitReg.exec(cssVal);

                        // if this is a pixel value
                        if (pixelReg.test(unitVal[0])) {
                            styleObj[appliedProps[i]] = Math.ceil(numVal[0] * scaleFactor) + unitVal[0];
                        } else {
                            styleObj[appliedProps[i]] = (numVal[0] * scaleFactor) + unitVal[0];
                        }

                    }

                }

                RS. (this).css(styleObj);

            });

        },

        // private method to create the slide progress bar
        _createProgessBar: function () {

            var progressHtml = '';

            progressHtml += '<div class="pogoSlider-progressBar">';
            progressHtml += '<div class="pogoSlider-progressBar-duration"></div>';
            progressHtml += '</div>';

            //this.RS. element.prepend(progressHtml);

            for (var i = 0; i < this.slides.length; i++) {
                this.slides[i].RS. element.prepend(progressHtml);
            }

        },

        // private method to create a slide pause call
        _slideTimeout: function (pauseFor) {

            var self = this;
            var timeoutId;

            timeoutId = self.slideTimeoutId = setTimeout(function () {

                if (!self.paused && timeoutId === self.slideTimeoutId) {
                    self._changeToNext();
                }

            }, pauseFor);

        },

        // public method to pause the slider
        pause: function () {

            if (this.settings.autoplay) {

                this.paused = true;

                clearTimeout(this.slideTimeoutId);

                if (this.settings.displayProgess) {
                    this.RS. element.find('.pogoSlider-progressBar-duration').stop(true);
                }

                this.slidePauseTime = new Date();
                this.slideTimeRemaining = this.slideTimeRemaining - ((new Date()) - this.slideStartTime);

                for (var i = 0; i < this.slides[this.currentSlideIndex].children.length; i++) {
                    this.slides[this.currentSlideIndex].children[i].RS. element.precss('animation-play-state', 'paused');
                }

                if (this.settings.onSliderPause) {
                    this.settings.onSliderPause.apply(this);
                }

            }

        },

        // public method to resume the slider
        resume: function () {

            if (this.settings.autoplay) {

                this.paused = false;
                this.slideStartTime = new Date();

                for (var i = 0; i < this.slides[this.currentSlideIndex].children.length; i++) {
                    this.slides[this.currentSlideIndex].children[i].RS. element.precss('animation-play-state', '');
                }

                // only add the additonal pause if there is time remaining
                if (this.slideTimeRemaining > 0 && !this.navigating) {

                    if (this.settings.displayProgess) {
                        this.RS. element.find('.pogoSlider-progressBar-duration').animate({
                            'width': '100%'
                        }, this.slideTimeRemaining, 'linear');
                    }

                    this._slideTimeout(this.slideTimeRemaining);

                }

                if (this.settings.onSliderResume) {
                    this.settings.onSliderResume.apply(this);
                }

            }

        },

        // public method to change to the next slide
        nextSlide: function () {

            if (!this.navigating) {

                clearTimeout(this.slideTimeoutId);

                this.prevSlideIndex = this.currentSlideIndex;

                if (++this.currentSlideIndex > (this.numSlides - 1)) {
                    this.currentSlideIndex = 0;
                }

                this._changeSlide(this.prevSlideIndex, this.currentSlideIndex);

            }

        },

        // public method to change to previous slide
        prevSlide: function () {

            if (!this.navigating) {

                clearTimeout(this.slideTimeoutId);

                this.prevSlideIndex = this.currentSlideIndex;

                if (--this.currentSlideIndex < 0) {
                    this.currentSlideIndex = this.numSlides - 1;
                }

                this._changeSlide(this.prevSlideIndex, this.currentSlideIndex);

            }

        },

        // public method to change to a specified slide
        toSlide: function (slideIndex) {

            if (!this.navigating) {

                clearTimeout(this.slideTimeoutId);

                // return if the we are already on the called slide, 
                // or the called slide is greater than the nuber of slides
                if (slideIndex === this.currentSlideIndex || slideIndex > (this.slides.length - 1)) {
                    return;
                }

                this.prevSlideIndex = this.currentSlideIndex;
                this.currentSlideIndex = slideIndex;
                this._changeSlide(this.prevSlideIndex, this.currentSlideIndex);

            }

        },

        // public method to destroy the plugin
        destroy: function () {

            this.paused = true;
            clearTimeout(this.slideTimeoutId);
            RS. .removeData(this.element, 'plugin_' + pluginName);

        },

        // private method to change to the next slide
        // used for the autoplay functionality
        _changeToNext: function () {

            this.prevSlideIndex = this.currentSlideIndex;

            if (++this.currentSlideIndex > (this.numSlides - 1)) {
                this.currentSlideIndex = 0;
            }

            this._changeSlide(this.prevSlideIndex, this.currentSlideIndex);

        },

        // private method to change slides
        _changeSlide: function (prevSlideIndex, currentSlideIndex) {

            var self = this;
            var slideTransitions;

            self._onSlideEnd(prevSlideIndex);

            self.navigating = true;

            // check if browser support modern css3 features, fallback to javascript animations if it does not
            if (supports.animation && supports.transition && supports.transform) {
                slideTransitions = self.slideTransitions;
            } else {
                slideTransitions = self.compatSlideTransitions;
            }

            // check if transitions is available, if not fall back to simple slide transition
            var slideTransition = slideTransitions[self.slides[currentSlideIndex].transition] ? self.slides[currentSlideIndex].transition : 'slide';
            var slideTransitionCallback = slideTransitions[slideTransition].apply(self, [prevSlideIndex, currentSlideIndex]);

            setTimeout(function () {

                // if this function has a callback, call it
                if (slideTransitionCallback) {
                    slideTransitionCallback();
                }

                self.navigating = false;

                self._slideCleanup(prevSlideIndex, false);
                self._slideElementCleanup(prevSlideIndex);

                if (self.settings.autoplay) {
                    self._slideTimeout(self.slides[currentSlideIndex].totalSlideDuration);
                }

                self._onSlideStart(currentSlideIndex);

            }, self.slides[currentSlideIndex].duration);

        },

        // private method called on slide start
        _onSlideStart: function (slideIndex) {

            this.slides[slideIndex].RS. element.css('z-index', 1);

            if (this.settings.autoplay) {
                // need to set them regardless of whether it is paused or not
                this.slideStartTime = new Date();
                this.slideTimeRemaining = this.slides[slideIndex].totalSlideDuration;

                if (this.settings.displayProgess && !this.paused) {
                    this.slides[slideIndex].RS. element.find('.pogoSlider-progressBar-duration').css('width', '0').animate({
                        'width': '100%'
                    }, this.slideTimeRemaining, 'linear');
                }
            }

            if (this.slides[slideIndex].children.length > 0) {
                this._slideElementsTransitionIn(slideIndex);
            }

            // if slide is paused on change, preserve paused state to next slide
            if (this.paused) {

                for (var i = 0; i < this.slides[slideIndex].children.length; i++) {
                    this.slides[slideIndex].children[i].RS. element.precss('animation-play-state', 'paused');
                }

            }

            if (this.settings.generateNav) {
                this.RS. element.find('.pogoSlider-nav-btn').removeClass('pogoSlider-nav-btn--selected');
                this.RS. element.find('.pogoSlider-nav-btn').eq(slideIndex).addClass('pogoSlider-nav-btn--selected');
            }

            if (this.settings.onSlideStart) {
                // run the slideEnd callback
                this.settings.onSlideStart.apply(this);
            }

        },

        // private method called on slide end
        _onSlideEnd: function (slideIndex) {

            var timeElapsed;

            if (this.settings.autoplay) {
                if (this.settings.displayProgess) {
                    this.slides[slideIndex].RS. element.find('.pogoSlider-progressBar-duration').stop(true).css('width', '0');
                }
            }

            if (this.paused) {

                timeElapsed = this.slides[slideIndex].totalSlideDuration - this.slideTimeRemaining;

                for (var i = 0; i < this.slides[slideIndex].children.length; i++) {
                    this.slides[slideIndex].children[i].RS. element.precss('animation-play-state', '');
                }

            } else {

                timeElapsed = this.slides[slideIndex].totalSlideDuration - (this.slideTimeRemaining - ((new Date()) - this.slideStartTime));

            }

            // transition out, if slides elements have already transitioned in
            if (this.slides[slideIndex].children.length > 0 && timeElapsed > this.slides[slideIndex].elementTransitionDuration) {
                //if (this.slides[slideIndex].children.length > 0 && (this.slides[slideIndex].totalSlideDuration - (this.slideTimeRemaining - ((new Date()) - this.slideStartTime))) > this.slides[slideIndex].elementTransitionDuration) {
                this._slideElementsTransitionOut(slideIndex);
            }

            if (this.settings.onSlideEnd) {
                // run the slideEnd callback
                this.settings.onSlideEnd.apply(this);
            }

        },

        // private methosd to animate in elements
        _slideElementsTransitionIn: function (slideIndex) {

            for (var i = 0; i < this.slides[slideIndex].children.length; i++) {

                var el = this.slides[slideIndex].children[i];

                el.RS. element
                    .precss({
                        '*opacity': 1,
                        'animation-duration': el.duration + 'ms',
                        'animation-delay': el.startTime + 'ms'
                    })
                    .addClass('pogoSlider-animation-' + el.transitionIn + 'In');

            }

        },

        // private methosd to animate out elements
        _slideElementsTransitionOut: function (slideIndex) {

            for (var i = 0; i < this.slides[slideIndex].children.length; i++) {

                var el = this.slides[slideIndex].children[i];

                el.RS. element
                    .precss('animation-delay', '')
                    .removeClass('pogoSlider-animation-' + el.transitionIn + 'In')
                    .addClass('pogoSlider-animation-' + el.transitionOut + 'Out');
            }

        },

        // ensure the slide are put back to their origninal state after they have transitioned out
        _slideCleanup: function (slideIndex, slideVisible) {

            if (this.slides[slideIndex].RS. element.find('.pogoSlider-slide-slice').length > 0) {
                this._removeSlideSlices(slideIndex);
            }

            this.slides[slideIndex].RS. element.attr('style', this.slides[slideIndex].RS. element.data('original-styles')).css('opacity', slideVisible ? '1' : '0');

        },

        // private method to clean up elements after slide ends
        _slideElementCleanup: function (slideIndex) {

            var removePogoSlideElementClasses = function (index, className) {
                return (className.match(/pogoSlider-(?:(?:transition)|(?:animation))(?:-[a-zA-Z0-9]+)?(?:--[a-z]+)?/gi) || []).join(' ');
            };

            var removePogoSlideElementStyles = function (index, style) {
                return style.replace(/(?:-webkit-)?(?:-ms-)?((?:transition)|(?:animation))[^;]+;/g, '');
            };

            this.slides[slideIndex].RS. element.find('.pogoSlider-progressBar-duration').css('width', '0');

            for (var i = 0; i < this.slides[slideIndex].children.length; i++) {
                this.slides[slideIndex].children[i].RS. element.removeClass(removePogoSlideElementClasses).attr('style', removePogoSlideElementStyles).css('opacity', 0);
            }

        },

        _createSlideSlices: function (slideIndex, rows, cols) {

            var numSlices = cols * rows;
            var sliceWidth = 100 / cols;
            var sliceHeight = 100 / rows;
            var sliceInnerWidth = 100 * cols;
            var sliceInnerHeight = 100 * rows;
            var RS. el = this.slides[slideIndex].RS. element;
            var styleAttr = RS. el.attr('style');
            var timeElapsed;

            if (this.paused) {
                timeElapsed = this.slides[slideIndex].totalSlideDuration - this.slideTimeRemaining;
            } else {
                timeElapsed = this.slides[slideIndex].totalSlideDuration - (this.slideTimeRemaining - ((new Date()) - this.slideStartTime));
            }

            // if the elements are still transitioning in in the previous slide
            // set a negative animation delay to prevent the animation from restarting
            if (slideIndex === this.prevSlideIndex && this.slides[slideIndex].children.length > 0 && timeElapsed < this.slides[slideIndex].elementTransitionDuration) {

                for (var i = 0; i < this.slides[slideIndex].children.length; i++) {

                    var animationDelay = (this.slides[slideIndex].children[i].startTime - timeElapsed) + 'ms';

                    // change the animation delay, to reflect the actual amount of time
                    this.slides[slideIndex].children[i].RS. element.precss('animation-delay', animationDelay);

                }

            }

            RS. el
                .children()
                .wrapAll('<div class="pogoSlider-slide-slice" style="' + 'width:' + sliceWidth + '%;height:' + sliceHeight + '%;top:0%;left:0%;' + '"/>')
                .wrapAll('<div class="pogoSlider-slide-slice-inner" style="' + styleAttr + 'width:' + sliceInnerWidth + '%;height:' + sliceInnerHeight + '%;top:0%;left:0%;' + '"/>');

            RS. el.attr('style', function (i, style) {
                return style.replace(/(?:background)[^;]+;/g, '');
            });

            for (var j = 0; j < numSlices; j++) {

                var colNum = j % rows;
                var rowNum = Math.floor(j / rows);

                var slicePosStyles = 'width:' + sliceWidth + '%;height:' + sliceHeight + '%;top:' + (sliceHeight * colNum) + '%;left:' + (sliceWidth * rowNum) + '%;';
                var sliceInnerPosStyles = 'width:' + sliceInnerWidth + '%;height:' + sliceInnerHeight + '%;top:-' + (100 * colNum) + '%;left:-' + (100 * rowNum) + '%;';
                var sliceInnerBackgroundStyles = '';
                if (this.settings.preserveTargetSize) {
                    sliceInnerBackgroundStyles = 'background-size:' + this.RS. element.width() + 'px ' + parseFloat(this.RS. element.css('padding-bottom')) + 'px;';
                }

                var el = RS. el.find('.pogoSlider-slide-slice')
                    .last();
                if (j != 0) {
                    el = el.clone(true, true)
                        .appendTo(this.slides[slideIndex].element);
                }
                el.attr('style', slicePosStyles)
                    .find('.pogoSlider-slide-slice-inner')
                    .attr('style', styleAttr + sliceInnerPosStyles + sliceInnerBackgroundStyles);

            }

        },

        // remove the slices and restore the slide back to its original state
        _removeSlideSlices: function (slideIndex) {

            var self = this;
            var RS. el = self.slides[slideIndex].RS. element;

            RS. el.attr('style', RS. el.data('original-styles'));

            // remove all slices except the first slide (which was the one we wrapped)
            RS. el.find('.pogoSlider-slide-slice').not(':first').remove();
            // unwrap the remaining slides (to preserve event handler etc.)
            RS. el.find('.pogoSlider-slide-slice-inner').children().unwrap();
            RS. el.find('.pogoSlider-slide-slice').children().unwrap();

        },

        _generateARandomArray: function (numItems) {

            var arr = [];

            for (var i = 0; i < numItems; i++) {
                arr.push(i);
            }

            for (var j = arr.length - 1; j > 0; j--) {
                var k = Math.floor(Math.random() * (j + 1));
                var temp = arr[j];
                arr[j] = arr[k];
                arr[k] = temp;
            }

            return arr;

        },

        // any slide transition effects can be added onto this object
        slideTransitions: {

            fade: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                // carry out transiton on previous slide and then clean up
                this.slides[prevSlideIndex].RS. element
                    .precss({
                        '*opacity': '0',
                        'transition-duration': currentSlide.duration + 'ms'
                    });

                // transiton in the current slide
                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        'transition-duration': currentSlide.duration + 'ms'
                    });

            },

            slide: function (prevSlideIndex, currentSlideIndex) {

                var method;

                if (currentSlideIndex === 0 && prevSlideIndex === this.slides.length - 1) {
                    method = 'slideLeft';
                } else if (prevSlideIndex === 0 && currentSlideIndex === this.slides.length - 1) {
                    method = 'slideRight';
                } else if (currentSlideIndex > prevSlideIndex) {
                    method = 'slideLeft';
                } else {
                    method = 'slideRight';
                }

                return this.slideTransitions[method].apply(this, [prevSlideIndex, currentSlideIndex]);

            },

            verticalSlide: function (prevSlideIndex, currentSlideIndex) {

                var method;

                if (currentSlideIndex === 0 && prevSlideIndex === this.slides.length - 1) {
                    method = 'slideUp';
                } else if (prevSlideIndex === 0 && currentSlideIndex === this.slides.length - 1) {
                    method = 'slideDown';
                } else if (currentSlideIndex > prevSlideIndex) {
                    method = 'slideUp';
                } else {
                    method = 'slideDown';
                }

                return this.slideTransitions[method].apply(this, [prevSlideIndex, currentSlideIndex]);

            },

            slideLeft: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss('animation-duration', currentSlide.duration + 'ms')
                    .addClass('pogoSlider-animation-leftOut');

                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-leftIn');

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-leftOut');
                    currentSlide.RS. element.attr('style', currentSlide.RS. element.data('original-styles')).css('opacity', '1').removeClass('pogoSlider-animation-leftIn');
                };

            },

            slideRight: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss('animation-duration', currentSlide.duration + 'ms')
                    .addClass('pogoSlider-animation-rightOut');

                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-rightIn');

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-rightOut');
                    currentSlide.RS. element.attr('style', currentSlide.RS. element.data('original-styles')).css('opacity', '1').removeClass('pogoSlider-animation-rightIn');
                };

            },

            slideUp: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss('animation-duration', currentSlide.duration + 'ms')
                    .addClass('pogoSlider-animation-upOut');

                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-upIn');

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-upOut');
                    currentSlide.RS. element.attr('style', currentSlide.RS. element.data('original-styles')).css('opacity', '1').removeClass('pogoSlider-animation-upIn');

                };

            },

            slideDown: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss('animation-duration', currentSlide.duration + 'ms')
                    .addClass('pogoSlider-animation-downOut');

                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-downIn');

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-downOut');
                    currentSlide.RS. element.attr('style', currentSlide.RS. element.data('original-styles')).css('opacity', '1').removeClass('pogoSlider-animation-downIn');

                };

            },

            slideRevealLeft: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss({
                        '*z-index': self.settings.baseZindex + 1,
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-leftOut');

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-leftOut');
                };

            },

            slideRevealRight: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss({
                        '*z-index': self.settings.baseZindex + 1,
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-rightOut');

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-rightOut');
                };

            },

            slideOverLeft: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        '*z-index': this.settings.baseZindex + 1,
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-leftIn');

                return function () {
                    currentSlide.RS. element.attr('style', currentSlide.RS. element.data('original-styles')).css('opacity', '1').removeClass('pogoSlider-animation-leftIn');
                };

            },

            slideOverRight: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                currentSlide.RS. element
                    .precss({
                        '*opacity': '1',
                        '*z-index': this.settings.baseZindex + 1,
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-rightIn');

                return function () {
                    currentSlide.RS. element.attr('style', currentSlide.RS. element.data('original-styles')).css('opacity', '1').removeClass('pogoSlider-animation-rightIn');
                };

            },

            expandReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.RS. element.css('overflow', 'visible');

                self.slides[prevSlideIndex].RS. element
                    .precss({
                        '*z-index': self.settings.baseZindex + 1,
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-expandReveal');

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                return function () {
                    self.RS. element.css('overflow', '');
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-expandReveal');
                };

            },

            shrinkReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element
                    .precss({
                        '*z-index': self.settings.baseZindex + 1,
                        'animation-duration': currentSlide.duration + 'ms'
                    })
                    .addClass('pogoSlider-animation-shrinkReveal');

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                return function () {
                    self.slides[prevSlideIndex].RS. element.removeClass('pogoSlider-animation-shrinkReveal');
                };

            },

            verticalSplitReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                // init current slide and prev slides position
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 1, 2);

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                RS. slices.precss('animation-duration', currentSlide.duration + 'ms');

                RS. slices.eq(0).addClass('pogoSlider-animation-leftOut');
                RS. slices.eq(1).addClass('pogoSlider-animation-rightOut');

            },

            horizontalSplitReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                // init current slide and prev slides position
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 2, 1);

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                RS. slices.precss('animation-duration', currentSlide.duration + 'ms');

                RS. slices.eq(0).addClass('pogoSlider-animation-upOut');
                RS. slices.eq(1).addClass('pogoSlider-animation-downOut');

            },

            zipReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                // init current slide and prev slides position
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 1, Math.round(self.RS. element.width() / 100));

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                RS. slices.precss('animation-duration', currentSlide.duration + 'ms');

                //var transitionDelay = currentSlide.duration / (RS. slices.length + 1);
                //var transitionDuration = transitionDelay * 2;

                RS. slices.each(function (index) {

                    if (index % 2 === 0) {
                        RS. (this).addClass('pogoSlider-animation-upOut');
                    } else {
                        RS. (this).addClass('pogoSlider-animation-downOut');
                    }

                });

            },

            barRevealDown: function (prevSlideIndex, currentSlideIndex) {

                return this.slideTransitions['barReveal'].apply(this, [prevSlideIndex, currentSlideIndex, 'down']);

            },

            barRevealUp: function (prevSlideIndex, currentSlideIndex) {

                return this.slideTransitions['barReveal'].apply(this, [prevSlideIndex, currentSlideIndex, 'up']);

            },

            barReveal: function (prevSlideIndex, currentSlideIndex, direction) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                // init current slide and prev slides position
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 1, Math.round(self.RS. element.width() / 100));

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                var animationDelay = currentSlide.duration / (RS. slices.length + 1);
                var animationDuration = animationDelay * 2;

                RS. slices.precss('animation-duration', animationDuration + 'ms');

                RS. slices.each(function (index) {

                    if (direction === 'down') {

                        RS. (this)
                            .addClass('pogoSlider-animation-downOut')
                            .precss('animation-delay', animationDelay * index + 'ms');

                    } else {

                        RS. (this)
                            .addClass('pogoSlider-animation-upOut')
                            .precss('animation-delay', animationDelay * index + 'ms');

                    }

                });

            },

            blocksReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                var height = 0;
                if (self.settings.preserveTargetSize) {
                    height = parseFloat(self.RS. element.css('padding-bottom'));
                } else {
                    height = self.RS. element.height();
                }
                var numRows = Math.round(height / 100); // 100 is the target square size
                var numCols = Math.round(self.RS. element.width() / 100);

                // init current slide and prev slides position
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                var randArr = self._generateARandomArray(numRows * numCols);
                self._createSlideSlices(prevSlideIndex, numRows, numCols);
                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                var animationDelay = currentSlide.duration / (RS. slices.length + 1);
                var animationDuration = animationDelay * 2;

                RS. slices.precss('animation-duration', animationDuration + 'ms');

                for (var i = 0; i < RS. slices.length; i++) {
                    RS. slices.eq(randArr.pop())
                        .precss('animation-delay', (animationDelay * i) + 'ms')
                        .addClass('pogoSlider-animation-blocksReveal');
                }

            },

            fold: function (prevSlideIndex, currentSlideIndex) {

                var method;

                if (currentSlideIndex === 0 && prevSlideIndex === this.slides.length - 1) {
                    method = 'foldLeft';
                } else if (prevSlideIndex === 0 && currentSlideIndex === this.slides.length - 1) {
                    method = 'foldRight';
                } else if (currentSlideIndex > prevSlideIndex) {
                    method = 'foldLeft';
                } else {
                    method = 'foldRight';
                }

                return this.slideTransitions[method].apply(this, [prevSlideIndex, currentSlideIndex]);

            },

            foldRight: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];
                var prevSlide = self.slides[prevSlideIndex];

                // init current slide and prev slides position
                self.RS. element.css('overflow', 'visible');
                prevSlide.RS. element.css({
                    'overflow': 'visible',
                    'z-index': self.settings.baseZindex
                });
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'overflow': 'visible',
                    'z-index': self.settings.baseZindex + 1
                });

                self._createSlideSlices(prevSlideIndex, 1, 2);
                var RS. prevSlideSlices = prevSlide.RS. element.find('.pogoSlider-slide-slice');

                self._createSlideSlices(currentSlideIndex, 1, 2);
                var RS. currentSlideSlices = self.slides[currentSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                var RS. bottomLeft = RS. prevSlideSlices.eq(0);
                //var RS. bottomRight = RS. prevSlideSlices.eq(1);
                var RS. topLeft = RS. currentSlideSlices.eq(0);
                var RS. topRight = RS. currentSlideSlices.eq(1);

                currentSlide.RS. element.prepend(RS. bottomLeft.detach());
                prevSlide.RS. element.prepend(RS. topLeft.detach());

                RS. bottomLeft
                    .addClass('pogoSlider-animation-foldInRight')
                    .precss('animation-duration', currentSlide.duration + 'ms');

                RS. topRight
                    .addClass('pogoSlider-animation-foldOutRight')
                    .precss('animation-duration', currentSlide.duration + 'ms');

                return function () {

                    // restore original overflow
                    self.RS. element.css('overflow', '');

                    // since the original element has been move, restore it to the original position
                    currentSlide.RS. element.prepend(RS. topLeft.detach());
                    prevSlide.RS. element.prepend(RS. bottomLeft.detach());

                    // need to manually cleanup the current slide
                    self._slideCleanup(currentSlideIndex, true);

                };

            },

            foldLeft: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];
                var prevSlide = self.slides[prevSlideIndex];

                // init current slide and prev slides position
                self.RS. element.css('overflow', 'visible');
                prevSlide.RS. element.css({
                    'overflow': 'visible',
                    'z-index': self.settings.baseZindex
                });
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'overflow': 'visible',
                    'z-index': self.settings.baseZindex + 1
                });

                self._createSlideSlices(prevSlideIndex, 1, 2);
                var RS. prevSlideSlices = prevSlide.RS. element.find('.pogoSlider-slide-slice');

                self._createSlideSlices(currentSlideIndex, 1, 2);
                var RS. currentSlideSlices = self.slides[currentSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                //var RS. bottomLeft = RS. prevSlideSlices.eq(0);
                var RS. bottomRight = RS. prevSlideSlices.eq(1);
                var RS. topLeft = RS. currentSlideSlices.eq(0);
                var RS. topRight = RS. currentSlideSlices.eq(1);

                currentSlide.RS. element.append(RS. bottomRight.detach());
                prevSlide.RS. element.append(RS. topRight.detach());

                RS. bottomRight
                    .addClass('pogoSlider-animation-foldInLeft')
                    .precss('animation-duration', currentSlide.duration + 'ms');

                RS. topLeft
                    .addClass('pogoSlider-animation-foldOutLeft')
                    .precss('animation-duration', currentSlide.duration + 'ms');

                return function () {

                    // restore original overflow
                    self.RS. element.css('overflow', '');

                    // need to manually cleanup the current slide
                    self._slideCleanup(currentSlideIndex, true);
                };

            }

        },

        // plain javascript transitions for older browsers
        compatSlideTransitions: {

            fade: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                // carry out transiton on previous slide and then clean up
                this.slides[prevSlideIndex].RS. element.animate({
                    opacity: 0
                }, currentSlide.duration);

                // transiton in the current slide
                currentSlide.RS. element.animate({
                    opacity: 1
                }, currentSlide.duration);

            },

            slide: function (prevSlideIndex, currentSlideIndex) {

                var method;

                if (prevSlideIndex > currentSlideIndex && prevSlideIndex === this.slides.length - 1 && currentSlideIndex === 0) {
                    method = 'slideLeft';
                } else if (prevSlideIndex < currentSlideIndex && prevSlideIndex === 0 && currentSlideIndex === this.slides.length - 1) {
                    method = 'slideRight';
                } else if (prevSlideIndex < currentSlideIndex) {
                    method = 'slideLeft';
                } else {
                    method = 'slideRight';
                }

                return this.slideTransitions[method].apply(this, [prevSlideIndex, currentSlideIndex]);

            },

            verticalSlide: function (prevSlideIndex, currentSlideIndex) {

                var method;

                if (prevSlideIndex > currentSlideIndex && prevSlideIndex === this.slides.length - 1 && currentSlideIndex === 0) {
                    method = 'slideUp';
                } else if (prevSlideIndex < currentSlideIndex && prevSlideIndex === 0 && currentSlideIndex === this.slides.length - 1) {
                    method = 'slideDown';
                } else if (prevSlideIndex < currentSlideIndex) {
                    method = 'slideUp';
                } else {
                    method = 'slideDown';
                }

                return this.slideTransitions[method].apply(this, [prevSlideIndex, currentSlideIndex]);

            },

            slideLeft: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element.animate({
                    left: '-100%'
                }, currentSlide.duration);

                currentSlide.RS. element.css({
                    left: '100%',
                    'opacity': 1
                }).animate({
                    left: 0
                }, currentSlide.duration);

            },

            slideRight: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element.animate({
                    left: '100%'
                }, currentSlide.duration);

                currentSlide.RS. element.css({
                    left: '-100%',
                    'opacity': 1
                }).animate({
                    left: 0
                }, currentSlide.duration);

            },

            slideUp: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element.animate({
                    top: '-100%'
                }, currentSlide.duration);

                currentSlide.RS. element.css({
                    top: '100%',
                    'opacity': 1
                }).animate({
                    top: '0'
                }, currentSlide.duration);

            },

            slideDown: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element.animate({
                    top: '100%'
                }, currentSlide.duration);

                currentSlide.RS. element.css({
                    top: '-100%',
                    'opacity': 1
                }).animate({
                    top: '0'
                }, currentSlide.duration);

            },

            slideRevealLeft: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element.css('z-index', this.settings.baseZindex + 1).animate({
                    left: '-100%'
                }, currentSlide.duration);

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': this.settings.baseZindex
                });

            },

            slideRevealRight: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element.css('z-index', this.settings.baseZindex + 1).animate({
                    left: '100%'
                }, currentSlide.duration);

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': this.settings.baseZindex
                });

            },

            slideOverLeft: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': this.settings.baseZindex,
                    'left': '100%'
                }).animate({
                    'left': 0
                }, currentSlide.duration);

            },

            slideOverRight: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': this.settings.baseZindex,
                    'right': '100%'
                }).animate({
                    'right': 0
                }, currentSlide.duration);

            },

            expandReveal: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element
                    .css('z-index', this.settings.baseZindex + 1)
                    .animate({
                        width: '120%',
                        height: '120%',
                        'left': '-10%',
                        'top': '-10%',
                        opacity: 0
                    }, currentSlide.duration);

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': this.settings.baseZindex
                });

            },

            shrinkReveal: function (prevSlideIndex, currentSlideIndex) {

                var currentSlide = this.slides[currentSlideIndex];

                this.slides[prevSlideIndex].RS. element
                    .css('z-index', this.settings.baseZindex + 1)
                    .animate({
                        width: '50%',
                        height: '50%',
                        'left': '25%',
                        'top': '25%',
                        opacity: 0
                    }, currentSlide.duration);

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': this.settings.baseZindex
                });

            },

            verticalSplitReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 1, 2);

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                RS. slices.eq(0).animate({
                    'left': '-50%'
                }, currentSlide.duration);

                RS. slices.eq(1).animate({
                    'left': '100%'
                }, currentSlide.duration);

            },

            horizontalSplitReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);

                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 2, 1);

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                RS. slices.eq(0).animate({
                    'top': '-50%'
                }, currentSlide.duration);

                RS. slices.eq(1).animate({
                    'top': '100%'
                }, currentSlide.duration);

            },

            zipReveal: function (prevSlideIndex, currentSlideIndex) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                // init prev slide
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                // init current slide
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 1, Math.round(self.RS. element.width() / 100));

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                var transitionDelay = currentSlide.duration / (RS. slices.length + 1);
                var transitionDuration = transitionDelay * 2;

                RS. slices.each(function (index) {

                    if (index % 2 === 0) {
                        RS. (this).delay(transitionDelay * index).animate({
                            'top': '100%'
                        }, transitionDuration);
                    } else {
                        RS. (this).delay(transitionDelay * index).animate({
                            'top': '-100%'
                        }, transitionDuration);
                    }

                });

            },

            barRevealDown: function (prevSlideIndex, currentSlideIndex) {

                return this.slideTransitions['barReveal'].apply(this, [prevSlideIndex, currentSlideIndex, 'down']);

            },

            barRevealUp: function (prevSlideIndex, currentSlideIndex) {

                return this.slideTransitions['barReveal'].apply(this, [prevSlideIndex, currentSlideIndex, 'up']);

            },

            barReveal: function (prevSlideIndex, currentSlideIndex, direction) {

                var self = this;
                var currentSlide = self.slides[currentSlideIndex];

                // init prev slide
                self.slides[prevSlideIndex].RS. element.css('z-index', self.settings.baseZindex + 1);
                // init current slide
                currentSlide.RS. element.css({
                    'opacity': 1,
                    'z-index': self.settings.baseZindex
                });

                self._createSlideSlices(prevSlideIndex, 1, Math.round(self.RS. element.width() / 100));

                var RS. slices = self.slides[prevSlideIndex].RS. element.find('.pogoSlider-slide-slice');

                var transitionDelay = currentSlide.duration / (RS. slices.length + 1);
                var transitionDuration = transitionDelay * 2;

                RS. slices.each(function (index) {

                    if (direction === 'down') {
                        RS. (this).delay(transitionDelay * index).animate({
                            'top': '100%'
                        }, transitionDuration);
                    } else {
                        RS. (this).delay(transitionDelay * index).animate({
                            'top': '-100%'
                        }, transitionDuration);
                    }

                });

            }

        }

    };

    RS. .fn[pluginName] = function (options) {

        this.each(function () {
            if (!RS. .data(this, 'plugin_' + pluginName)) {
                RS. .data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });

        // chain jQuery functions
        return this;
    };


})(jQuery, window, document);