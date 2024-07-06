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
            greenMeterValue: 100
        };
    }

    preload() {
        this.load.audio('keyClink', 'https://play.rosebud.ai/assets/keyClink.wav?QiZj');
    }

    create() {
        this.createKeyClink();
        this.setupGamepad();
        this.createKeyboardInputs();
    }

    setupGamepad() {
        this.input.gamepad.on('connected', (pad) => {
            console.log('Gamepad connected:', pad);
            this.handleGamepadConnect(pad);
        }, this);

        this.input.gamepad.on('disconnected', (pad) => {
            console.log('Gamepad disconnected:', pad);
            this.handleGamepadDisconnect();
        }, this);

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
        this.add.image(400, 325, sceneImageKey).setScale(1.90);
        this.backdropBounds = new Phaser.Geom.Rectangle(
            backdrop.x - backdrop.width / 2,
            backdrop.y - backdrop.height / 2,
            backdrop.width,
            backdrop.height
        );
    }

    createGeeky(x, y) {
        this.geeky = this.physics.add.sprite(x, y, 'geeky');
        this.geeky.setScale(0.13); // Increased by 30% from 0.10 to 0.13
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
            sprint: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    createMeterBars() {
        this.redMeterBar = this.add.graphics();
        this.blueMeterBar = this.add.graphics();
        this.greenMeterBar = this.add.graphics();
        this.updateMeterBars();
    }

    createCloudParticles() {
        this.cloudParticles = this.add.particles('cloud');
        this.cloudParticles.createEmitter({
            follow: this.geeky,
            speed: { min: 0, max: 20 },
            angle: { min: 0, max: 230 },
            scale: { start: 0.07, end: 0 },
            blendMode: 'NORMAL',
            lifespan: 3000,
            frequency: 100,
            depth: 0
        });
    }

    reduceRedMeter() {
        this.gameState.redMeterValue -= 33.33;
        this.gameState.redMeterValue = Math.max(0, this.gameState.redMeterValue);
        this.updateMeterBars();

        if (this.gameState.redMeterValue <= 0 && this.scene.key !== 'FinalScene') {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.scene.pause();
        this.scene.launch('GameOverScene', { currentScene: this.scene.key, gameState: this.gameState });
    }

    updateMeterBars() {
        this.redMeterBar.clear().fillStyle(0xFF0000, 1).fillRect(50, 1100, (this.gameState.redMeterValue / 100) * 200, 30);
        this.blueMeterBar.clear().fillStyle(0x0000FF, 1).fillRect(300, 1100, (this.gameState.blueMeterValue / 100) * 200, 30);
        this.greenMeterBar.clear().fillStyle(0x00FF00, 1).fillRect(550, 1100, (this.gameState.greenMeterValue / 100) * 200, 30);
    }

    createSkeletonKey() {
        this.skeletonKey = this.physics.add.sprite(-100, -100, 'skeletonKey');
        this.skeletonKey.setScale(0.05);
        this.skeletonKey.body.setCollideWorldBounds(true);
        this.physics.add.overlap(this.geeky, this.skeletonKey, this.handleSkeletonKeyCollision, null, this);
    }

    handleSkeletonKeyCollision(geeky, skeletonKey) {
        console.log('Skeleton key collected');
    }

    createKeyClink() {
        this.keyClink = this.sound.add('keyClink', { volume: 0.2 });
    }

    dropSkeletonKey() {
        this.skeletonKey.setPosition(Phaser.Math.Between(100, 700), -100);
        this.skeletonKeyTween = this.tweens.add({
            targets: this.skeletonKey,
            y: this.backdropBounds.bottom + 50,
            duration: 2000,
            ease: 'Linear',
            onComplete: () => {
                this.skeletonKey.setVelocity(0, 0);
                this.keyClink.play();
            }
        });
    }

    handlePlayerMovement() {
        if (!this.geeky) return;

        const speed = this.isSprinting && this.gameState.greenMeterValue > 0 ? this.sprintSpeed : this.normalSpeed;
    
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
        const isSprinting = this.cursors.sprint.isDown || (this.gamepad && this.gamepad.B);
        if (isSprinting && this.gameState.greenMeterValue > 0) {
            this.isSprinting = true;
            this.gameState.greenMeterValue = Math.max(0, this.gameState.greenMeterValue - this.greenMeterDepletionRate);
        } else {
            this.isSprinting = false;
            if (this.gameState.greenMeterValue < 100) {
                this.gameState.greenMeterValue = Math.min(100, this.gameState.greenMeterValue + this.greenMeterRechargeRate);
            }
        }

        this.updateMeterBars();
    }

    update(time, delta) {
        this.handlePlayerMovement();

        if (this.geeky && this.backdropBounds) {
            this.geeky.x = Phaser.Math.Clamp(this.geeky.x, this.backdropBounds.left, this.backdropBounds.right);
            this.geeky.y = Phaser.Math.Clamp(this.geeky.y, this.backdropBounds.top, this.backdropBounds.bottom);
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

                this.gameState.blueMeterValue = Math.max(0, this.gameState.blueMeterValue - 10);
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
 * Title Scene
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.titleMusic = null;
        this.exploreTween = null;
        this.gamepad = null;
        this.buttons = [];
        this.selectedButton = 0;
        this.stickMoved = false;
        this.buttonPressed = false;
    }

    preload() {
        this.load.image('titleBackground', 'https://play.rosebud.ai/assets/Default_Design_a_captivating_and_evocative_cover_image_that_re_1.jpg?BiBU');
  
        this.load.audio('titleMusic', 'https://play.rosebud.ai/assets/Full song Geeky Ghost.mp3?0EnH');


         this.load.image(
      "character1",
      "https://play.rosebud.ai/assets/Designer (6)-Photoroom.png?xuER"
    );
    }

    create() {
        this.createBackground();
        this.createTitleText();
        this.createExploreButton();
        this.createChapterSelect();
        this.createMusic();
        this.createParticleEffect();
        this.setupGamepad();
        this.createInstructions();

        this.updateButtonHighlight();

        
    }
 
    createBackground() {
        this.add.image(400, 600, 'titleBackground').setScale(2.5);
        this.add.image(400, 200, 'ggcomics').setScale(0.5);
    }

    createTitleText() {
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 250, ' Wavin’ Flags:', {
            fontSize: '60px',
            color: '#99EEFF',
            fontFamily: 'customFont',
            stroke: '#000000',
            strokeThickness: 15
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 140, 'The Journey of K’naan', {
            fontSize: '80px',
            color: '#B3001E',
            fontFamily: 'customFont',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
    }

    createExploreButton() {
        const exploreButton = this.add.image(this.cameras.main.centerX, this.cameras.main.height - 500, 'exploreButton');
        if (exploreButton)  {
            exploreButton.setScale(1.1);
            const exploreText = this.add.text(exploreButton.x, exploreButton.y, 'Start', {
                fontSize: '32px',
                color: '#99FFFF',
                align: 'center',
                fontFamily: 'customFont',
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5);

            exploreButton.setInteractive();
            exploreButton.on('pointerdown', () => {
                this.startChapter('Scene1');
            });

            this.exploreTween = this.tweens.add({
                targets: [exploreButton, exploreText],
                y: exploreButton.y + 10,
                ease: 'Sine.easeInOut',
                duration: 1000,
                yoyo: true,
                repeat: -1,
                onYoyo: this.onExploreTweenYoyo.bind(this)
            });

            this.buttons.push(exploreButton);
        }
    }

    createChapterSelect() {
        const chapters = ['FinalScene'];
        const startX = 350;
        const startY = this.cameras.main.centerY + 300;
        const spacing = 80;

        chapters.forEach((chapter, index) => {
            const button = this.add.image(startX, startY + index * spacing, 'button').setScale(0.12);
            const text = this.add.text(button.x + 50, button.y, ``, {
                fontSize: '32px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4,
                fill: '#ffffff'
            });

            button.setInteractive();
            button.on('pointerdown', () => {
                this.startChapter(chapter);
            });

            this.buttons.push(button);
        });
    }

    createInstructions() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        const instructionsText = `Keyboard: WASD to move, Spacebar to sprint, Arrow keys to fire (In Scenes that allow it)

Gamepad: Left Thumbstick to Move, Right Thumbstick to fire (In Scenes that allow it), B button to sprint`;

        this.add.text(screenWidth / 2, screenHeight - 100, instructionsText, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold',
            stroke: '#99ffff',
            strokeThickness: 2,
            align: 'center',
            wordWrap: { width: screenWidth * 0.8, useAdvancedWrap: true }
        }).setOrigin(0.5, 0.5);
    }

    createMusic() {
        if (this.titleMusic) {
            this.titleMusic.stop();
        }
        this.titleMusic = this.sound.add('titleMusic', { volume: 0.025, loop: true });
        this.titleMusic.play();
    }

    createParticleEffect() {
        const particles = this.add.particles('ggsilo');
        particles.createEmitter({
            x: this.cameras.main.centerX,
            y: this.cameras.main.height - 450,
            speed: { min: 25, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 20000,
            frequency: 750,
            tint: 0x00ffff
        });
    }

    startChapter(chapterKey) {
        if (this.titleMusic) {
            this.titleMusic.stop();
        }
        this.scene.start(chapterKey, { 
            gameState: {
                redMeterValue: 100,
                blueMeterValue: 100,
                greenMeterValue: 100
            },
            startFromChapterSelect: true,
            selectedChapter: chapterKey
        });
    }

    onExploreTweenYoyo() {
        const beat = this.titleMusic.seek / 1000;
        const tweenDuration = this.exploreTween.duration / 1000;
        const offset = (beat % tweenDuration) / tweenDuration;
        this.exploreTween.timeScale = 1 + offset;
    }

    setupGamepad() {
        this.input.gamepad.on('connected', (pad) => {
            console.log('Gamepad connected:', pad);
            this.gamepad = pad;
        });

        this.input.gamepad.on('disconnected', (pad) => {
            console.log('Gamepad disconnected:', pad);
            this.gamepad = null;
        });
    }

    updateButtonHighlight() {
        this.buttons.forEach((button, index) => {
            button.setTint(index === this.selectedButton ? 0xffff00 : 0xffffff);
        });
    }

    update() {
        this.handleGamepadInput();
    }

    handleGamepadInput() {
        if (!this.gamepad) return;

        const deadzone = 0.5;

        // Menu navigation
        if (this.gamepad.leftStick.y < -deadzone && !this.stickMoved) {
            this.selectedButton = (this.selectedButton - 1 + this.buttons.length) % this.buttons.length;
            this.updateButtonHighlight();
            this.stickMoved = true;
        } else if (this.gamepad.leftStick.y > deadzone && !this.stickMoved) {
            this.selectedButton = (this.selectedButton + 1) % this.buttons.length;
            this.updateButtonHighlight();
            this.stickMoved = true;
        } else if (Math.abs(this.gamepad.leftStick.y) < deadzone) {
            this.stickMoved = false;
        }

        // Button selection
        if (this.gamepad.A && !this.buttonPressed) {
            if (this.selectedButton === 0) {
                this.startChapter('Scene1');
            } else {
                this.startChapter('FinalScene');
            }
            this.buttonPressed = true;
        } else if (!this.gamepad.A) {
            this.buttonPressed = false;
        }
    }
}

/**
 * Scene 1
 */
class Scene1 extends BaseScene {
    constructor() {
        super('Scene1');
        this.darwinSpeak1Sound = null;
    }

    preload() {
        super.preload();
        this.load.image('backdrop', 'https://play.rosebud.ai/assets/file (13).jpg?rb7B');
        this.load.image('geeky', 'https://play.rosebud.ai/assets/profile-pic (24).png?5hh4');
        this.load.audio('ambientMusic', 'https://play.rosebud.ai/assets/ambient.wav?EnXp');
        this.load.image('cloud', 'https://play.rosebud.ai/assets/simplecloud.png?NUzY');
        this.load.audio('darwinSpeak1Sound', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_28_37_Paul_pre_s50_sb75_se0_b_m2.mp3?LR6S');
        this.load.image('scene1Image', 'https://play.rosebud.ai/assets/file.png?cTd5');
        this.load.image('skeletonKey', 'https://play.rosebud.ai/assets/Skeleton Key.png?EvJh');
    }

    create() {
        super.create();
        this.createBackground('backdrop', 'scene1Image');
        this.createGeeky(690, 2000);
        this.createKeyboardInputs();
        this.createAmbientMusic('ambientMusic');
        this.createCloudParticles();
        this.createMeterBars();
        this.createDarwinSpeak1Sound();
        this.createSkeletonKey();
    }

    createDarwinSpeak1Sound() {
        this.darwinSpeak1Sound = this.sound.add('darwinSpeak1Sound', { volume: 0.2 });
        this.darwinSpeak1Sound.play();
        this.darwinSpeak1Sound.once('complete', this.dropSkeletonKey, this);
    }

    createSkeletonKey() {
        this.skeletonKey = this.physics.add.sprite(-100, -100, 'skeletonKey');
        this.skeletonKey.setScale(0.05);
        this.skeletonKey.body.setCollideWorldBounds(true);
        this.physics.add.overlap(this.geeky, this.skeletonKey, this.handleSkeletonKeyCollision, null, this);
    }

    handleSkeletonKeyCollision(geeky, skeletonKey) {
        skeletonKey.disableBody(true, true);
        this.stopAmbientMusic();
        this.scene.start('Scene2', { gameState: this.gameState });
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
        super('Scene2');
        this.darwinSpeak2Sound = null;
        this.greenClouds = [];
        this.greenCloudTimer = 0;
        this.greenCloudSpawnInterval = 500; // Reduced interval for faster spawning
        this.greenCloudsSpawned = 0;
        this.maxGreenClouds = 8; // Doubled from 4 to 8
        this.darwinSpeak3Sound = null;
      
    }

    preload() {
        super.preload();
        this.load.image('backdrop2', 'https://play.rosebud.ai/assets/file (13).jpg?rb7B');
        this.load.image('scene2Image', 'https://play.rosebud.ai/assets/file (1).png?ZXiv');
        this.load.audio('darwinSpeak2Sound', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_32_40_Paul_pre_s50_sb75_se0_b_m2.mp3?fvG3');
        this.load.image('greenCloud', 'https://play.rosebud.ai/assets/greencloud.png?WzL0');
        this.load.audio('darwinSpeak3Sound', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_35_31_Paul_pre_s50_sb75_se0_b_m2.mp3?X1Wy');
        this.load.image('skeletonKey', 'https://play.rosebud.ai/assets/Skeleton Key.png?EvJh');
    }

    create() {
        super.create();
        
        this.createBackground('backdrop2', 'scene2Image');
        this.createGeeky(370, 915);
        this.createKeyboardInputs();
        this.createAmbientMusic('ambientMusic');
        this.createCloudParticles();
        this.createMeterBars();
        this.createDarwinSpeak2Sound();
        this.createSkeletonKey();
    }

    createDarwinSpeak2Sound() {
        this.darwinSpeak2Sound = this.sound.add('darwinSpeak2Sound', { volume: 0.2 });
        
        this.darwinSpeak2Sound.play();
        this.darwinSpeak2Sound.once('complete', this.spawnGreenClouds, this);
    }

    spawnGreenClouds() {
        this.greenCloudTimer = this.time.addEvent({
            delay: this.greenCloudSpawnInterval,
            callback: this.spawnGreenCloud,
            callbackScope: this,
            loop: true
        });

        this.darwinSpeak3Sound = this.sound.add('darwinSpeak3Sound', { volume: 0.2 });
    }

    spawnGreenCloud() {
        if (this.greenCloudsSpawned < this.maxGreenClouds) {
            const greenCloud = this.physics.add.sprite(
                Phaser.Math.Between(this.backdropBounds.left, this.backdropBounds.right),
                this.backdropBounds.top - 50, // Start slightly above the top
                'greenCloud'
            );
            greenCloud.setScale(0.1);
            greenCloud.setVelocityX(Phaser.Math.Between(-50, 50));
            greenCloud.setVelocityY(Phaser.Math.Between(100, 200));
            this.physics.add.overlap(this.geeky, greenCloud, this.handleGreenCloudCollision, null, this);
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
        this.scene.start('Scene3', { gameState: this.gameState });
    }

    playDarwinSpeak3Sound() {
        if (this.gameState.redMeterValue > 0) {
            this.darwinSpeak3Sound.play();
            this.darwinSpeak3Sound.once('complete', this.dropSkeletonKey, this);
        }
    }
    update(time, delta) {
        super.update(time, delta);

        // Scene2-specific update logic
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
        super('Scene3');
        this.darwinSpeak5Sound = null;
        this.spirits = null;
        this.bullets = null;
        this.score = 0;
        this.scoreText = null;
        this.colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
        this.lastShootTime = 0;
        this.shootDelay = 250;
        this.isAudioPlaying = false;
        this.baseEnemySpeed = 30;
        this.difficultyMultiplier = 1;
    }

    preload() {
        super.preload();
        this.load.image('backdrop3', 'https://play.rosebud.ai/assets/file (13).jpg?rb7B');
        this.load.image('scene3Image', 'https://play.rosebud.ai/assets/file (2).png?5g73');
        this.load.audio('darwinSpeak5Sound', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_58_00_Paul_pre_s50_sb75_se0_b_m2.mp3?dnuA');
        this.load.image('spirit', 'https://play.rosebud.ai/assets/Spirit.png?za8i');
        this.load.image('bullet', 'https://play.rosebud.ai/assets/star_medium_redv2.png?RB7f');
        this.load.audio('hit', 'https://play.rosebud.ai/assets/keyClink2.wav?dyyL');
    }

    create() {

         this.add
      .image(0, 0, "character1")
      .setOrigin(0, 0)
      .setScale(this.scale.width / 1000, this.scale.height / 800);

    var title = this.add
      .text(200, 300, "", {
        color: "black",
        fontFamily: "Arial",
        fontSize: "60px",
        padding: 0,
      })
      .setStroke("#FFFFFF", 9);

    var startButton = this.add
      .text(300, 500, "Start", {
        color: "white",
        fontFamily: "Arial",
        fontSize: "40px",
        backgroundColor: "#F5CD9F",
        padding: { left: 50, right: 50, top: 10, bottom: 10 },
      })
      .setInteractive();

    startButton.on("pointerdown", () => this.scene.start("Scene1"));
    startButton.on("pointerover", () =>
      startButton.setBackgroundColor("#F5CD9F")
    );
    startButton.on("pointerout", () =>
      startButton.setBackgroundColor("rgba(0,0,0,0.6)")
    );
  
        super.create();
        this.createBackground('backdrop3', 'scene3Image');
        this.createGeeky(370, 915);
        this.createKeyboardInputs();
        this.createAmbientMusic('ambientMusic');
        this.createCloudParticles();
        this.createMeterBars();
        this.createDarwinSpeak5Sound();
        this.createSkeletonKey();

        this.createSpirits();
        this.createBullets();
        this.physics.add.overlap(this.geeky, this.spirits, this.handleSpiritCollision, null, this);
        this.physics.add.overlap(this.bullets, this.spirits, this.hitSpirit, null, this);

        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

        this.startSpiritSpawning();
        this.playDarwinSpeak5Sound();
    }

    createDarwinSpeak5Sound() {
        this.darwinSpeak5Sound = this.sound.add('darwinSpeak5Sound', { volume: 0.2 });
    }

    playDarwinSpeak5Sound() {
        if (!this.isAudioPlaying) {
            this.isAudioPlaying = true;
            this.darwinSpeak5Sound.play();
            this.darwinSpeak5Sound.once('complete', () => {
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
            loop: true
        });
    }

    spawnSpirit() {
        if (!this.isAudioPlaying) return;

        const randomEdgePosition = this.getRandomEdgePosition();
        const spirit = this.spirits.create(randomEdgePosition.x, randomEdgePosition.y, 'spirit');
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
                return new Phaser.Math.Vector2(Phaser.Math.Between(bounds.left, bounds.right), bounds.top);
            case 1: // Right edge
                return new Phaser.Math.Vector2(bounds.right, Phaser.Math.Between(bounds.top, bounds.bottom));
            case 2: // Bottom edge
                return new Phaser.Math.Vector2(Phaser.Math.Between(bounds.left, bounds.right), bounds.bottom);
            case 3: // Left edge
                return new Phaser.Math.Vector2(bounds.left, Phaser.Math.Between(bounds.top, bounds.bottom));
        }
    }

    handleSpiritCollision(geeky, spirit) {
        spirit.destroy();
        this.reduceRedMeter();
    }

    hitSpirit(bullet, spirit) {
        this.sound.play('hit', { volume: 0.3 });
        spirit.destroy();
        bullet.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }

    handleSkeletonKeyCollision(geeky, skeletonKey) {
        skeletonKey.disableBody(true, true);
        this.sound.stopAll();
        this.isAudioPlaying = false;
        this.scene.start('Scene4', { score: this.score, gameState: this.gameState });
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
        const bullet = this.bullets.create(this.geeky.x, this.geeky.y, 'bullet');
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
        this.spirits.children.entries.forEach(spirit => {
            spirit.rotation += 0.02;
            this.physics.moveToObject(spirit, this.geeky, this.baseEnemySpeed * this.difficultyMultiplier);
        });
    }

    updateDifficulty() {
        this.difficultyMultiplier = 1 + Math.floor(this.score / 100) * 0.1;
    }
}
class Scene4 extends BaseScene {
    constructor() {
        super('Scene4');
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
        this.load.image('backdrop4', 'https://play.rosebud.ai/assets/file (13).jpg?rb7B');
        this.load.image('scene4Image', 'https://play.rosebud.ai/assets/file (3).png?QLuM');
        this.load.audio('Scene4Darwin1', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_51_45_Paul_pre_s50_sb75_se0_b_m2.mp3?78kr');
        this.load.audio('Scene4Darwin2', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_51_14_Paul_pre_s50_sb75_se0_b_m2.mp3?Pk7B');
        this.load.audio('Scene4Darwin3', 'https://play.rosebud.ai/assets/ElevenLabs_2024-07-03T11_51_57_Paul_pre_s50_sb75_se0_b_m2.mp3?5FlZ');
        this.load.image('book', 'https://play.rosebud.ai/assets/Open Book.png?LARv');
        this.load.audio('library', 'https://play.rosebud.ai/assets/library.wav?K3X3');
    }

    create() {
        super.create();
        this.createBackground('backdrop4', 'scene4Image');
        this.createGeeky(370, 915);
        this.createKeyboardInputs();
        this.createAmbientMusic('library');
        this.createCloudParticles();
        this.createMeterBars();
        this.createSkeletonKey();

        this.createBooks();
        this.physics.add.overlap(this.geeky, this.books, this.handleBookCollision, null, this);
        this.physics.add.overlap(this.geeky, this.skeletonKey, this.handleSkeletonKeyCollision, null, this);

        this.sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.createDarwinSpeak4Sound1();
    }

    createDarwinSpeak4Sound1() {
        this.darwinSpeak4Sound1 = this.sound.add('Scene4Darwin1', { volume: 0.2 });
        this.darwinSpeak4Sound1.play();
        this.darwinSpeak4Sound1.once('complete', () => {
            this.createDarwinSpeak4Sound2();
            this.startBookSpawning();
            this.bookSpawningActive = true;
        });
    }

    createDarwinSpeak4Sound2() {
        this.darwinSpeak4Sound2 = this.sound.add('Scene4Darwin2', { volume: 0.2 });
        this.darwinSpeak4Sound2.play();
        this.darwinSpeak4Sound2.once('complete', this.createDarwinSpeak4Sound3, this);
    }

    createDarwinSpeak4Sound3() {
        this.darwinSpeak4Sound3 = this.sound.add('Scene4Darwin3', { volume: 0.2 });
        this.darwinSpeak4Sound3.play();
        this.darwinSpeak4Sound3.once('complete', () => {
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

        const randomY = Phaser.Math.Between(this.backdropBounds.top, this.backdropBounds.bottom);
        const spawnLeft = Math.random() < 0.5;
        const book = this.books.create(
            spawnLeft ? this.backdropBounds.left : this.backdropBounds.right,
            randomY,
            'book'
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
        
        this.scene.start('Scene5');
    }

    update(time, delta) {
        super.update(time, delta);

        this.handleSprinting();

        this.books.getChildren().forEach(book => {
            if ((book.x < this.backdropBounds.left && book.body.velocity.x < 0) ||
                (book.x > this.backdropBounds.right && book.body.velocity.x > 0)) {
                book.destroy();
                this.booksSpawned--;
                this.spawnBook();
            }
        });

        if (this.bookSpawningActive && this.books.getChildren().length < this.maxBooks) {
            this.spawnBook();
        }
    }

    handleSprinting() {
        const isSprinting = this.sprintKey.isDown || (this.gamepad && this.gamepad.B);
        
        if (isSprinting && this.gameState.greenMeterValue > 0) {
            this.isSprinting = true;
            this.gameState.greenMeterValue -= this.greenMeterDepletionRate;
        } else {
            this.isSprinting = false;
            if (this.gameState.greenMeterValue < 100) {
                this.gameState.greenMeterValue += this.greenMeterRechargeRate;
            }
        }
        
        this.gameState.greenMeterValue = Phaser.Math.Clamp(this.gameState.greenMeterValue, 0, 100);
        this.updateMeterBars();
    }
}


// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    width: 800,
    height: 1200,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [TitleScene, Scene1, Scene2, Scene3, Scene4,],
    input: {
        gamepad: true
    }
};

window.phaserGame = new Phaser.Game(config);