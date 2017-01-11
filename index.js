(function (root, factory) {
    'use strict'
    /* istanbul ignore next */
    if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory)
    } else {
        // Browser globals
        root.Animation = factory()
    }
})(this, function () {
  function Animation($el, options) {
      var defaultOptions = {
          /**
           * @option
           * @name animationName
           * @type String
           * @default ''
           * @description Animation.defineAnimation(name, keyframes)中定义的name
           */
          animationName: '',
          /**
           * @option
           * @name duration
           * @type Number
           * @default 1000
           * @description animation-duration (ms)
           */
          duration: 1000,         // ms
          /**
           * @option
           * @name easing
           * @type String
           * @default 'ease'
           * @description animation-timing-function
           */
          easing: 'ease',         // animation-timing
          /**
           * @option
           * @name delay
           * @type Number
           * @default 0
           * @description animation-delay (ms)
           */
          delay: 0,               // ms
          /**
           * @option
           * @name iteration
           * @type Number
           * @default 1
           * @description animation-iteration-count. Number or 'infinite'
           */
          iteration: 1,           // Number or 'infinite'
          /**
           * @option
           * @name direction
           * @type String
           * @default 'normal'
           * @description animation-direction. 'normal', 'alternate', 'alternate-reverse'
           */
          direction: 'normal',    // 'alternate', 'alternate-reverse', 'normal'
          /**
           * @option
           * @name fillMode
           * @type String
           * @default 'none'
           * @description animation-fill-mode. 'forwards', 'backwards', 'both', 'none'
           */
          fillMode: 'none',       // 'forwards', 'backwards', 'both', 'none'
          /**
           * @option
           * @name autoPlay
           * @type Boolean
           * @default true
           * @description 是否自动播放动画
           */
          autoPlay: true,
          /**
           * @option
           * @name onAnimationStart
           * @type Function
           * @default null
           * @description callback of AnimationStart event
           */
          onAnimationStart: function() {},
          /**
           * @option
           * @name onAnimationEnd
           * @type Function
           * @default null
           * @description callback of AnimationEnd event
           */
          onAnimationEnd: function() {},
          /**
           * @option
           * @name onAnimationIteration
           * @type Function
           * @default null
           * @description callback of AnimationIteration event
           */
          onAnimationIteration: function() {}
      };

      this.options = $.extend(defaultOptions, options);
      this.$el = $el;

      this.playing = false;
      this.iterationCount = 0;

      this._init();
  }

  /** Instance Properties **/
  Animation.prototype = {

      constructor: Animation,

      _init: function() {
          var formatTime = function(n){return /^\d+$/.test(n) ? n + 'ms' : n.toString()},
              prefix = Animation.PREFIX;

          this.$el
              .css(prefix + 'animation-duration', formatTime(this.options.duration))
              .css(prefix + 'animation-timing-function', this.options.easing)
              .css(prefix + 'animation-delay', formatTime(this.options.delay))
              .css(prefix + 'animation-direction', this.options.direction)
              .css(prefix + 'animation-fill-mode', this.options.fillMode)
              .css(prefix + 'animation-play-state', this.options.autoPlay ? 'running' : 'paused')
              .css(prefix + 'animation-iteration-count', this.options.iteration.toString());

          this._attach();

          if(this.options.autoPlay)
              this.play();
      },

      _attach: function() {
          var eventPrefix = Animation.EVENT_PREFIX,
              self = this;

          this.$el.on(eventPrefix + 'AnimationStart', function(e){
              if(e.target == self.$el[0])
                  self.options.onAnimationStart && self.options.onAnimationStart();
          });

          this.$el.on(eventPrefix + 'AnimationIteration', function(e){
              if(e.target == self.$el[0]) {
                  self.iterationCount ++;
                  self.options.onAnimationIteration && self.options.onAnimationIteration();
              }
          });

          this.$el.on(eventPrefix + 'AnimationEnd', function(e){
              if(e.target == self.$el[0])
                  self.options.onAnimationEnd && self.options.onAnimationEnd();
          })
      },

      /**
       * @method
       * @name play
       * @public
       * @description play animation。通过设置animation-play-state='running'来播放动画
       */
      play: function() {
          var name = Animation.get(this.options.animationName),
              prefix = Animation.PREFIX;

          this.playing = true;

          this.$el.css(prefix + 'animation-name', name);
          this.$el.css(prefix + 'animation-play-state', 'running');
      },

      /**
       * @method
       * @name replay
       * @public
       * @description replay the animation. 当非infinite动画结束后，调用play()是不能再次播放动画的，需要调用replay()来重新播放动画
       */
      replay: function() {
          this.revoke();

          setTimeout(function() {
              this.play();
          }.bind(this), 50);
      },

      /**
       * @method
       * @name stop
       * @public
       * @description stop the animation. 通过设置animation-play-state='paused'来暂停动画。这个不会触发AnimationEnd事件。暂停后可以通过play()来回复动画（如果动画还未结束）
       */
      stop: function() {
          this.playing = false;
          this.$el.css(Animation.PREFIX + 'animation-play-state', 'paused');
      },

      /**
       * @method
       * @name revoke
       * @public
       * @description 撤销动画。与stop()不同，revoke会让动画消失，并不像stop只是暂停并保留动画
       */
      revoke: function() {
          var prefix = Animation.PREFIX;
          this.iterationCount = 0;
          this.playing = false;
          this.$el.css(prefix + 'animation-name', '');
      }
  };


  /** Class Properties **/
  Animation._map = {};

  Animation._handleVendorPrefix = function() {
      if(Animation.PREFIX && Animation.EVENT_PREFIX)
          return;

      var prefix = '',
          eventPrefix,
          vendors = {webkit: 'webkit', moz: '', O: 'o'},
          el = document.createElement('div'),
          key;

      for(key in vendors) {
          if (el.style[vendors[key] + 'Animation'] !== undefined) {
              prefix = '-' + key.toLowerCase() + '-';
              eventPrefix = key;
          }
      }

      Animation.PREFIX = prefix;
      Animation.EVENT_PREFIX = eventPrefix;
  };

  Animation.get = function(animationName) {
      return Animation._map[animationName];
  };

  /**
   * @method
   * @name defineAnimation
   * @public
   * @description Animation类方法。用来通过keyframes来定义animation
   * @param animationName (String)
   * @param keyframes (Object)
   */
  Animation.defineAnimation = function(animationName, keyframes) {
      Animation._handleVendorPrefix();

      var styleElement = document.createElement('style'),
          head = document.getElementsByTagName('head')[0] || document.documentElement,
          animateName = 'wy-animation-' + new Date() * 1 + parseInt(Math.random() * 10000),
          cssText = '@' + Animation.PREFIX + 'keyframes ' + animateName + '{',
          key;

      for(key in keyframes) {
          var css = '{',
              obj = keyframes[key],
              prop,
              val,
              i;

          for(prop in obj) {
              val = obj[prop];
              prop = prop.replace(/([A-Z])/g, function(a,b){return '-' + b.toLowerCase()});
              prop = prop.replace(/easing/g, 'animation-timing');
              prop = prop.replace(/^(?=transform|perspective|transition|animation)/g, Animation.PREFIX);
              css += prop + ':' + val + ';';
          }

          css += '}'
          key = key.replace(/%/g, '');
          key = key.split(',');

          for(i = 0; i < key.length; i++) {
              cssText += key[i] + '%';
              cssText += css;
          }
      }

      cssText += '}';
      styleElement.appendChild(document.createTextNode(cssText));

      head.appendChild(styleElement);

      Animation._map[animationName] = animateName;
  };

  /**
   * @method
   * @name applyAnimation
   * @public
   * @description Animation类方法。用来通过应用已定义或者预定义(Animation.EFFECT)动画到元素上。返回Animation实例。预定义动画名：flash, shake, swing, wobble, bounceIn, bounceInLeft, bounceInRight, bounceOut, bounceOutLeft, bounceOutRight, fadeIn, fadeOut, flip, flipInX, flipInY, flipOutX, flipOutY, rollIn, rollOut, zoomIn, zoomOut
   * @param $el (jQuery Element)
   * @param options (Object)
   */
  Animation.applyAnimation = function($el, options) {

      if(!options) {
          console.error('options is required for Animation.apply()');
          return null;
      }

      // for pre-defined animation effect, automatically define it if not been defined yet
      var keyframes = Animation.EFFECT[options.animationName],
          realAnimationName = Animation.get(options.animationName);

      if(!realAnimationName && keyframes) {
          Animation.defineAnimation(options.animationName, keyframes);
      }

      return new Animation($el, options);
  };

  Animation.EFFECT = {
      'flash': {
          '0,50,100': {opacity: 1},
          '25,75': {opacity: 0}
      },
      'shake': {
          '0,100': {transform: 'translate3d(0, 0, 0)'},
          '10, 30, 50, 70, 90': {transform: 'translate3d(-10px, 0, 0)'},
          '20, 40, 60, 80': {transform: 'translate3d(10px, 0, 0)'}
      },
      'swing':{
          '20': {transform: 'rotate3d(0, 0, 1, 15deg)'},
          '40': {transform: 'rotate3d(0, 0, 1, -10deg)'},
          '60': {transform: 'rotate3d(0, 0, 1, 5deg)'},
          '80': {transform: 'rotate3d(0, 0, 1, -5deg)'},
          '100': {transform: 'rotate3d(0, 0, 1, 0deg)'}
      },
      'wobble':{
          '0': {transform: 'none'},
          '15': {transform: 'translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg)'},
          '30': {transform: 'translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)'},
          '45': {transform: 'translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)'},
          '60': {transform: 'translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)'},
          '75': {transform: 'translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)'},
          '100': {transform: 'none'}
      },
      'bounceIn':{
          '0':{opacity: 0, transform: 'scale3d(.3, .3, .3)'},
          '20':{transform: 'scale3d(1.1, 1.1, 1.1)'},
          '40':{transform: 'scale3d(.9, .9, .9)'},
          '60':{opacity: 1, transform: 'scale3d(1.03, 1.03, 1.03)'},
          '80':{transform: 'scale3d(.97, .97, .97)'},
          '100':{opacity: 1, transform: 'scale3d(1, 1, 1)'}
      },
      'bounceInLeft':{
          '0':{opacity: 0, transform: 'translate3d(-3000px, 0, 0)'},
          '60':{opacity: 1, transform: 'translate3d(25px, 0, 0)'},
          '75':{transform: 'translate3d(-10px, 0, 0)'},
          '90':{transform: 'translate3d(5px, 0, 0)'},
          '100':{transform: 'none'}
      },
      'bounceInRight':{
          '0':{opacity: 0, transform: 'translate3d(3000px, 0, 0)'},
          '60':{opacity: 1, transform: 'translate3d(-25px, 0, 0)'},
          '75':{transform: 'translate3d(10px, 0, 0)'},
          '90':{transform: 'translate3d(-5px, 0, 0)'},
          '100':{transform: 'none'}
      },
      'bounceOut':{
          '0':{transform: 'scale3d(.9, .9, .9)'},
          '50,55':{transform: 'scale3d(1.1, 1.1, 1.1)'},
          '100':{opacity: 0, transform: 'scale3d(.3, .3, .3)'}
      },
      'bounceOutLeft':{
          '20':{opacity:1,transform: 'translate3d(20px, 0, 0)'},
          '100':{opacity: 0, transform: 'translate3d(-2000px, 0, 0)'}
      },
      'bounceOutRight':{
          '20':{opacity:1,transform: 'translate3d(-20px, 0, 0)'},
          '100':{opacity: 0, transform: 'translate3d(2000px, 0, 0)'}
      },
      'fadeIn':{
          '0': {opacity: 0},
          '100': {opacity: 1}
      },
      'fadeOut':{
          '0': {opacity: 1},
          '100': {opacity: 0}
      },
      'flip':{
          '0':{transform: 'perspective(400px) rotate3d(0, 1, 0, -360deg)'},
          '40':{transform: 'perspective(400px) rotate3d(0, 1, 0, -190deg)'},
          '60':{transform: 'perspective(400px) rotate3d(0, 1, 0, -170deg)'},
          '80':{transform: 'perspective(400px) scale3d(.95, .95, .95)', 'animation-timing-function': 'ease-in'},
          '100':{transform: 'perspective(400px)', 'animation-timing-function': 'ease-in'}
      },
      'flipInX':{
          '0':{transform: 'perspective(400px) rotate3d(1, 0, 0, 90deg)'},
          '40':{transform: 'perspective(400px) rotate3d(1, 0, 0, -20deg)'},
          '60':{transform: 'perspective(400px) rotate3d(1, 0, 0, 10deg)'},
          '80':{transform: 'perspective(400px) rotate3d(1, 0, 0, -5deg)'},
          '100':{transform: 'perspective(400px)'}
      },
      'flipInY':{
          '0':{transform: 'perspective(400px) rotate3d(0, 1, 0, 90deg)'},
          '40':{transform: 'perspective(400px) rotate3d(0, 1, 0, -20deg)'},
          '60':{transform: 'perspective(400px) rotate3d(0, 1, 0, 10deg)'},
          '80':{transform: 'perspective(400px) rotate3d(0, 1, 0, -5deg)'},
          '100':{transform: 'perspective(400px)'}
      },
      'flipOutX':{
          '0':{transform: 'perspective(400px)'},
          '30':{transform: 'perspective(400px) rotate3d(1, 0, 0, -20deg)', opacity: 1},
          '100':{transform: 'perspective(400px) rotate3d(1, 0, 0, 90deg)', opacity: 0}
      },
      'flipOutY':{
          '0':{transform: 'perspective(400px)'},
          '30':{transform: 'perspective(400px) rotate3d(0, 1, 0, -20deg)', opacity: 1},
          '100':{transform: 'perspective(400px) rotate3d(0, 1, 0, 90deg)', opacity: 0}
      },
      'rollIn':{
          '0':{transform: 'translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg)', opacity: 0},
          '100':{transform: 'none', opacity: 1}
      },
      'rollOut':{
          '0':{transform: 'none', opacity: 1},
          '100':{transform: 'translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg)', opacity: 0}
      },
      'zoomIn':{
          '0':{transform: 'scale3d(.3, .3, .3)', opacity: 0},
          '50':{opacity: 1}
      },
      'zoomOut':{
          '0':{opacity: 1},
          '50':{transform: 'scale3d(.3, .3, .3)', opacity: 0},
          '100':{opacity: 0}
      }
  };

});
