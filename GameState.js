// Copy this file, rename to name of state and add to StateManager
function GameState() {
};

GameState.prototype.init = function() {

  this.scene = new THREE.Scene();
  this.camera = new THREE.Camera();
  this.camera = new THREE.PerspectiveCamera(25, 16 / 9, 1, 10000); 
  this.camera.position.z = -2000;
  this.camera.rotation.y = Math.PI;
  this.camera.rotation.z = Math.PI;
  this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(20, 1, 1),
      new THREE.MeshBasicMaterial({color: 0xff0000}));
  this.scene.add(this.ball);
  this.ball.position.x = -2000;

  this.matterEngine = Matter.Engine.create();

  var render = Matter.Render.create({
        element: document.body,
        engine: this.matterEngine,
        options: {
          showAngleIndicator: true,
          showCollisions: true,
          showVelocity: true
        }
  });

  Matter.Render.run(render);
  Matter.Render.lookAt(render, {
            min: { x: -800, y: -600 },
            max: { x: 800, y: 600 }
                });


  /* density: weight of the ball
   * frictionAir: the amount of friction in the air, I think. The bigger the number, the more friction */

  this.physicsBall = Matter.Bodies.circle(0, 0, 10, { density: 0.004, frictionAir: 0.005});
  this.physicsBall.position.x = 1;

  this.anchorPoint = undefined;
  this.currentConstraint = undefined;
  Matter.World.add(this.matterEngine.world, this.physicsBall);


  const anchorPrototype = new THREE.Mesh(
      new THREE.SphereGeometry(20, 1, 1),
      new THREE.MeshBasicMaterial({color: 0x0000ff}));
  this.anchors = [];
  for(let i = 0; i < 10; i++) {
    const anchor = anchorPrototype.clone();
    anchor.position.x = (Math.random() - 0.5) * 1600;
    anchor.position.y = (Math.random() - 0.5) * 900;
    anchor.material = new THREE.MeshBasicMaterial({color: 0x0000ff});
    this.anchors.push(anchor);
    this.scene.add(anchor);
    anchor.body = Matter.Bodies.circle(
      anchor.position.x,
      anchor.position.y,
      10,
      {isStatic: true});
    Matter.World.add(this.matterEngine.world, anchor.body);
  }

};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
};

GameState.prototype.render = function(renderer) {
  this.ball.position.x = this.physicsBall.position.x;
  this.ball.position.y = this.physicsBall.position.y;
  this.ball.rotation.z = this.physicsBall.angle;
  renderer.render(this.scene, this.camera);
};

GameState.prototype.update = function() {
  if(this.anchorPoint) {
    /* forceMultiplier: the bigger this is, the more force we apply to the ball when we push the arrow keys */
    const forceMultiplier = 0.00005;
    const p1 = this.anchorPoint;
    const p2 = this.physicsBall.position;
    const rotated = Matter.Vector.rotate({x: p2.x - p1.x, y: p2.y - p1.y}, Math.PI / 2);
    const normalised = Matter.Vector.normalise(rotated);
    if(KEYS[37]) {
      Matter.Body.applyForce(
        this.physicsBall,
        this.physicsBall.position,
        {x: -0.001, y: 0});
    }
    if(KEYS[39]) {
      Matter.Body.applyForce(
        this.physicsBall,
        this.physicsBall.position,
        {x: 0.001, y: 0});
    }
    if(KEYS[38]) {
      Matter.Body.applyForce(
        this.physicsBall,
        this.physicsBall.position,
        {x: 0, y: -0.001});
    }
    if(KEYS[40]) {
      Matter.Body.applyForce(
        this.physicsBall,
        this.physicsBall.position,
        {x: 0, y: 0.001});
    }
  } else {
    for(let anchor of this.anchors) {
      const distanceSquared = Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.physicsBall.position, anchor.position));
      if(distanceSquared < 10000) {
        console.log('mmatch!', distanceSquared);
        this.anchorPoint = anchor.body.position;
        var group = Matter.Body.nextGroup(true);
        this.currentRope = Matter.Composites.stack(0, 0, 5, 1, 1, 1, (x, y) => {
          return Matter.Bodies.rectangle(
            x, y, 2, 2, {collisionFilter: {group}});
        });

        Matter.Composites.chain(this.currentRope, 0.5, 0, -0.5, 0, { stiffness: 0.99, length: 1, render: { type: 'line' } });

        this.currentRopeConstraintAnchor = Matter.Constraint.create({
          bodyA: this.currentRope.bodies[0],
          bodyB: anchor.body,
          length: 0,
        });
        Matter.Composite.add(this.matterEngine.world,
                             this.currentRopeConstraintAnchor);
        Matter.World.add(this.matterEngine.world, this.currentRope);
        this.currentRopeConstraintBall = Matter.Constraint.create({
          bodyA: this.currentRope.bodies[this.currentRope.bodies.length-1],
          bodyB: this.physicsBall,
          length: 0,
        });
        Matter.Composite.add(this.matterEngine.world,
                             this.currentRopeConstraintBall)
        break;
      }
    }
  }

  for(let anchor of this.anchors) {
    if(anchor.body.position == this.anchorPoint) {
      anchor.material.color.setRGB(0, 255, 0);
    } else {
      anchor.material.color.setRGB(0, 0, 255);
    }
  }

  if(KEYS[32]) {
    Matter.Composite.remove(this.matterEngine.world,
                            this.currentRope);
    Matter.Composite.remove(this.matterEngine.world,
                            this.currentRopeConstraintAnchor);
    Matter.Composite.remove(this.matterEngine.world,
                            this.currentRopeConstraintBall);
    this.anchorPoint = undefined;
  }

  Matter.Engine.update(this.matterEngine);
};
