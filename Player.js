function Player(game, options) {
  let that = this;

  this.options = options;
  this.active = false;
  this.game = game;
  this.spinster = 0;
  this.innerModel = undefined;
  this.outerModel = undefined;
  this.lightningMaterial = makeLightningMaterial();
  this.body = Matter.Bodies.circle(
      0, 0, 10, { density: 0.004, frictionAir: 0.005});
  this.body.restitution = 1;
  Matter.Body.setPosition(this.body, this.options.position);
  this.currentAnchor = undefined;
  this.lastAnchor = null;
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

  that.pendingReleaseSound = null;
  that.respawnSound = null;
  this.playReleaseSound = function() {
    if (that.pendingReleaseSound !== null) {
      clearTimeout(that.pendingReleaseSound);
    }
    // debounce the sound, so it doesn't play too often
    this.pendingReleaseSound = setTimeout(function() {
      that.releaseSound = SoundManager.playSound('release');
      that.pendingReleaseSound = null;
    }, 30);
  };

  this.playConnectSound = function(isGoal = false) {
    if (that.pendingReleaseSound) {
      clearTimeout(that.pendingReleaseSound);
    } else if (that.releaseSound && that.releaseSound.playState === createjs.Sound.PLAY_SUCCEEDED) {
      this.releaseSound.stop();  // interrupt playing sound
    }
    if (!isGoal && this.lastAnchor !== this.currentAnchor) {
      SoundManager.playSound('grab');
    }
  };

  this.playRespawnSound = function() {
    SoundManager.playSound('respawn');
  }.throttle(300, that);
}

Player.prototype.reset = function() {
  this.particleSystem.particles.position.z = 0;
};

Player.prototype.deactivate = function() {
  this.active = false;
  Matter.World.remove(this.game.matterEngine.world, this.body);
};

function styleFromColor(color, alpha) {
  const threeColor = new THREE.Color(color);
  const style = `rgba(${threeColor.r * 255 | 0}, ${threeColor.g * 255 | 0}, ${threeColor.b * 255 | 0}, ${alpha}`;
  return style;
}

Player.prototype.renderHUD = function(ctx, up, rightAlign) {
  if(!this.active) {
    ctx.save();   
    ctx.font = '20pt monospace';
    ctx.fillStyle = styleFromColor(this.options.color, 0.1);
    ctx.textAlign = rightAlign ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('[Press any button to join]', 1920 / 2 + (rightAlign ?  -120 : 120), up ? 60 : 1080 - 60);
    ctx.restore();
  } else {
    ctx.save();
    ctx.font = '16pt monospace';
    ctx.fillStyle = styleFromColor(this.options.color, 0.2);
    ctx.textAlign = rightAlign ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.controls.name, (!rightAlign ?  1920 - 30 : 30), up ? 30 : 1080 - 30);
    ctx.lineWidth = 4;
    for(let i = 0; i < 5; i++) {
      ctx.beginPath();
      const x = 1920 / 2 + (i-4.5) * 100 * (rightAlign ? 1 : -1);
      const y = up ? 60 : 1080 - 60;
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      if(this.active) {
        const color = new THREE.Color(this.options.color);
        const style = `rgba(${color.r * 255 | 0}, ${color.g * 255 | 0}, ${color.b * 255 | 0}, 0.5`;
        ctx.strokeStyle = style;
        ctx.stroke();
        if(i - this.game.scores[this.options.id] < 0) {
          ctx.fillStyle = `rgba(${2 * color.r * 255 | 0}, ${2 * color.g * 255 | 0}, ${2 * color.b * 255 | 0}, 0.8)`;
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
};

Player.prototype.activate = function(controls) {
  this.controls = controls;
  this.active = true;
  Matter.World.add(this.game.matterEngine.world, this.body);
  this.mesh.visible = true;
  this.particleSystem.particles.visible = true;
  this.ropeMesh.visible = true;

  for(let i = 0; i < 1000; i++) {
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

  if(this.outerModel) {
    this.outerModel.material.emissiveIntensity = 0;
  }
  if(this.game.scores[this.options.id] === 4) {
    this.outerModel.material.emissiveIntensity = 1 + Math.sin(+new Date());
  }
};

Player.prototype.render = function() {
  if(!this.active) {
    return;
  }
  this.ropeMesh.visible = true;
  this.particleSystem.particles.position.x = 0;
  this.particleSystem.particles.position.y = 0;
  this.particleSystem.render();
  this.mesh.position.x = this.body.position.x;
  this.mesh.position.y = this.body.position.y;
  this.mesh.position.z = 0;
  this.mesh.rotation.y = this.body.angle;
  this.pointLight.position.copy(this.mesh.position);
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

Player.prototype.respawn = function() {
  if(this.active) {
    gtag('event', 'respawn', {
      player_id: this.options.id,
      scores: this.game.scores,
      controls: this.controls.name,
    });
  }
  Matter.Body.setPosition(this.body, this.options.position);
  Matter.Body.setVelocity(this.body, {x: 0, y: 0});
  Matter.Body.setAngle(this.body, 0);
  Matter.Body.setAngularVelocity(this.body, 0);
  this.mesh.rotation.set(Math.PI / 2, 0, 0);
  this.game.scores[this.options.id] = Math.max(0, this.game.scores[this.options.id] - 1);
  this.disconnectRope();
  for (let player of this.game.players) {
    if (player.currentAnchor === this) {
      player.disconnectRope();
    }
  }
  this.playRespawnSound();
};

Player.prototype.update = function() {
  if(!this.active) {
    return;
  }
  if(!this.innerModel && Player.innerModel) {
    this.innerModel = Player.innerModel.clone();
    this.innerModel.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshStandardMaterial({
          color: 0,
          emissive: new THREE.Color(this.options.color),
          emissiveIntensity: 1,
        });
        this.innerModel.material = obj.material;
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
          roughnessMap: THREE.ImageUtils.loadTexture('res/metal.jpg'),
          emissive: 0xffffff,
          emissiveIntensity: 0,
        });
        this.outerModel.material = obj.material;
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
  this.innerModel.material.emissiveIntensity = BEATPULSE * 2;
  this.pointLight.intensity = 0.75 + BEATPULSE * 0.25;

  let joycon = navigator.getGamepads()[JOYCONS[this.controls.joycon.id]];
  if(!joycon) {
    joycon = {
      axes: 'something long that is subscriptable',
      buttons: 'something long that is subscriptable',
    };
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

    if(KEYS[this.controls.keyboard.left] || joycon.axes[9] == this.controls.joycon.left || joycon.axes[9] == this.controls.joycon.upleft || joycon.axes[9] == this.controls.joycon.downleft) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: -0.001, y: 0});
    }
    if(KEYS[this.controls.keyboard.right] || joycon.axes[9] == this.controls.joycon.right || joycon.axes[9] == this.controls.joycon.upright || joycon.axes[9] == this.controls.joycon.downright) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: 0.001, y: 0});
    }
    if(KEYS[this.controls.keyboard.up] || joycon.axes[9] == this.controls.joycon.up || joycon.axes[9] == this.controls.joycon.upleft || joycon.axes[9] == this.controls.joycon.upright) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        {x: 0, y: -0.0012});
    }
    if(KEYS[this.controls.keyboard.down] || joycon.axes[9] == this.controls.joycon.down || joycon.axes[9] == this.controls.joycon.downleft || joycon.axes[9] == this.controls.joycon.downright) {
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
    for(let anchor of [...this.game.anchors, ...this.game.players]) {
      if(anchor.active === false) {
        continue; 
      }
      if(this == anchor) {
        continue;
      }
      const distanceSquared = Matter.Vector.magnitudeSquared(
          Matter.Vector.sub(
            this.body.position,
            anchor.body.position));
      if(distanceSquared < 16000) {
        this.currentAnchor = anchor;

        this.playConnectSound(this.currentAnchor.goal);
        if(this.currentAnchor.goal) {
          this.game.score(this.options.id);
          this.spinster = Math.PI * 3;
        }
        this.lastAnchor = this.currentAnchor;
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
  this.spinster *= 0.9;
  this.mesh.rotation.z = this.spinster;
  if(KEYS[this.controls.keyboard.jump] || (joycon.buttons[this.controls.joycon.jump] && joycon.buttons[this.controls.joycon.jump].pressed)) {
    this.disconnectRope();
  }

  if(!this.currentAnchor) {
    if(this.body.position.x < -1600 || this.body.position.x > 1600 || this.body.position.y < -2000 || this.body.position.y > 1500) {
      this.respawn();
    }
  } else if (this.body.position .y < -3000 || this.body.position.y > 2000) {
    this.respawn();
  }
};

Player.prototype.disconnectRope = function() {
  if(!this.currentAnchor) {
    return;
  }
  Matter.Composite.remove(this.game.matterEngine.world,
                          this.currentRope);
  Matter.Composite.remove(this.game.matterEngine.world,
                          this.currentRopeConstraintAnchor);
  Matter.Composite.remove(this.game.matterEngine.world,
                          this.currentRopeConstraintBall);
  this.currentAnchor = undefined;
  this.game.scene.remove(this.ropeMesh);
  this.playReleaseSound();
};

var manager = new THREE.LoadingManager();
const mixers = [];
const loader = new THREE.FBXLoader( manager );
loader.load('res/playerBall.fbx', object => {
  Player.outerModel = object;
  object.scale.set(10, 10, 10);
}, () => {console.log('progress')}, () => {console.log('onerror')});

loader.load('res/PlayerColor.fbx', object => {
  Player.innerModel = object;
  object.scale.set(10, 10, 10);
}, () => {console.log('progress')}, () => {console.log('onerror')});
