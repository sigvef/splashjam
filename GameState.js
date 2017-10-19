// Copy this file, rename to name of state and add to StateManager
function GameState() {
};

GameState.prototype.init = function() {
  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 1000); 
  this.camera.position.z = 20;
  this.stick = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 0.1),
      new THREE.MeshBasicMaterial({color: 0xff0000}));
  this.stick.position.x = 1;
  this.stickGroup = new THREE.Object3D();
  this.stickGroup.add(this.stick);
  this.scene.add(this.stickGroup);

  this.rotDz = 0;
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {

};

GameState.prototype.render = function(renderer) {
  renderer.render(this.scene, this.camera);
};

GameState.prototype.update = function() {
  if(KEYS[37]) {
    this.rotDz += 0.01;
  }
  if(KEYS[39]) {
    this.rotDz -= 0.01;
  }

  this.rotDz *= 0.98;
  if(this.rotDz > 2) {
    this.rotDz = 2;
  }
  this.stickGroup.rotation.z += this.rotDz;
};
