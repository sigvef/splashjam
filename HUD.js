function HUD(game) {
  this.game = game;

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
  this.game.scene.add(this.plane);
}

HUD.prototype.render = function() {
  this.canvas.width = this.canvas.width;  // Reset canvas

  this.ctx.fillStyle = 'white';
  this.ctx.font="42px Arial";

  this.ctx.textBaseline = "top";
  this.ctx.textAlign = 'left';
  this.ctx.fillText(parseInt(this.game.scores[0]).toString(), 40, 20);
  this.ctx.textAlign = 'right';
  this.ctx.fillText(parseInt(this.game.scores[1]).toString(), 1920 - 40, 20);

  this.texture.needsUpdate = true;
};

HUD.prototype.update = function() {

};
