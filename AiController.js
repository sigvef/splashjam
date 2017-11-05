function AiController(player) {
  this.player = player;
  this.controls = {
    up: null,
    right: null,
    down: null,
    left: null,
    jump: null
  };

  // TODO: for neuroevolution
  this.featureIndexes = {
    isAttached: 0,
    positiveDx: 1,
    negativeDx: 2,
    positiveDy: 3,
    negativeDy: 4,
    timeSin: 5,
    timeCos: 6
  };
  this.numFeatures = Object.keys(this.featureIndexes).length;
  this.features = new Array(this.numFeatures).fill(0);
  this.fitness = 0;
}

AiController.prototype.calculateFeatures = function() {
  // TODO: for neuroevolution
  let velocity = this.player.body.velocity;
  this.features[this.featureIndexes.positiveDx] = Math.log(Math.max(velocity.x, 0) + 1);
  this.features[this.featureIndexes.negativeDx] = Math.log(Math.min(velocity.x, 0) + 1);
  this.features[this.featureIndexes.positiveDy] = Math.log(Math.max(velocity.y, 0) + 1);
  this.features[this.featureIndexes.negativeDy] = Math.log(Math.min(velocity.y, 0) + 1);
  this.features[this.featureIndexes.isAttached] = !!this.player.currentAnchor ? 1 : 0;
  this.features[this.featureIndexes.timeSin] = Math.sin(Math.PI * 2 * t / 1000);
  this.features[this.featureIndexes.timeCos] = Math.cos(Math.PI * 2 * t / 1000);
};

AiController.prototype.update = function() {
  //this.calculateFeatures();
  //this.fitness += this.player.body.speed / 100000;
  this.controls.jump = false;
  this.controls.left = Math.sin(+new Date() * 1.2 * Math.PI / 1000) > 0;
  this.controls.right = Math.sin(+new Date() * 1.2 * Math.PI / 1000) < 0;
  this.controls.up = Math.cos(+new Date() * 1.2 * Math.PI / 1000) < 0;
  this.controls.down = Math.cos(+new Date() * 1.2 * Math.PI / 1000) > 0;

  if (this.player.currentAnchor) {
    let currentAnchorDistanceToGoal = Matter.Vector.magnitudeSquared(
      Matter.Vector.sub(
        this.player.currentAnchor.body.position,
        this.player.game.currentGoal.body.position
      )
    );
    for (let anchor of [...this.player.game.anchors]) {
      if (anchor.active === false) {
        continue;
      }
      if (this.player === anchor) {
        continue;
      }
      if (this.player.currentAnchor === anchor) {
        continue;
      }
      const distanceSquared = Matter.Vector.magnitudeSquared(
        Matter.Vector.sub(
          this.player.body.position,
          anchor.body.position)
      );
      if(distanceSquared < 16000) {
        let otherAnchorDistanceToGoal = Matter.Vector.magnitudeSquared(
          Matter.Vector.sub(
            anchor.body.position,
            this.player.game.currentGoal.body.position
          )
        );
        if (otherAnchorDistanceToGoal < currentAnchorDistanceToGoal) {
          this.controls.jump = true;
          break;
        }
      }
    }
  }
};
