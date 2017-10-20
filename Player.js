function Player(game, options) {
  this.options = options;
  this.game = game;
  this.innerModel = undefined;
  this.outerModel = undefined;
  this.respawnFlag = false;
  this.lightningMaterial = makeLightningMaterial();
  this.body = Matter.Bodies.circle(
      0, 0, 10, { density: 0.004, frictionAir: 0.005});
  Matter.Body.setPosition(this.body, this.options.position);
  this.currentAnchor = undefined;
  this.ropeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 100, 0.001),
    this.lightningMaterial);

  this.mesh = new THREE.Object3D();
  this.mesh.rotation.x = Math.PI / 2;
  this.game.scene.add(this.mesh);

  const color = new THREE.Color(this.options.color);
  this.lightningMaterial.uniforms.r.value = color.r;
  this.lightningMaterial.uniforms.g.value = color.g;
  this.lightningMaterial.uniforms.b.value = color.b;

  this.particleSystem = new ParticleSystem(this.game, {
    color: new THREE.Color(this.options.color),
  });

  this.pointLight = new THREE.PointLight(this.options.color);
  this.game.scene.add(this.pointLight);
}

Player.prototype.render = function() {
  this.particleSystem.render();
  this.mesh.position.x = this.body.position.x;
  this.mesh.position.y = this.body.position.y;
  this.mesh.rotation.y = this.body.angle;
  this.pointLight.position.copy(this.mesh.position);
};

Player.prototype.updateScore = function() {
  /*
  let numCapturedAnchors = 0;
  for(let anchor of this.game.anchors) {
    if (anchor.owner === this) {
      numCapturedAnchors++;
    }
  }
  this.score += numCapturedAnchors / FPS;
  */
};

Player.prototype.updateRope = function() {
  const angle = Matter.Vector.angle(
      Matter.Vector.sub(
        this.currentAnchor.body.position,
        this.body.position),
      {x: 1, y: 0});
  const midpoint = Matter.Vector.mult(
    Matter.Vector.sub(this.currentAnchor.body.position,
                      this.body.position),
    0.5);
  const ropePosition = Matter.Vector.add(midpoint, this.body.position);
  const length = Matter.Vector.magnitude(midpoint) * 1.5;
  this.lightningMaterial.uniforms.time.value += 1 / 60 * length / 128;
  this.lightningMaterial.uniforms.intensity.value = 1;
  this.lightningMaterial.uniforms.length.value = length;
  this.ropeMesh.scale.set(length, 1, 1);
  this.ropeMesh.position.x = ropePosition.x;
  this.ropeMesh.position.y = ropePosition.y;
  this.ropeMesh.rotation.z = angle + (Math.random() - 0.5) * 0.2;
};

Player.prototype.update = function() {
  if(!this.innerModel && Player.innerModel) {
    this.innerModel = Player.innerModel.clone();
    this.innerModel.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(this.options.color),
          emissive: new THREE.Color(this.options.color),
          emissiveIntensity: 1,
        });
      }
    });
    this.mesh.add(this.innerModel);
  }
  if(!this.outerModel && Player.outerModel) {
    this.outerModel = Player.outerModel.clone();
    this.outerModel.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: color,
        });
      }
    });
    this.mesh.add(this.outerModel);
  }
  for(let i = 0; i < Math.pow(this.game.scores[this.options.id], 2); i++) {
    const angle = Math.random() * Math.PI * 2;
    const amplitude = Math.random() * .2;
    const dx = Math.cos(angle) * amplitude;
    const dy = Math.sin(angle) * amplitude;
    this.particleSystem.spawn({
      x: this.body.position.x + dx - this.body.velocity.x * Math.random(),
      y: this.body.position.y + dy - this.body.velocity.y * Math.random(),
      z: 0,
    }, {
      x: dx,
      y: dy,
      z: 0,
    });
  }
  this.particleSystem.update();
  if(KEYS[this.options.keys.respawn] && !this.respawnFlag) {
    this.respawnFlag = true;
    Matter.Body.setPosition(this.body, this.options.position);
    Matter.Body.setVelocity(this.body, {x: 0, y: 0});
    Matter.Body.setAngle(this.body, 0);
    Matter.Body.setAngularVelocity(this.body, 0);
    this.game.scores[this.options.id] = Math.max(0, this.game.scores[this.options.id] - 1);
    this.disconnectRope();
  }
  if(!KEYS[this.options.keys.respawn]) {
    this.respawnFlag = false;
  }
  if(this.currentAnchor) {
    const forceMultiplier = 0.00005;
    const p1 = this.currentAnchor.body.position;
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
          this.currentAnchor.body.position,
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
    this.updateRope();
  } else {
    for(let anchor of [...this.game.anchors, this.game.player1, this.game.player2]) {
      if(this == anchor) {
        continue;
      }
      const distanceSquared = Matter.Vector.magnitudeSquared(
          Matter.Vector.sub(
            this.body.position,
            anchor.body.position));
      if(distanceSquared < 12000) {
        this.currentAnchor = anchor;
        if(this.currentAnchor.goal) {
          this.game.score(this.options.id);
        }
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
                             this.currentRopeConstraintBall);
        this.game.scene.add(this.ropeMesh);
        this.updateRope();
        break;
      }
    }
  }
  if(KEYS[this.options.keys.jump]) {
    this.disconnectRope();
  }
  this.updateScore();
};

Player.prototype.disconnectRope = function() {
    Matter.Composite.remove(this.game.matterEngine.world,
                            this.currentRope);
    Matter.Composite.remove(this.game.matterEngine.world,
                            this.currentRopeConstraintAnchor);
    Matter.Composite.remove(this.game.matterEngine.world,
                            this.currentRopeConstraintBall);
    this.currentAnchor = undefined;
    this.game.scene.remove(this.ropeMesh);
};

var manager = new THREE.LoadingManager();
const mixers = [];
const loader = new THREE.FBXLoader( manager );
loader.load( 'playerBall.fbx', object => {
  Player.outerModel = object;
  object.scale.set(10, 10, 10);
}, () => {console.log('progress')}, () => {console.log('onerror')});

loader.load( 'PlayerColor.fbx', object => {
  Player.innerModel = object;
  object.scale.set(10, 10, 10);
}, () => {console.log('progress')}, () => {console.log('onerror')});
