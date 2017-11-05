/*
Modified version of http://codetuto.com/2014/01/soundwrapper-class-for-soundjs/
 */

let SoundManager = (function () {
  window.PULSE = 0;
  let musics = {};
  let loaded = false;
  window.MUSICS = musics;
  window.BEATPULSE = 0;
  let sign = 1;
  let previousSign = 1;

  const getTimeAtBeat = (beat, bpm = 130) =>  beat / (bpm / 60);  // in seconds

  const soundPath = 'res/';
  this.sounds = [
    {
      src: "sprite.ogg",
      data: {
        audioSprite: [
          {
            id: "menu-loop",
            startTime: getTimeAtBeat(8 * 4) * 1000,
            duration: getTimeAtBeat(8 * 4) * 1000
          },
          {
            id: "main-loop",
            startTime: getTimeAtBeat(20 * 4) * 1000,
            duration: (getTimeAtBeat(60 * 4) - getTimeAtBeat(20 * 4)) * 1000
          },
          {
            id: "hit1",
            startTime: getTimeAtBeat(61 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "hit2",
            startTime: getTimeAtBeat(62 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "hit3",
            startTime: getTimeAtBeat(63 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "hit4",
            startTime: getTimeAtBeat(64 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "hit5",
            startTime: getTimeAtBeat(65 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "respawn",
            startTime: getTimeAtBeat(66 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "release",
            startTime: getTimeAtBeat(67 * 4) * 1000,
            duration: getTimeAtBeat(4) * 1000
          },
          {
            id: "grab",
            startTime: getTimeAtBeat(68.5 * 4) * 1000,
            duration: getTimeAtBeat(1) * 1000
          },
          {
            id: "bounce1",
            startTime: getTimeAtBeat(68.75 * 4) * 1000,
            duration: getTimeAtBeat(0.7 / 4) * 1000
          },
          {
            id: "bounce2",
            startTime: getTimeAtBeat(68.75 * 4 + 1 / 4) * 1000,
            duration: getTimeAtBeat(0.7 / 4) * 1000
          },
          {
            id: "bounce3",
            startTime: getTimeAtBeat(68.75 * 4 + 2 / 4) * 1000,
            duration: getTimeAtBeat(0.7 / 4) * 1000
          },
          {
            id: "bounce4",
            startTime: getTimeAtBeat(68.75 * 4 + 3 / 4) * 1000,
            duration: getTimeAtBeat(0.7 / 4) * 1000
          },
          {
            id: "win",
            startTime: getTimeAtBeat(69 * 4) * 1000,
            duration: getTimeAtBeat(6) * 1000
          },
        ]
      }
    }
  ];
  createjs.Sound.alternateExtensions = ["mp3"];
  createjs.Sound.on("fileload", function() {
    loaded = true;
    if (sm.activeState === sm.states['menu']) {
      SoundManager.playMusic("menu-loop", -1, 500);
    } else {
      SoundManager.playMusic("main-loop", -1, 500);
    }
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
    if (loaded) {
      let offset = 0;
      if (musics['menu-loop']) {
        SoundManager.stopMusic('menu-loop', 1000);
        offset = musics['menu-loop'].instance.position;
      }
      SoundManager.playMusic('main-loop', -1, 1000, offset);
    }
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
    if(MUSICS['main-loop']) {
      let pulse = Math.sin(Math.PI + MUSICS['main-loop'].instance.position / 1000 * Math.PI * 2 / 60 * 130 / 2);
      window.PULSE = pulse;
      sign = Math.sign(pulse);
      BEATPULSE *= 0.9;
      if(sign != previousSign) {
        BEATPULSE = 1;
        previousSign = sign;
      }
    }
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
            o.instance.stop();
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
   * Play a sound. Use this only to play a sound effect. If it is music, use SoundManager.playMusic instead
   * @param {String} id
   * @returns {void}
   */
  SoundManager.playSound = function (id) {
    return createjs.Sound.play(id);
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
