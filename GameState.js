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

  /* density: weight of the ball
   * frictionAir: the amount of friction in the air, I think. The bigger the number, the more friction */

  this.physicsBall = Matter.Bodies.circle(0, 0, 1, { density: 0.04, frictionAir: 0.005});

  /* move this anchorPoint around to get a bigger or smaller radius to rotate around */
  this.anchorPoint = {x: 5, y: 5};
  this.currentConstraint = Matter.Constraint.create({
    pointA: this.anchorPoint,
    bodyB: this.physicsBall,
  });
  Matter.World.add(this.matterEngine.world, this.physicsBall);
  Matter.World.add(this.matterEngine.world, this.currentConstraint);

  const anchorPrototype = new THREE.Mesh(
      new THREE.SphereGeometry(2, 0.1, 0.1),
      new THREE.MeshBasicMaterial({color: 0x0000ff}));
  this.anchors = [];
  for(let i = 0; i < 4; i++) {
    const anchor = anchorPrototype.clone();
    anchor.position.x = (Math.random() - 0.5) * 160;
    anchor.position.y = (Math.random() - 0.5) * 90;
    anchor.material = new THREE.MeshBasicMaterial({color: 0x0000ff});
    this.anchors.push(anchor);
    this.scene.add(anchor);
  }

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
  if(this.anchorPoint) {
    /* forceMultiplier: the bigger this is, the more force we apply to the ball when we push the arrow keys */
    const forceMultiplier = 0.0006;
    const p1 = this.anchorPoint;
    const p2 = this.physicsBall.position;
    const rotated = Matter.Vector.rotate({x: p2.x - p1.x, y: p2.y - p1.y}, Math.PI / 2);
    const normalised = Matter.Vector.normalise(rotated);
    if(KEYS[37]) {
      const force = Matter.Vector.mult(normalised, -forceMultiplier);
      Matter.Body.applyForce(this.physicsBall, this.physicsBall.position, force);
    }
    if(KEYS[39]) {
      const force = Matter.Vector.mult(normalised, forceMultiplier);
      Matter.Body.applyForce(this.physicsBall, this.physicsBall.position, force);
    }
  } else {
    for(let anchor of this.anchors) {
      const distanceSquared = Matter.Vector.sub(this.physicsBall.position, anchor.position).magnitudeSquared;
      console.log(distanceSquared);
      if(distanceSquared < 10) {
        this.anchorPoint = anchor.position;
        this.currentConstraint = Matter.Constraint.create({
          pointA: this.anchorPoint,
          bodyB: this.physicsBall,
        });
      }
    }
  }

  for(let anchor of this.anchors) {
    if(anchor.position == this.anchorPoint) {
      anchor.material.color.setRGB(0, 255, 0);
    } else {
      anchor.material.color.setRGB(0, 0, 255);
    }
  }

  if(KEYS[32]) {
    Matter.Composite.remove(this.matterEngine.world, this.currentConstraint);
    this.anchorPoint = undefined;
    /*
    this.currentConstraint = undefined;
    */
  }

  Matter.Engine.update(this.matterEngine);
};
