/*
Based on http://codetuto.com/2014/01/soundwrapper-class-for-soundjs/
 */

let SoundManager = (function () {
  let musics = {};
  let state = 'menu';

  const getTimeAtBeat = (beat, bpm = 130) =>  beat / (bpm / 60);  // in seconds

  const soundPath = 'res/';
  this.sounds = [
    {
      src: "sprite.ogg",
      data: {
        audioSprite: [
          {
            id: "menu-start",
            startTime: 0,
            duration: getTimeAtBeat(32) * 1000
          },
          {
            id: "menu-loop",
            startTime: getTimeAtBeat(32) * 1000,
            duration: getTimeAtBeat(32) * 1000
          },
          {
            id: "main-loop",
            startTime: getTimeAtBeat(80) * 1000,
            duration: (getTimeAtBeat(240) - getTimeAtBeat(80)) * 1000
          },
        ]
      }
    }
  ];
  createjs.Sound.alternateExtensions = ["mp3"];  // TODO: actually add mp3 variant
  createjs.Sound.on("fileload", function() {
    SoundManager.playMusic("menu-loop", -1, 500);
  });
  createjs.Sound.registerSounds(this.sounds, soundPath);

  /**
   * CreateJS Sound Manager
   * @returns {null}
   */
  function SoundManager() {
    throw new Error("This class can't be instantiated");
  }

  SoundManager.transitionFromMenuToMain = function() {
    SoundManager.playMusic('main-loop', -1, 3000, musics['menu-loop'].instance.position);
    SoundManager.stopMusic('menu-loop', 3000);
  };

  /**
   * Play music. This is only for playing musics. Use SoundManager.playSound to play sound effects
   * @static
   * @param {String} id
   * @param {Number} loop Number of times to repeat,0-once,-1-loop @default 0
   * @param {Number} fadeIn Number of milliseconds to fade in
   * @param {Number} offset The offset from the start of the audio to begin playback, in milliseconds
   * @returns {void}
   */
  SoundManager.playMusic = function (id, loop, fadeIn, offset) {
    if (musics[id] && musics[id].playing) {
      return;
    }
    loop = loop || 0;
    offset = offset || 0;
    fadeIn = (!fadeIn) ? 0 : fadeIn;
    let instance = createjs.Sound.play(id, {loop: loop, offset: offset});
    instance.volume = (fadeIn !== 0) ? 0 : 1;
    let o = {
      instance: instance,
      playing: true,
      loop: loop,
      fadeStep: 1000 / (FPS * fadeIn),
      fadeProgression: 0,
      fadeType: "FADE_IN"
    };
    musics[id] = o;
    instance.addEventListener("complete", function () {
      SoundManager.musicComplete(o);
    });
    return instance;
  };

  SoundManager.update = function () {
    for (let id in musics) {
      let o = musics[id];
      if (o.playing) {
        if (o.fadeType === "FADE_IN") {
          o.fadeProgression += o.fadeStep;
          if (o.fadeProgression >= 1) {
            o.fadeProgression = 1;
          }
          o.instance.volume = Math.sqrt(o.fadeProgression);
        } else {
          o.fadeProgression -= o.fadeStep;
          if (o.fadeProgression <= 0) {
            o.fadeProgression = 0;
            SoundManager.stopMusic(id);
          } else {
            o.instance.volume = Math.sqrt(o.fadeProgression);
          }
        }
      }
    }
  };
  SoundManager.musicComplete = function (o) {
    o.playing = false;
  };
  /**
   * Stop a playing music
   * @static
   * @param {String} id
   * @param {Number}  fadeOut Number of milliseconds to fadeOut
   * @returns {void}
   */
  SoundManager.stopMusic = function (id, fadeOut) {
    let o = musics[id];
    fadeOut = (!fadeOut) ? 0 : fadeOut;
    if (o && o.playing) {
      o.fadeType = "FADE_OUT";
      o.fadeStep = (o.instance.volume * 1000) / (FPS * fadeOut);
    }
  };
  /**
   * Play a sound. Use this only to play a sound effect. If it is music, use CSM.playMusic instead
   * @param {String} id
   * @returns {void}
   */
  SoundManager.playSound = function (id) {
    createjs.Sound.play(id);
  };
  /**
   * Stop a sound
   * @param {String} id
   * @returns {void}
   */
  SoundManager.stopSound = function (id) {
    createjs.Sound.stop(id);
  };
  /**
   * Stop playing all sounds
   * @param {type} fadeOut
   * @returns {void}
   */
  SoundManager.stopAllMusics = function (fadeOut) {
    for (let id in musics) {
      SoundManager.stopMusic(id, fadeOut);
    }
  };
  return SoundManager;
})();
