DEBUG = true;

CENTER = {
  x: 8,
  y: 4.5
};

FPS = 60;

missedGFXFrames = 0;

/* smoothstep interpolates between a and b, at time t from 0 to 1 */
function smoothstep(a, b, t) {
  var v = t * t * (3 - 2 * t);
  return b * v + a * (1 - v);
}

function clamp(low, x, high) {
  return Math.max(low, Math.min(x, high));
}

function loadImage(path) {
  var img = new Image();
  loaded++;
  img.onload = function() {
    loaded--
  };
  img.src = path;
  return img;
}

window.requestAnimFrame = (function() {
  return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 0);
    };
})();

function loop() {
  if (loaded > 0) {
    canvas.width = canvas.width;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillText("Loading " + loaded, 8 * GU, 4.5 * GU);
    requestAnimFrame(loop);
    return;
  }
  t = +new Date();
  dt += (t - old_time);
  old_time = t;
  while (dt > 20) {
    sm.update();
    dt -= 20;
  }
  /* clearing canvas */
  canvas.width = canvas.width;
  sm.render(renderer);


  requestAnimFrame(loop);
}

function bootstrap() {

  loaded = 1;

  /* global on purpose */
  renderer = new THREE.WebGLRenderer();
  document.body.appendChild(renderer.domElement);
  canvas = renderer.domElement;
  renderer.setClearColor(new THREE.Color(0.05, 0.05, 0.05));

  sm = new StateManager();

  dt = 0;
  t = 0;
  time = +new Date();
  old_time = time;
  KEYS = [];
  for (var i = 0; i < 256; i++) {
    KEYS[i] = false;
  }

  document.addEventListener("keydown", function(e) {
    KEYS[e.keyCode] = true;
  });

  document.addEventListener("keyup", function(e) {
    KEYS[e.keyCode] = false;
  });

  resize();

  /* add game states here */

  sm.addState("game", new GameState());

  document.body.appendChild(canvas);

  /* start the game */

  sm.changeState("game");

  loaded--;
  requestAnimFrame(loop);
}

function resize(e) {
  if (window.innerWidth / window.innerHeight > 16 / 9) {
    GU = (window.innerHeight / 9);
  } else {
    GU = (window.innerWidth / 16);
  }
  renderer.setSize(16 * GU, 9 * GU);
  canvas.style.margin = ((window.innerHeight - 9 * GU) / 2) + "px 0 0 " + ((window.innerWidth - 16 * GU) / 2) + "px";
}

window.onresize = resize;

/* global mixin for position/size-objects that do AABB collision with another posititon/size-object */
function contains(obj) {
  return obj.position.x < this.position.x + this.size.w &&
    obj.position.x + obj.size.w > this.position.x &&
    obj.position.y < this.position.y + this.size.h &&
    obj.position.y + obj.size.h > this.position.y;
}

// Array Remove - By John Resig (MIT Licensed)
Array.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};
