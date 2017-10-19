// Copy this file, rename to name of state and add to StateManager
function GameState() {
};

GameState.prototype.init = function() {
  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 1000); 
  this.camera.position.z = 200;
  this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(2, 0.1, 0.1),
      new THREE.MeshBasicMaterial({color: 0xff0000}));
  this.scene.add(this.ball);

  this.matterEngine = Matter.Engine.create();
  this.physicsBall = Matter.Bodies.circle(0, 0, 1, { density: 0.04, frictionAir: 0.005});
  Matter.World.add(this.matterEngine.world, this.physicsBall);
  Matter.World.add(this.matterEngine.world, Matter.Constraint.create({
            pointA: { x: 5, y: 5 },
            bodyB: this.physicsBall
                  }));

  this.rotDz = 0;
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
};

GameState.prototype.render = function(renderer) {
  this.ball.position.x = this.physicsBall.position.x;
  this.ball.position.y = -this.physicsBall.position.y;
  this.ball.rotation.z = this.physicsBall.angle;
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
  this.ball.rotation.z += this.rotDz;

  Matter.Engine.update(this.matterEngine);
};
