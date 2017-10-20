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

  this.ctx.strokeStyle = 'rgba(255, 255, 255, .2)';
  this.ctx.lineWidth = 4;
  for(let i = 0; i < 10; i++) {
    this.ctx.beginPath();
    const x = 1920 / 2 + (i-4.5) * 100;
    const y = 40;
    this.ctx.arc(x, y, 30, 0, Math.PI * 2);
    if(i < 5) {
      const color = new THREE.Color(this.game.player1.options.color);
      const style = `rgba(${color.r * 255 | 0}, ${color.g * 255 | 0}, ${color.b * 255 | 0}, 0.5`;
      this.ctx.strokeStyle = style;
      this.ctx.stroke();
      if(4 - i - this.game.scores[0] < 0) {
        this.ctx.fillStyle = `rgba(${2 * color.r * 255 | 0}, ${2 * color.g * 255 | 0}, ${2 * color.b * 255 | 0}, 0.8)`;
        this.ctx.fill();
      }
    } else {
      const color = new THREE.Color(this.game.player2.options.color);
      const style = `rgba(${color.r * 255 | 0}, ${color.g * 255 | 0}, ${color.b * 255 | 0}, 0.5`;
      this.ctx.strokeStyle = style;
      this.ctx.stroke();
      if(-i + 5 + this.game.scores[1] > 0) {
        this.ctx.fillStyle = `rgba(${2 * color.r * 255 | 0}, ${2 * color.g * 255 | 0}, ${2 * color.b * 255 | 0}, 0.8)`;
        this.ctx.fill();
      }
    }
  }

  this.texture.needsUpdate = true;
};

HUD.prototype.update = function() {

};
