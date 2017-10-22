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

const Blue_Alpha_ctrls = document.createElement('img');
Blue_Alpha_ctrls.src = 'res/Blue_Alpha_ctrls.png';
const Blue_Alpha_title = document.createElement('img');
Blue_Alpha_title.src = 'res/Blue_Alpha_title.png';
const Orange_Omega_ctrls = document.createElement('img');
Orange_Omega_ctrls.src = 'res/Orange_omega_ctrls.png';
const Orange_Omega_title = document.createElement('img');
Orange_Omega_title.src = 'res/Orange_omega_title.png';

HUD.prototype.render = function() {

  this.texture.needsUpdate = true;
  this.canvas.width = this.canvas.width;  // Reset canvas

  if(this.game.introTimer > 0 || this.game.winner !== undefined) {
    this.ctx.fillStyle = 'rgb(10, 0, 10)';
    this.ctx.fillRect(0, 0, 1920, 1080);
  }

  if(this.game.introTimer < 400 && this.game.introTimer >= 200) {
    this.ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    this.ctx.font = '80pt Arial';
    const x = lerp(0, 200, (this.game.introTimer - 200) / 200);
    this.ctx.save();
    this.ctx.rotate(-0.15);
    this.ctx.scale(0.5, 0.5);
    this.ctx.drawImage(Blue_Alpha_title, 0 + x, 800);
    this.ctx.drawImage(Blue_Alpha_ctrls, 100 - x, 1200);
    this.ctx.restore();
  }

  if(this.game.introTimer < 200 && this.game.introTimer >= 1) {
    this.ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    this.ctx.font = '80pt Arial';
    const x = lerp(0, 200, (this.game.introTimer) / 200);
    this.ctx.save();
    this.ctx.rotate(0.15);
    this.ctx.scale(0.5, 0.5);
    this.ctx.drawImage(Orange_Omega_title, 1500 + x, 300);
    this.ctx.drawImage(Orange_Omega_ctrls, 1600 - x, 800);
    this.ctx.restore();
  }

  if(this.game.introTimer > 0) {
    return;
  }

  this.ctx.strokeStyle = 'rgba(255, 255, 255, .2)';
  this.ctx.lineWidth = 4;
  for(let i = 0; i < 10; i++) {
    this.ctx.beginPath();
    const x = 1920 / 2 + (i-4.5) * 100;
    const y = 60;
    this.ctx.arc(x, y, 30, 0, Math.PI * 2);
    if(i < 5) {
      const playerId = 0;
      const color = new THREE.Color(this.game.players[playerId].options.color);
      const style = `rgba(${color.r * 255 | 0}, ${color.g * 255 | 0}, ${color.b * 255 | 0}, 0.5`;
      this.ctx.strokeStyle = style;
      this.ctx.stroke();
      if(4 - i - this.game.scores[playerId] < 0) {
        this.ctx.fillStyle = `rgba(${2 * color.r * 255 | 0}, ${2 * color.g * 255 | 0}, ${2 * color.b * 255 | 0}, 0.8)`;
        this.ctx.fill();
      }
    } else {
      const playerId = 1;
      const color = new THREE.Color(this.game.players[playerId].options.color);
      const style = `rgba(${color.r * 255 | 0}, ${color.g * 255 | 0}, ${color.b * 255 | 0}, 0.5`;
      this.ctx.strokeStyle = style;
      this.ctx.stroke();
      if(-i + 5 + this.game.scores[playerId] > 0) {
        this.ctx.fillStyle = `rgba(${2 * color.r * 255 | 0}, ${2 * color.g * 255 | 0}, ${2 * color.b * 255 | 0}, 0.8)`;
        this.ctx.fill();
      }
    }
  }

  this.ctx.font = '14pt Arial';
  this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  if(JOYCONS.left !== undefined) {
    this.ctx.fillText('Left joycon connected', 20, 1060);
  }
  if(JOYCONS.right !== undefined) {
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Right joycon connected', 1900, 1060);
  }
};

HUD.prototype.update = function() {

};
