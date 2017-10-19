function Player(game, options) {
  this.options = options;
  this.game = game;
  this.mesh = new THREE.Mesh(
    new THREE.SphereGeometry(20, 1, 1),
    new THREE.MeshBasicMaterial({color: this.options.color}));
  this.body = Matter.Bodies.circle(
      0, 0, 10, { density: 0.004, frictionAir: 0.005});
  Matter.Body.setPosition(this.body, this.options.position);
  this.currentAnchor = undefined;
}

Player.prototype.render = function() {
  this.mesh.position.x = this.body.position.x;
  this.mesh.position.y = this.body.position.y;
  this.mesh.rotation.z = this.body.angle;
};

Player.prototype.update = function() {
  if(this.currentAnchor) {
    const forceMultiplier = 0.00005;
    const p1 = this.currentAnchor.position;
    const p2 = this.body.position;
    const rotated = Matter.Vector.rotate({
      x: p2.x - p1.x,
      y: p2.y - p1.y,
    }, Math.PI / 2);
    const normalised = Matter.Vector.normalise(rotated);
    if(KEYS[this.options.keys.left]) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: -0.001, y: 0});
    }
    if(KEYS[this.options.keys.right]) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: 0.001, y: 0});
    }
    if(KEYS[this.options.keys.up]) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: 0, y: -0.001});
    }
    if(KEYS[this.options.keys.down]) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: 0, y: 0.001});
    }

    const angle = Matter.Vector.angle(
        Matter.Vector.sub(
          this.currentAnchor.position,
          this.body.position),
        {x: 1, y: 0});
    this.grabRotationPrevious = this.grabRotationAmount;
    let angleDelta = angle - (this.grabRotationPrevious % (Math.PI * 2));
    if(angleDelta > Math.PI + 0.0000001) {
      angleDelta -= Math.PI * 2;
    }
    if(angleDelta < -Math.PI - 0.00000001) {
      angleDelta += Math.PI * 2;
    }
    this.grabRotationAmount += angleDelta;
    this.currentAnchor.capturePercentage = Math.abs(this.grabRotationAmount) / Math.PI / 2;
    if(this.currentAnchor.capturePercentage >= 1) {
      this.currentAnchor.owner = this;
    }
  } else {
    for(let anchor of this.game.anchors) {
      const distanceSquared = Matter.Vector.magnitudeSquared(
          Matter.Vector.sub(
            this.body.position,
            anchor.position));
      if(distanceSquared < 10000) {
        this.currentAnchor = anchor;
        const angle = Matter.Vector.angle(
            Matter.Vector.sub(
              anchor.body.position,
              this.body.position),
            {x: 1, y: 0});
        this.grabRotationPrevious = angle;
        this.grabRotationAmount = 0;
        var group = Matter.Body.nextGroup(true);
        this.currentRope = Matter.Composites.stack(0, 0, 5, 1, 1, 1, (x, y) => {
          return Matter.Bodies.rectangle(
            x, y, 2, 2, {collisionFilter: {group}});
        });

        Matter.Composites.chain(
            this.currentRope, 0.5, 0, -0.5, 0, {
              stiffness: 0.99999,
              length: 1,
              render: {
                type: 'line'
            }});

        this.currentRopeConstraintAnchor = Matter.Constraint.create({
          bodyA: this.currentRope.bodies[0],
          bodyB: anchor.body,
          length: 0,
        });
        Matter.Composite.add(this.game.matterEngine.world,
                             this.currentRopeConstraintAnchor);
        Matter.World.add(this.game.matterEngine.world, this.currentRope);
        this.currentRopeConstraintBall = Matter.Constraint.create({
          bodyA: this.currentRope.bodies[this.currentRope.bodies.length-1],
          bodyB: this.body,
          length: 0,
        });
        Matter.Composite.add(this.game.matterEngine.world,
                             this.currentRopeConstraintBall)
        break;
      }
    }
    }
    if(KEYS[this.options.keys.jump]) {
      Matter.Composite.remove(this.game.matterEngine.world,
                              this.currentRope);
      Matter.Composite.remove(this.game.matterEngine.world,
                              this.currentRopeConstraintAnchor);
      Matter.Composite.remove(this.game.matterEngine.world,
                              this.currentRopeConstraintBall);
      this.currentAnchor = undefined;
  }
};
