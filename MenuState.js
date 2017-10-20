function MenuState() {
}

MenuState.prototype.init = function () {
  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 100000);
  this.cameraTarget = new THREE.Vector3(0, 0, -2500);
  this.camera.position.z = -2500;
  this.camera.rotation.y = Math.PI;
  this.camera.rotation.z = Math.PI;

  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.canvas.width = 1920;
  this.canvas.height = 1080;

  this.texture = new THREE.Texture(this.canvas);
  this.texture.minFilter = THREE.LinearFilter;
  this.texture.magFilter = THREE.LinearFilter;
  this.plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 900),
    new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
    })
  );
  this.plane.rotation.x = Math.PI;
  this.scene.add(this.plane);
};

MenuState.prototype.pause = function () {
};

MenuState.prototype.resume = function () {

};

MenuState.prototype.render = function (renderer) {
  this.canvas.width = this.canvas.width;  // Reset canvas
  this.ctx.font = '50px Arial';
  this.ctx.fillStyle = 'white';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('Press Enter to start the game', 960, 520);
  this.texture.needsUpdate = true;
  renderer.render(this.scene, this.camera);
};

MenuState.prototype.update = function () {
  SoundManager.update();
  if (KEYS[13] || KEYS[32]) {
    /* space bar */
    if (sm.activeState === this) {
      sm.changeState('game');
      SoundManager.transitionFromMenuToMain();
    }
  }
};
