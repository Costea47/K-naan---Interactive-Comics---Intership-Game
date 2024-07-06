/**
 * Base class for all game scenes
 */
class BaseScene extends Phaser.Scene {
  constructor(key) {
    super(key);
    this.geeky = null;
    this.cursors = null;
    this.gamepad = null;
    this.ambientMusic = null;
    this.redMeterBar = null;
    this.blueMeterBar = null;
    this.greenMeterBar = null;
    this.cloudParticles = null;
    this.backdropBounds = null;
    this.skeletonKey = null;
    this.skeletonKeyTween = null;
    this.keyClink = null;
    this.isSprinting = false;
    this.normalSpeed = 160;
    this.sprintSpeed = 320;
    this.greenMeterDepletionRate = 1;
    this.greenMeterRechargeRate = 1.5;
    this.bullets = null;
    this.lastShotTime = 0;
    this.shotDelay = 500;
  }

  init(data) {
    this.gameState = data.gameState || {
      redMeterValue: 100,
      blueMeterValue: 100,
      greenMeterValue: 100,
    };
  }

  preload() {
    this.load.audio(
      "keyClink",
      "https://play.rosebud.ai/assets/keyClink.wav?QiZj"
    );
  }

  create() {
    this.createKeyClink();
    this.setupGamepad();
    this.createKeyboardInputs();
  }

  setupGamepad() {
    this.input.gamepad.on(
      "connected",
      (pad) => {
        console.log("Gamepad connected:", pad);
        this.handleGamepadConnect(pad);
      },
      this
    );

    this.input.gamepad.on(
      "disconnected",
      (pad) => {
        console.log("Gamepad disconnected:", pad);
        this.handleGamepadDisconnect();
      },
      this
    );

    // Check if a gamepad is already connected
    const pads = this.input.gamepad.gamepads;
    if (pads.length > 0) {
      this.handleGamepadConnect(pads[0]);
    } else {
      this.gamepad = null;
    }
  }

  handleGamepadConnect(pad) {
    this.gamepad = pad;
  }

  handleGamepadDisconnect() {
    this.gamepad = null;
  }

  createAmbientMusic(key) {
    this.stopAmbientMusic();
    this.ambientMusic = this.sound.add(key, { volume: 0.01, loop: true });
    this.ambientMusic.play();
  }

  stopAmbientMusic() {
    if (this.ambientMusic) {
      this.ambientMusic.stop();
      this.ambientMusic = null;
    }
  }

  createBackground(backdropKey, sceneImageKey) {
    const backdrop = this.add.image(300, 900, backdropKey);
    this.add.image(400, 325, sceneImageKey).setScale(1.9);
    this.backdropBounds = new Phaser.Geom.Rectangle(
      backdrop.x - backdrop.width / 2,
      backdrop.y - backdrop.height / 2,
      backdrop.width,
      backdrop.height
    );
  }

  createGeeky(x, y) {
    this.geeky = this.physics.add.sprite(x, y, "geeky");
    this.geeky.setScale(0.13);
    this.geeky.setCollideWorldBounds(true);
    this.geeky.body.setSize(this.geeky.width * 0.5, this.geeky.height * 0.85);
    this.geeky.depth = 1;
  }

  createKeyboardInputs() {
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shootUp: Phaser.Input.Keyboard.KeyCodes.UP,
      shootDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      shootLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      shootRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      sprint: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  createMeterBars() {
    this.redMeterBar = this.add.graphics();
    this.blueMeterBar = this.add.graphics();
    this.greenMeterBar = this.add.graphics();
    this.updateMeterBars();
  }

  createCloudParticles() {
    this.cloudParticles = this.add.particles("cloud");
    this.cloudParticles.createEmitter({
      follow: this.geeky,
      speed: { min: 0, max: 20 },
      angle: { min: 0, max: 230 },
      scale: { start: 0.07, end: 0 },
      blendMode: "NORMAL",
      lifespan: 3000,
      frequency: 100,
      depth: 0,
    });
  }

  reduceRedMeter() {
    this.gameState.redMeterValue -= 33.33;
    this.gameState.redMeterValue = Math.max(0, this.gameState.redMeterValue);
    this.updateMeterBars();

    if (this.gameState.redMeterValue <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.scene.start("GameOverScene");
  }

  updateMeterBars() {
    this.redMeterBar
      .clear()
      .fillStyle(0xcb2424, 1)
      .fillRect(50, 1100, (this.gameState.redMeterValue / 100) * 200, 30);
    this.blueMeterBar
      .clear()
      .fillStyle(0x6fa2d0, 1)
      .fillRect(300, 1100, (this.gameState.blueMeterValue / 100) * 200, 30);
    this.greenMeterBar
      .clear()
      .fillStyle(0xb2d4b6, 1)
      .fillRect(550, 1100, (this.gameState.greenMeterValue / 100) * 200, 30);
  }

  createSkeletonKey() {
    this.skeletonKey = this.physics.add.sprite(-100, -100, "skeletonKey");
    this.skeletonKey.setScale(0.05);
    this.skeletonKey.body.setCollideWorldBounds(true);
    this.physics.add.overlap(
      this.geeky,
      this.skeletonKey,
      this.handleSkeletonKeyCollision,
      null,
      this
    );
  }

  handleSkeletonKeyCollision(geeky, skeletonKey) {
    console.log("Skeleton key collected");
  }

  createKeyClink() {
    this.keyClink = this.sound.add("keyClink", { volume: 0.2 });
  }

  dropSkeletonKey() {
    this.skeletonKey.setPosition(Phaser.Math.Between(100, 700), -100);
    this.skeletonKeyTween = this.tweens.add({
      targets: this.skeletonKey,
      y: this.backdropBounds.bottom + 50,
      duration: 2000,
      ease: "Linear",
      onComplete: () => {
        this.skeletonKey.setVelocity(0, 0);
        this.keyClink.play();
      },
    });
  }

  handlePlayerMovement() {
    if (!this.geeky) return;

    const speed =
      this.isSprinting && this.gameState.greenMeterValue > 0
        ? this.sprintSpeed
        : this.normalSpeed;

    let moveX = 0;
    let moveY = 0;

    // Keyboard input
    if (this.cursors.left.isDown) moveX -= 1;
    if (this.cursors.right.isDown) moveX += 1;
    if (this.cursors.up.isDown) moveY -= 1;
    if (this.cursors.down.isDown) moveY += 1;

    // Gamepad input
    if (this.gamepad) {
      const leftStickX = this.gamepad.leftStick.x;
      const leftStickY = this.gamepad.leftStick.y;
      const deadzone = 0.1;

      if (Math.abs(leftStickX) > deadzone) moveX += leftStickX;
      if (Math.abs(leftStickY) > deadzone) moveY += leftStickY;
    }

    // Normalize and scale the movement vector
    if (moveX !== 0 || moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX = (moveX / length) * speed;
      moveY = (moveY / length) * speed;
    }

    this.geeky.setVelocity(moveX, moveY);

    if (moveX < 0) this.geeky.setFlipX(true);
    else if (moveX > 0) this.geeky.setFlipX(false);

    // Handle sprinting
    const isSprinting =
      this.cursors.sprint.isDown || (this.gamepad && this.gamepad.B);
    if (isSprinting && this.gameState.greenMeterValue > 0) {
      this.isSprinting = true;
      this.gameState.greenMeterValue = Math.max(
        0,
        this.gameState.greenMeterValue - this.greenMeterDepletionRate
      );
    } else {
      this.isSprinting = false;
      if (this.gameState.greenMeterValue < 100) {
        this.gameState.greenMeterValue = Math.min(
          100,
          this.gameState.greenMeterValue + this.greenMeterRechargeRate
        );
      }
    }

    this.updateMeterBars();
  }

  update(time, delta) {
    this.handlePlayerMovement();

    if (this.geeky && this.backdropBounds) {
      this.geeky.x = Phaser.Math.Clamp(
        this.geeky.x,
        this.backdropBounds.left,
        this.backdropBounds.right
      );
      this.geeky.y = Phaser.Math.Clamp(
        this.geeky.y,
        this.backdropBounds.top,
        this.backdropBounds.bottom
      );
    }

    if (this.skeletonKey && this.backdropBounds) {
      if (this.skeletonKey.y > this.backdropBounds.bottom) {
        this.skeletonKey.y = this.backdropBounds.bottom;
      }
    }
  }

  shoot(directionX, directionY) {
    if (this.bullets && this.gameState.blueMeterValue > 0) {
      const bullet = this.bullets.get(this.geeky.x, this.geeky.y);
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.5);
        bullet.body.reset(this.geeky.x, this.geeky.y);

        const speed = 300;
        const angle = Math.atan2(directionY, directionX);
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        this.gameState.blueMeterValue = Math.max(
          0,
          this.gameState.blueMeterValue - 10
        );
        this.updateMeterBars();

        this.time.delayedCall(2000, () => {
          if (bullet.active) {
            bullet.setActive(false);
            bullet.setVisible(false);
          }
        });
      }
    }
  }
}

/**
 * Game Over Scene
 */
class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  preload() {
    this.load.image(
      "character123",
      "https://play.rosebud.ai/assets/Cream Colorful Illustrative Game Rental Flyer (2).png?3Fki"
    );
  }

  create() {
    this.add.image(400, 600, "character123").setScale(0.56);
    var title = this.add
      .text(200, 300, "", {
        color: "black",
        fontFamily: "Arial",
        fontSize: "60px",
        padding: 0,
      })
      .setStroke("#FFFFFF", 9);

    let websiteButton = this.add
      .text(400, 900, "https://arts4refugees.substack.com/", {
        color: "#FFFFFF", // Light blue color,
        fontFamily: "Arial",
        fontSize: "40px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      })
      .setOrigin(0.5, 1)
      .setInteractive();

    websiteButton.on("pointerdown", () => {
      window.open("https://arts4refugees.substack.com/", "_blank");
    });
  }
}

/**
 * Title Scene
 */
class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
    this.titleMusic = null;
    this.exploreTween = null;
    this.gamepad = null;
    this.buttons = [];
    this.selectedButton = 0;
    this.stickMoved = false;
    this.buttonPressed = false;
  }

  preload() {
    this.load.image(
      "character1",
      "https://play.rosebud.ai/assets/Default_Knaan_portrait_in_digital_art_capturing_the_SomaliCana_0.jpg?NHmA"
    );
  }

  create() {
    this.add.image(400, 600, "character1").setScale(1);
    var title = this.add
      .text(200, 300, "", {
        color: "black",
        fontFamily: "Arial",
        fontSize: "60px",
        padding: 0,
      })
      .setStroke("#FFFFFF", 9);

    var startButton = this.add
      .text(300, 600, "Start", {
        color: "white",
        fontFamily: "Arial",
        fontSize: "40px",
        backgroundColor: "rgba(255,204,1,0.874)",
        padding: { left: 50, right: 50, top: 10, bottom: 10 },
      })
      .setInteractive();

    startButton.on("pointerdown", () => this.scene.start("InstructionScene"));
    startButton.on("pointerover", () =>
      startButton.setBackgroundColor("rgba(255,204,1,0.874)")
    );
    startButton.on("pointerout", () =>
      startButton.setBackgroundColor("rgba(0,0,0,0.6)")
    );
  }
}

class InstructionScene extends Phaser.Scene {
  constructor() {
    super("InstructionScene");
  }

  preload() {
    this.load.image(
      "character12",
      "https://play.rosebud.ai/assets/Cream Colorful Illustrative Game Rental Flyer (1).png?79jo"
    );
  }

  create() {
    this.add.image(400, 600, "character12").setScale(0.56);
    var title = this.add
      .text(200, 300, "", {
        color: "black",
        fontFamily: "Arial",
        fontSize: "60px",
        padding: 0,
      })
      .setStroke("#FFFFFF", 9);

    var startButton = this.add
      .text(300, 950, "Continue", {
        color: "white",
        fontFamily: "Arial",
        fontSize: "40px",
        backgroundColor: "rgba(255,204,1,0.874)",
        padding: { left: 50, right: 50, top: 10, bottom: 10 },
      })
      .setInteractive();

    startButton.on("pointerdown", () => this.scene.start("Scene1"));
    startButton.on("pointerover", () =>
      startButton.setBackgroundColor("rgba(255,204,1,0.874)")
    );
    startButton.on("pointerout", () =>
      startButton.setBackgroundColor("rgba(0,0,0,0.6)")
    );
  }
}

/**
 * Scene 1
 */
class Scene1 extends BaseScene {
  constructor() {
    super("Scene1");
    this.darwinSpeak1Sound = null;
  }

  preload() {
    super.preload();
    this.load.image(
      "backdrop",
      "https://play.rosebud.ai/assets/file (13).jpg?rb7B"
    );
    this.load.image(
      "geeky",
      "https://play.rosebud.ai/assets/profile-pic (24).png?5hh4"
    );
    this.load.audio(
      "ambientMusic",
      "https://play.rosebud.ai/assets/ambient.wav?EnXp"
    );
    this.load.image(
      "cloud",
      "https://play.rosebud.ai/assets/simplecloud.png?NUzY"
    );
    this.load.audio(
      "darwinSpeak1Sound",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_28_37_Paul_pre_s50_sb75_se0_b_m2.mp3?LR6S"
    );
    this.load.image(
      "scene1Image",
      "https://play.rosebud.ai/assets/file.png?cTd5"
    );
    this.load.image(
      "skeletonKey",
      "https://play.rosebud.ai/assets/Skeleton Key.png?EvJh"
    );
  }

  create() {
    super.create();
    this.createBackground("backdrop", "scene1Image");
    this.createGeeky(690, 2000);
    this.createKeyboardInputs();
    this.createAmbientMusic("ambientMusic");
    this.createCloudParticles();
    this.createMeterBars();
    this.createDarwinSpeak1Sound();
    this.createSkeletonKey();
  }

  createDarwinSpeak1Sound() {
    this.darwinSpeak1Sound = this.sound.add("darwinSpeak1Sound", {
      volume: 0.2,
    });
    this.darwinSpeak1Sound.play();
    this.darwinSpeak1Sound.once("complete", this.dropSkeletonKey, this);
  }

  createSkeletonKey() {
    this.skeletonKey = this.physics.add.sprite(-100, -100, "skeletonKey");
    this.skeletonKey.setScale(0.05);
    this.skeletonKey.body.setCollideWorldBounds(true);
    this.physics.add.overlap(
      this.geeky,
      this.skeletonKey,
      this.handleSkeletonKeyCollision,
      null,
      this
    );
  }

  handleSkeletonKeyCollision(geeky, skeletonKey) {
    skeletonKey.disableBody(true, true);
    this.stopAmbientMusic();
    this.scene.start("Scene2", { gameState: this.gameState });
  }

  update(time, delta) {
    super.update(time, delta);

    // Any Scene1 specific update logic can go here
  }
}

/**
 * Scene 2
 */
class Scene2 extends BaseScene {
  constructor() {
    super("Scene2");
    this.darwinSpeak2Sound = null;
    this.greenClouds = [];
    this.greenCloudTimer = 0;
    this.greenCloudSpawnInterval = 500;
    this.greenCloudsSpawned = 0;
    this.maxGreenClouds = 8;
    this.darwinSpeak3Sound = null;
  }

  preload() {
    super.preload();
    this.load.image(
      "backdrop2",
      "https://play.rosebud.ai/assets/file (13).jpg?rb7B"
    );
    this.load.image(
      "scene2Image",
      "https://play.rosebud.ai/assets/file (1).png?ZXiv"
    );
    this.load.audio(
      "darwinSpeak2Sound",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_32_40_Paul_pre_s50_sb75_se0_b_m2.mp3?fvG3"
    );
    this.load.image(
      "greenCloud",
      "https://play.rosebud.ai/assets/greencloud.png?WzL0"
    );
    this.load.audio(
      "darwinSpeak3Sound",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_35_31_Paul_pre_s50_sb75_se0_b_m2.mp3?X1Wy"
    );
    this.load.image(
      "skeletonKey",
      "https://play.rosebud.ai/assets/Skeleton Key.png?EvJh"
    );
  }

  create() {
    super.create();

    this.createBackground("backdrop2", "scene2Image");
    this.createGeeky(370, 915);
    this.createKeyboardInputs();
    this.createAmbientMusic("ambientMusic");
    this.createCloudParticles();
    this.createMeterBars();
    this.createDarwinSpeak2Sound();
    this.createSkeletonKey();
  }

  createDarwinSpeak2Sound() {
    this.darwinSpeak2Sound = this.sound.add("darwinSpeak2Sound", {
      volume: 0.2,
    });

    this.darwinSpeak2Sound.play();
    this.darwinSpeak2Sound.once("complete", this.spawnGreenClouds, this);
  }

  spawnGreenClouds() {
    this.greenCloudTimer = this.time.addEvent({
      delay: this.greenCloudSpawnInterval,
      callback: this.spawnGreenCloud,
      callbackScope: this,
      loop: true,
    });

    this.darwinSpeak3Sound = this.sound.add("darwinSpeak3Sound", {
      volume: 0.2,
    });
  }

  spawnGreenCloud() {
    if (this.greenCloudsSpawned < this.maxGreenClouds) {
      const greenCloud = this.physics.add.sprite(
        Phaser.Math.Between(
          this.backdropBounds.left,
          this.backdropBounds.right
        ),
        this.backdropBounds.top - 50,
        "greenCloud"
      );
      greenCloud.setScale(0.1);
      greenCloud.setVelocityX(Phaser.Math.Between(-50, 50));
      greenCloud.setVelocityY(Phaser.Math.Between(100, 200));
      this.physics.add.overlap(
        this.geeky,
        greenCloud,
        this.handleGreenCloudCollision,
        null,
        this
      );
      this.greenClouds.push(greenCloud);
      this.greenCloudsSpawned++;

      if (this.greenCloudsSpawned === this.maxGreenClouds) {
        this.greenCloudTimer.remove();
        this.time.delayedCall(5000, this.playDarwinSpeak3Sound, [], this);
      }
    }
  }

  handleGreenCloudCollision(geeky, greenCloud) {
    greenCloud.destroy();
    this.reduceRedMeter();
  }

  handleSkeletonKeyCollision(geeky, skeletonKey) {
    skeletonKey.disableBody(true, true);
    this.scene.start("Scene3", { gameState: this.gameState });
  }

  playDarwinSpeak3Sound() {
    if (this.gameState.redMeterValue > 0) {
      this.darwinSpeak3Sound.play();
      this.darwinSpeak3Sound.once("complete", this.dropSkeletonKey, this);
    }
  }

  update(time, delta) {
    super.update(time, delta);

    this.greenClouds.forEach((cloud, index) => {
      if (cloud.y > this.backdropBounds.bottom) {
        cloud.destroy();
        this.greenClouds.splice(index, 1);
      }
    });
  }
}

class Scene3 extends BaseScene {
  constructor() {
    super("Scene3");
    this.darwinSpeak5Sound = null;
    this.spirits = null;
    this.bullets = null;
    this.score = 0;
    this.scoreText = null;
    this.colors = [
      0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3,
    ];
    this.lastShootTime = 0;
    this.shootDelay = 250;
    this.isAudioPlaying = false;
    this.baseEnemySpeed = 30;
    this.difficultyMultiplier = 1;
  }

  preload() {
    super.preload();
    this.load.image(
      "backdrop3",
      "https://play.rosebud.ai/assets/file (13).jpg?rb7B"
    );
    this.load.image(
      "scene3Image",
      "https://play.rosebud.ai/assets/file (2).png?5g73"
    );
    this.load.audio(
      "darwinSpeak5Sound",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_58_00_Paul_pre_s50_sb75_se0_b_m2.mp3?dnuA"
    );
    this.load.image("spirit", "https://play.rosebud.ai/assets/Spirit.png?za8i");
    this.load.image(
      "bullet",
      "https://play.rosebud.ai/assets/star_medium_redv2.png?RB7f"
    );
    this.load.audio("hit", "https://play.rosebud.ai/assets/keyClink2.wav?dyyL");
  }

  create() {
    super.create();
    this.createBackground("backdrop3", "scene3Image");
    this.createGeeky(370, 915);
    this.createKeyboardInputs();
    this.createAmbientMusic("ambientMusic");
    this.createCloudParticles();
    this.createMeterBars();
    this.createDarwinSpeak5Sound();
    this.createSkeletonKey();

    this.createSpirits();
    this.createBullets();
    this.physics.add.overlap(
      this.geeky,
      this.spirits,
      this.handleSpiritCollision,
      null,
      this
    );
    this.physics.add.overlap(
      this.bullets,
      this.spirits,
      this.hitSpirit,
      null,
      this
    );

    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      fill: "#fff",
    });

    this.startSpiritSpawning();
    this.playDarwinSpeak5Sound();
  }

  createDarwinSpeak5Sound() {
    this.darwinSpeak5Sound = this.sound.add("darwinSpeak5Sound", {
      volume: 0.2,
    });
  }

  playDarwinSpeak5Sound() {
    if (!this.isAudioPlaying) {
      this.isAudioPlaying = true;
      this.darwinSpeak5Sound.play();
      this.darwinSpeak5Sound.once("complete", () => {
        this.isAudioPlaying = false;
        this.dropSkeletonKey();
      });
    }
  }

  createSpirits() {
    this.spirits = this.physics.add.group();
  }

  createBullets() {
    this.bullets = this.physics.add.group();
  }

  startSpiritSpawning() {
    this.time.addEvent({
      delay: 2000 / this.difficultyMultiplier,
      callback: this.spawnSpirit,
      callbackScope: this,
      loop: true,
    });
  }

  spawnSpirit() {
    if (!this.isAudioPlaying) return;

    const randomEdgePosition = this.getRandomEdgePosition();
    const spirit = this.spirits.create(
      randomEdgePosition.x,
      randomEdgePosition.y,
      "spirit"
    );
    spirit.setScale(0.15);
    spirit.setDepth(2);
    const colorIndex = Phaser.Math.Between(0, this.colors.length - 1);
    spirit.setTint(this.colors[colorIndex]);
  }

  getRandomEdgePosition() {
    const edge = Phaser.Math.Between(0, 3);
    const bounds = this.backdropBounds;

    switch (edge) {
      case 0: // Top edge
        return new Phaser.Math.Vector2(
          Phaser.Math.Between(bounds.left, bounds.right),
          bounds.top
        );
      case 1: // Right edge
        return new Phaser.Math.Vector2(
          bounds.right,
          Phaser.Math.Between(bounds.top, bounds.bottom)
        );
      case 2: // Bottom edge
        return new Phaser.Math.Vector2(
          Phaser.Math.Between(bounds.left, bounds.right),
          bounds.bottom
        );
      case 3: // Left edge
        return new Phaser.Math.Vector2(
          bounds.left,
          Phaser.Math.Between(bounds.top, bounds.bottom)
        );
    }
  }

  handleSpiritCollision(geeky, spirit) {
    spirit.destroy();
    this.reduceRedMeter();
  }

  hitSpirit(bullet, spirit) {
    this.sound.play("hit", { volume: 0.3 });
    spirit.destroy();
    bullet.destroy();
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);
  }

  handleSkeletonKeyCollision(geeky, skeletonKey) {
    skeletonKey.disableBody(true, true);
    this.sound.stopAll();
    this.isAudioPlaying = false;
    this.scene.start("Scene4", {
      score: this.score,
      gameState: this.gameState,
    });
  }

  update(time, delta) {
    super.update(time, delta);

    this.handleShooting(time);
    this.updateSpirits();
    this.updateDifficulty();
  }

  handleShooting(time) {
    if (time - this.lastShootTime < this.shootDelay) return;

    let shootDirection = null;

    if (this.cursors.shootUp.isDown) shootDirection = { x: 0, y: -1 };
    else if (this.cursors.shootDown.isDown) shootDirection = { x: 0, y: 1 };
    else if (this.cursors.shootLeft.isDown) shootDirection = { x: -1, y: 0 };
    else if (this.cursors.shootRight.isDown) shootDirection = { x: 1, y: 0 };
    else if (this.gamepad) {
      const rightStickX = this.gamepad.rightStick.x;
      const rightStickY = this.gamepad.rightStick.y;
      if (Math.abs(rightStickX) > 0.1 || Math.abs(rightStickY) > 0.1) {
        shootDirection = { x: rightStickX, y: rightStickY };
      }
    }

    if (shootDirection) {
      this.shoot(shootDirection.x, shootDirection.y);
      this.lastShootTime = time;
    }
  }

  shoot(directionX, directionY) {
    const bullet = this.bullets.create(this.geeky.x, this.geeky.y, "bullet");
    bullet.setScale(0.25);
    const speed = 300;
    const angle = Math.atan2(directionY, directionX);
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  updateSpirits() {
    this.spirits.children.entries.forEach((spirit) => {
      spirit.rotation += 0.02;
      this.physics.moveToObject(
        spirit,
        this.geeky,
        this.baseEnemySpeed * this.difficultyMultiplier
      );
    });
  }

  updateDifficulty() {
    this.difficultyMultiplier = 1 + Math.floor(this.score / 100) * 0.1;
  }
}

class Scene4 extends BaseScene {
  constructor() {
    super("Scene4");
    this.books = null;
    this.booksSpawned = 0;
    this.maxBooks = 4;
    this.darwinSpeak4Sound1 = null;
    this.darwinSpeak4Sound2 = null;
    this.darwinSpeak4Sound3 = null;
    this.bookSpawningActive = false;
    this.isSprinting = false;
    this.sprintKey = null;
    this.normalSpeed = 160;
    this.sprintSpeed = 320;
    this.greenMeterDepletionRate = 1;
    this.greenMeterRechargeRate = 1.5;
  }

  preload() {
    super.preload();
    this.load.image(
      "backdrop4",
      "https://play.rosebud.ai/assets/file (13).jpg?rb7B"
    );
    this.load.image(
      "scene4Image",
      "https://play.rosebud.ai/assets/file (3).png?QLuM"
    );
    this.load.audio(
      "Scene4Darwin1",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_51_45_Paul_pre_s50_sb75_se0_b_m2.mp3?78kr"
    );
    this.load.audio(
      "Scene4Darwin2",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_51_14_Paul_pre_s50_sb75_se0_b_m2.mp3?Pk7B"
    );
    this.load.audio(
      "Scene4Darwin3",
      "https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_51_57_Paul_pre_s50_sb75_se0_b_m2.mp3?5FlZ"
    );
    this.load.image(
      "book",
      "https://play.rosebud.ai/assets/Open Book.png?LARv"
    );
    this.load.audio(
      "library",
      "https://play.rosebud.ai/assets/library.wav?K3X3"
    );
  }

  create() {
    super.create();
    this.createBackground("backdrop4", "scene4Image");
    this.createGeeky(370, 915);
    this.createKeyboardInputs();
    this.createAmbientMusic("library");
    this.createCloudParticles();
    this.createMeterBars();
    this.createSkeletonKey();

    this.createBooks();
    this.physics.add.overlap(
      this.geeky,
      this.books,
      this.handleBookCollision,
      null,
      this
    );
    this.physics.add.overlap(
      this.geeky,
      this.skeletonKey,
      this.handleSkeletonKeyCollision,
      null,
      this
    );

    this.sprintKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.createDarwinSpeak4Sound1();
  }

  createDarwinSpeak4Sound1() {
    this.darwinSpeak4Sound1 = this.sound.add("Scene4Darwin1", { volume: 0.2 });
    this.darwinSpeak4Sound1.play();
    this.darwinSpeak4Sound1.once("complete", () => {
      this.createDarwinSpeak4Sound2();
      this.startBookSpawning();
      this.bookSpawningActive = true;
    });
  }

  createDarwinSpeak4Sound2() {
    this.darwinSpeak4Sound2 = this.sound.add("Scene4Darwin2", { volume: 0.2 });
    this.darwinSpeak4Sound2.play();
    this.darwinSpeak4Sound2.once(
      "complete",
      this.createDarwinSpeak4Sound3,
      this
    );
  }

  createDarwinSpeak4Sound3() {
    this.darwinSpeak4Sound3 = this.sound.add("Scene4Darwin3", { volume: 0.2 });
    this.darwinSpeak4Sound3.play();
    this.darwinSpeak4Sound3.once("complete", () => {
      this.stopBookSpawning();
      this.bookSpawningActive = false;
      this.dropSkeletonKey();
    });
  }

  createBooks() {
    this.books = this.physics.add.group();
  }

  startBookSpawning() {
    this.spawnBook();
  }

  stopBookSpawning() {
    this.bookSpawningActive = false;
  }

  spawnBook() {
    if (this.booksSpawned >= this.maxBooks || !this.bookSpawningActive) {
      return;
    }

    const randomY = Phaser.Math.Between(
      this.backdropBounds.top,
      this.backdropBounds.bottom
    );
    const spawnLeft = Math.random() < 0.5;
    const book = this.books.create(
      spawnLeft ? this.backdropBounds.left : this.backdropBounds.right,
      randomY,
      "book"
    );
    book.setScale(0.15);
    book.setDepth(2);
    book.setVelocityX(spawnLeft ? 150 : -150);

    this.booksSpawned++;

    this.time.delayedCall(10000, () => {
      if (book.active) {
        book.destroy();
        this.booksSpawned--;
        this.spawnBook();
      }
    });
  }

  handleBookCollision(geeky, book) {
    book.destroy();
    this.booksSpawned--;
    this.reduceRedMeter();
    this.spawnBook();
  }

  handleSkeletonKeyCollision(geeky, skeletonKey) {
    skeletonKey.disableBody(true, true);

    this.sound.stopAll();
    this.stopBookSpawning();

    this.scene.start("GameOverScene");
  }

  update(time, delta) {
    super.update(time, delta);

    this.handleSprinting();

    this.books.getChildren().forEach((book) => {
      if (
        (book.x < this.backdropBounds.left && book.body.velocity.x < 0) ||
        (book.x > this.backdropBounds.right && book.body.velocity.x > 0)
      ) {
        book.destroy();
        this.booksSpawned--;
        this.spawnBook();
      }
    });

    if (
      this.bookSpawningActive &&
      this.books.getChildren().length < this.maxBooks
    ) {
      this.spawnBook();
    }
  }

  handleSprinting() {
    const isSprinting =
      this.sprintKey.isDown || (this.gamepad && this.gamepad.B);

    if (isSprinting && this.gameState.greenMeterValue > 0) {
      this.isSprinting = true;
      this.gameState.greenMeterValue -= this.greenMeterDepletionRate;
    } else {
      this.isSprinting = false;
      if (this.gameState.greenMeterValue < 100) {
        this.gameState.greenMeterValue += this.greenMeterRechargeRate;
      }
    }

    this.gameState.greenMeterValue = Phaser.Math.Clamp(
      this.gameState.greenMeterValue,
      0,
      100
    );
    this.updateMeterBars();
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  parent: "renderDiv",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  width: 800,
  height: 1200,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    TitleScene,
    InstructionScene,
    Scene1,
    Scene2,
    Scene3,
    Scene4,
    GameOverScene,
  ],
  input: {
    gamepad: true,
  },
};

window.phaserGame = new Phaser.Game(config);
