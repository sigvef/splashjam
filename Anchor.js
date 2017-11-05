function Anchor(game, position) {
  this.game = game;
  this.goal = false;
  this.mesh = new THREE.Object3D();
  this.mesh.rotation.x = Math.PI / 2;
  this.mesh.position.x = position.x;
  this.mesh.position.y = position.y;
  this.game.scene.add(this.mesh);
  this.body = Matter.Bodies.circle(
    this.mesh.position.x,
    this.mesh.position.y,
    45,
    {isStatic: true});
  this.owner = 'neutral';
  this.body.restitution = 1;
  Matter.World.add(this.game.matterEngine.world, this.body);
}

Anchor.prototype.removeAsGoal = function() {
  this.goal = false;
  this.mesh.remove(this.GoldenSymbolModel);
  if(this.GoldenSymbolModel) {
    this.GoldenSymbolModel.targetStartPosition.copy(this.GoldenSymbolModel.position);
    this.GoldenSymbolModel.targetPosition.y = 0;
    this.GoldenSymbolModel.targetPosition.tStart = +new Date();
    this.GoldenSymbolModel.targetPosition.tLength = 200;
  }
};

Anchor.prototype.setAsGoal = function() {
  this.goal = true;
  this.mesh.add(this.GoldenSymbolModel);
  if(this.GoldenSymbolModel) {
    this.GoldenSymbolModel.targetStartPosition.copy(this.GoldenSymbolModel.position);
    this.GoldenSymbolModel.targetPosition.y = -75;
    this.GoldenSymbolModel.targetPosition.tStart = +new Date();
    this.GoldenSymbolModel.targetPosition.tLength = 200;
  }
};

Anchor.prototype.render = function() {
  if(this.goal && this.Hexagon1Model) {
    this.Hexagon1Model.material.emissiveIntensityTarget = 10;
    this.game.goalLight.position.copy(this.mesh.position);
  } else if (this.Hexagon1Model) {
    this.Hexagon1Model.material.emissiveIntensityTarget = 0;
  }
  if(this.goal && this.Hexagon2Model) {
    this.Hexagon2Model.material.emissiveIntensityTarget = 10;
  } else if (this.Hexagon1Model) {
    this.Hexagon2Model.material.emissiveIntensityTarget = 0;
  }
  if(this.goal && this.GoldenSymbolModel) {
    this.GoldenSymbolModel.material.emissiveIntensityTarget = 3;
  } else if (this.GoldenSymbolModel) {
    this.GoldenSymbolModel.material.emissiveIntensityTarget = 0;
  }

  if(this.Hexagon1Model) {
    this.Hexagon1Model.material.emissiveIntensity = (
        this.Hexagon1Model.material.emissiveIntensity * 0.95 + this.Hexagon1Model.material.emissiveIntensityTarget * 0.05);
    this.Hexagon1Model.material.color = new THREE.Color(
        lerp(this.Hexagon1Model.material.originalColorA.r,
             this.Hexagon1Model.material.originalColorB.r,
             this.Hexagon1Model.material.emissiveIntensity),
        lerp(this.Hexagon1Model.material.originalColorA.g,
             this.Hexagon1Model.material.originalColorB.g,
             this.Hexagon1Model.material.emissiveIntensity),
        lerp(this.Hexagon1Model.material.originalColorA.b,
             this.Hexagon1Model.material.originalColorB.b,
             this.Hexagon1Model.material.emissiveIntensity));
  }
  if(this.Hexagon2Model) {
    this.Hexagon2Model.material.emissiveIntensity = (
        this.Hexagon2Model.material.emissiveIntensity * 0.95 + this.Hexagon2Model.material.emissiveIntensityTarget * 0.05);
    this.Hexagon2Model.material.color = new THREE.Color(
        lerp(this.Hexagon2Model.material.originalColorA.r,
             this.Hexagon2Model.material.originalColorB.r,
             this.Hexagon2Model.material.emissiveIntensity),
        lerp(this.Hexagon2Model.material.originalColorA.g,
             this.Hexagon2Model.material.originalColorB.g,
             this.Hexagon2Model.material.emissiveIntensity),
        lerp(this.Hexagon2Model.material.originalColorA.b,
             this.Hexagon2Model.material.originalColorB.b,
             this.Hexagon2Model.material.emissiveIntensity));
  }
  if(this.GoldenSymbolModel) {
    this.GoldenSymbolModel.material.emissiveIntensity = (
        this.GoldenSymbolModel.material.emissiveIntensity * 0.95 + this.GoldenSymbolModel.material.emissiveIntensityTarget * 0.05);
  }
};

Anchor.prototype.update = function() {
  if(this.goal) {
    goalAnchor = this;
    const angle = Math.random() * Math.PI * 2;
    const dx = Math.sin(angle) * 20;
    const dy = Math.cos(angle) * 20;
    if(this.GoldenSymbolModel) {
      /* z and y are swapped since GoldenSymbolModel is rotated inside mesh */
      this.game.goalParticleSystem.spawn({
        x: this.mesh.position.x + this.GoldenSymbolModel.position.x + dx,
        y: this.mesh.position.y + this.GoldenSymbolModel.position.z + dy,
        z: this.mesh.position.z + this.GoldenSymbolModel.position.y
      }, {
        x: 0,
        y: 0,
        z: 10
      });
    }
  }

  if(!this.GoldenSymbolModel && GameState.GoldenSymbolModel) {
    const model = GameState.GoldenSymbolModel.clone();
    this.GoldenSymbolModel = model;
    this.GoldenSymbolModel.targetStartPosition = this.GoldenSymbolModel.position.clone();
    this.GoldenSymbolModel.targetPosition = this.GoldenSymbolModel.position.clone();
    this.GoldenSymbolModel.targetPosition.tStart = +new Date();
    this.GoldenSymbolModel.targetPosition.tLength = 1;
    this.GoldenSymbolModel.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });
        obj.material.emissiveIntensityTarget = 0;
        obj.material.emissiveIntensity = 0;
        this.GoldenSymbolModel.material = obj.material;
      }
    });
    this.mesh.add(model);
  }
  if(!this.Hexagon1Model && GameState.Hexagon1Model) {
    const model = GameState.Hexagon1Model.clone();
    this.Hexagon1Model = model;
    this.Hexagon1Model.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: color,
        });
        obj.material.originalColorA = new THREE.Color(0x888888);
        obj.material.originalColorB = new THREE.Color(0xA02DD2);
        obj.material.emissiveIntensityTarget = 0;
        obj.material.emissiveIntensity = 0;
        this.Hexagon1Model.material = obj.material;
      }
    });
    this.mesh.add(model);
  }
  if(!this.Hexagon2Model && GameState.Hexagon2Model) {
    const model = GameState.Hexagon2Model.clone();
    this.Hexagon2Model = model;
    this.Hexagon2Model.traverse(obj => {
      if(obj.material) {
        const color = obj.material.color;
        obj.material = new THREE.MeshBasicMaterial({
          color: color,
        });
        obj.material.originalColorA = new THREE.Color(0x888888);
        obj.material.originalColorB = new THREE.Color(0xff44ff);
        obj.material.emissiveIntensityTarget = 0;
        obj.material.emissiveIntensity = 0;
        this.Hexagon2Model.material = obj.material;
      }
    });
    this.mesh.add(model);
  }

  if(this.GoldenSymbolModel) {
    const step = (+new Date() - this.GoldenSymbolModel.targetPosition.tStart) / this.GoldenSymbolModel.targetPosition.tLength;
    this.GoldenSymbolModel.position.x = smoothstep(this.GoldenSymbolModel.targetStartPosition.x, this.GoldenSymbolModel.targetPosition.x, step);
    this.GoldenSymbolModel.position.y = smoothstep(this.GoldenSymbolModel.targetStartPosition.y, this.GoldenSymbolModel.targetPosition.y, step);
    this.GoldenSymbolModel.position.z = smoothstep(this.GoldenSymbolModel.targetStartPosition.z, this.GoldenSymbolModel.targetPosition.z, step);
  }

  if(this.Hexagon1Model) {
    //anchor.Hexagon1Model.rotation.y += 0.01;
    if(this.goal) {
      this.Hexagon1Model.rotation.y += 0.02;
    }
  }
  if(this.Hexagon2Model) {
    this.Hexagon2Model.scale.set(0.0001, 0.0001, 0.0001);
    if(this.goal) {
      this.Hexagon2Model.rotation.y -= 0.02;
    this.Hexagon2Model.scale.set(17.5, 17.5, 17.5);
    }
  }
  if(this.GoldenSymbolModel) {
    if(this.goal) {
      this.GoldenSymbolModel.rotation.y =  0.2 * PULSE;
    }
    this.GoldenSymbolModel.rotation.x =  0.2 * Math.sin(+new Date() /500);
    this.GoldenSymbolModel.rotation.z =  0.2 * Math.cos(+new Date() /500);
  }
};
