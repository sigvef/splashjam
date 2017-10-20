function MenuState() {
}

MenuState.prototype.init = function () {
  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 100000);
  this.cameraTarget = new THREE.Vector3(0, 0, 2500);
  this.camera.position.z = -15000;
  //this.camera.rotation.y = Math.PI;
  //this.camera.rotation.z = Math.PI;

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
    new THREE.PlaneGeometry(1600, 900),
    new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
    })
  );
  this.plane.rotation.x = Math.PI;
  //this.scene.add(this.plane);
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
  if(MenuState.Startmenu_Items && !this.Startmenu_Items) {
    this.Startmenu_Items = MenuState.Startmenu_Items.clone();
    this.Startmenu_Items.traverse(obj => {
      console.log(obj);
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: color,
        });
      }
    });
    this.mesh.add(this.Startmenu_Items);
  }
  //this.mesh.position.y = Math.sin(+Date() / 1000) * 1000;
  this.camera.rotation.y = Math.PI;
  SoundManager.update();
  if(this.Startmenu_Items) {
    //this.Startmenu_Items.rotation.x += 0.05;
    //this.Startmenu_Items.rotation.y += 0.05;
    //this.Startmenu_Items.rotation.z += 0.05;
  }
  if (KEYS[13] || KEYS[32]) {
    /* space bar */
    if (sm.activeState === this) {
      sm.changeState('game');
      SoundManager.transitionFromMenuToMain();
    }
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
}, () => {console.log('progress')}, () => {console.log('onerror')});
})();
