function MenuState() {
}

MenuState.prototype.init = function () {
  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 100000);
  this.cameraTarget = new THREE.Vector3(0, 0, 2500);
  this.camera.position.z = -13000;

  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.canvas.width = 1920;
  this.canvas.height = 1080;

  this.mesh = new THREE.Object3D();
  this.scene.add(this.mesh);

  this.texture = new THREE.Texture(this.canvas);
  this.texture.minFilter = THREE.LinearFilter;
  this.texture.magFilter = THREE.LinearFilter;
  this.plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5 * 1920, 5 * 1080),
    new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
    })
  );
  this.plane.rotation.x = Math.PI;
  this.plane.rotation.z = Math.PI;
  this.scene.add(this.plane);

  this.gameModes = {
    '1-player': {
      animationProgressTarget: 0,
      startMenuItemsRotationZ: Math.PI - 0.444,
      planeRotationY: -0.444,
      offsetX: -888
    },
    'multiplayer': {
      animationProgressTarget: 1,
      startMenuItemsRotationZ: Math.PI + 0.444,
      planeRotationY: 0.444,
      offsetX: 888
    }
  };
  this.selectedGameMode = '1-player';
  this.gameModeAnimationProgress = 0;  // between 0 and 1
  this.gameModeTransitionFactor = 0.0666;

  const that = this;
  this.mouseMoveHandler = function(e) {
    const coordinates = relativeMouseCoords(e, canvas);
    if (!isNaN(coordinates.x) && coordinates.x < canvas.width / 2) {
      that.selectedGameMode = '1-player';
    } else {
      that.selectedGameMode = 'multiplayer';
    }
  };
  this.mouseUpHandler = function(e) {
    that.startGame();
  }
};

MenuState.prototype.pause = function () {
  canvas.removeEventListener("mousemove", this.mouseMoveHandler, false);
  canvas.removeEventListener("mouseup", this.mouseUpHandler, false);
};

MenuState.prototype.resume = function () {
  canvas.addEventListener("mousemove", this.mouseMoveHandler, false);
  canvas.addEventListener("mouseup", this.mouseUpHandler, false);
};

MenuState.prototype.startGame = function() {
  if (sm.activeState === this) {
    sm.changeState('game', this.selectedGameMode);
    SoundManager.transitionFromMenuToMain();
  }
};

MenuState.prototype.render = function (renderer) {
  this.canvas.width = this.canvas.width;  // Reset canvas
  this.ctx.font = '42px monospace';
  this.ctx.textAlign = 'center';
  this.ctx.fillStyle = 'white';
  this.ctx.fillText('1 player', 550, 820);
  this.ctx.fillText('2 - 4 players', 1360, 820);

  this.ctx.save();
  this.ctx.globalAlpha = 0.6;
  this.ctx.fillText('vs. AI', 550, 880);
  this.ctx.fillText('Local multiplayer', 1360, 880);
  this.ctx.restore();

  this.texture.needsUpdate = true;
  renderer.render(this.scene, this.camera);
};

const menuMaterials = {
  'CurveSingle.014': new THREE.MeshBasicMaterial({color: 0xBFAD0A}),
  'CurveSingle.018': new THREE.MeshBasicMaterial({color: 0xBFAD0A}),
  'CurveSingle.022': new THREE.MeshBasicMaterial({color: 0xBF5B0A}),
  'CurveSingle.016': new THREE.MeshBasicMaterial({color: 0xBF5B0A}),
  'CurveSingle.015': new THREE.MeshBasicMaterial({color: 0xA02DD2}),
  'CurveSingle.020': new THREE.MeshBasicMaterial({color: 0xBFAD0A}),
  'CurveSingle.017': new THREE.MeshBasicMaterial({color: 0xBF5B0A}),
  'CurveSingle.021': new THREE.MeshBasicMaterial({color: 0xBF5B0A}),
  'CurveSingle.013': new THREE.MeshBasicMaterial({color: 0xBF5B0A}),
  'CurveSingle.023': new THREE.MeshBasicMaterial({color: 0xA02DD2}),
  'CurveSingle.019': new THREE.MeshBasicMaterial({color: 0xBF5B0A}),
};

MenuState.prototype.update = function () {
  if(MenuState.Startmenu_Items && !this.Startmenu_Items) {
    this.Startmenu_Items = MenuState.Startmenu_Items.clone();
    this.Startmenu_Items.traverse(obj => {
      if(obj.material) {
        //console.log(obj.name);
        //const color = obj.material.color;
        obj.material = menuMaterials[obj.name] || new THREE.MeshBasicMaterial({color: 0xffffff});
      }
    });
    this.mesh.add(this.Startmenu_Items);
  }
  this.camera.rotation.y = Math.PI;
  SoundManager.update();
  if(this.Startmenu_Items) {
    this.gameModeAnimationProgress += this.gameModeTransitionFactor * (
      this.gameModes[this.selectedGameMode].animationProgressTarget - this.gameModeAnimationProgress
    );
    this.camera.position.z = -13000 - 2000 * Math.sin(this.gameModeAnimationProgress * Math.PI);

    this.Startmenu_Items.rotation.z += this.gameModeTransitionFactor * (
      // rotation diff
      this.gameModes[this.selectedGameMode].startMenuItemsRotationZ - this.Startmenu_Items.rotation.z
    );
    this.plane.rotation.y += this.gameModeTransitionFactor * (
      // rotation diff
      this.gameModes[this.selectedGameMode].planeRotationY - this.plane.rotation.y
    );

    this.Startmenu_Items.position.x += this.gameModeTransitionFactor * (
      // position diff
      this.gameModes[this.selectedGameMode].offsetX - this.Startmenu_Items.position.x
    );
    this.plane.position.x += this.gameModeTransitionFactor * (
      // position diff
      this.gameModes[this.selectedGameMode].offsetX - this.plane.position.x
    );
  }

  if (KEYS[37]) {
    // left arrow key
    this.selectedGameMode = '1-player';
  } else if (KEYS[39]) {
    // right arrow key
    this.selectedGameMode = 'multiplayer';
  } else if (KEYS[13] || KEYS[32]) {
    /* space bar or enter key */
    this.startGame();
  }
};


(function() {
var manager = new THREE.LoadingManager();
const mixers = [];
const loader = new THREE.FBXLoader(manager);
loader.load('res/Startmenu_Items.fbx', object => {
  MenuState.Startmenu_Items = object;
  object.scale.set(10, 10, 10);
  object.rotation.x = Math.PI / 2;
  object.rotation.z = Math.PI;
}, () => {console.log('progress')}, () => {console.log('onerror')});
})();
