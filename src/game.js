import Phaser from 'phaser';
import { LogManager } from './LogManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // Load dynamic AI background
    if (window.gameSettings && window.gameSettings.bgUrl) {
      this.load.image('bg', window.gameSettings.bgUrl);
    } else {
      this.load.svg('bg', '/assets/backgrounds/bg.svg');
    }

    // Load P1 assets — custom sprites or default Girl SVGs
    const p1s = window.gameSettings && window.gameSettings.p1Sprites;
    if (p1s && p1s.idle) {
      this.load.svg('p1_stand', p1s.idle);
      this.load.svg('p1_walk', p1s.walk || p1s.idle);
      this.load.svg('p1_jump', p1s.jump || p1s.idle);
      this.load.svg('p1_punch', p1s.punch || p1s.idle);
    } else {
      this.load.svg('p1_stand', '/Girl/player1_stand.svg');
      this.load.svg('p1_walk', '/Girl/player1_walk.svg');
      this.load.svg('p1_jump', '/Girl/player1_jump.svg');
      this.load.svg('p1_punch', '/Girl/player1_punch.svg');
    }

    // Load P2 assets — custom sprites or default Finnish SVGs
    const p2s = window.gameSettings && window.gameSettings.p2Sprites;
    if (p2s && p2s.idle) {
      this.load.svg('p2_stand', p2s.idle);
      this.load.svg('p2_walk', p2s.walk || p2s.idle);
      this.load.svg('p2_jump', p2s.jump || p2s.idle);
      this.load.svg('p2_punch', p2s.punch || p2s.idle);
    } else {
      this.load.svg('p2_stand', '/Finnish/Stand.svg');
      this.load.svg('p2_walk', '/Finnish/Walk.svg');
      this.load.svg('p2_jump', '/Finnish/Jump.svg');
      this.load.svg('p2_punch', '/Finnish/Punch.svg');
    }
  }

  getKeyCode(keyStr) {
    if (!keyStr) return Phaser.Input.Keyboard.KeyCodes.SPACE;
    keyStr = keyStr.toUpperCase();
    if (Phaser.Input.Keyboard.KeyCodes[keyStr]) {
      return Phaser.Input.Keyboard.KeyCodes[keyStr];
    }
    return Phaser.Input.Keyboard.KeyCodes.SPACE;
  }

  create() {
    // Background
    this.add.image(400, 300, 'bg').setDisplaySize(800, 600);

    // Platforms group (invisible)
    this.platforms = this.physics.add.staticGroup();

    // Ground platform — invisible, full width at bottom
    const ground = this.add.rectangle(400, 585, 800, 30, 0x000000, 0);
    this.platforms.add(ground);
    ground.body.setSize(800, 30);

    // Player 1
    this.p1 = this.physics.add.sprite(200, 100, 'p1_stand');
    this.p1.setScale(0.15);
    this.p1.setBounce(0.1);
    this.p1.setCollideWorldBounds(true);
    this.p1.damagePercent = 0;
    this.p1.health = 100;
    this.p1.isPunching = false;

    // Player 2
    this.p2 = this.physics.add.sprite(600, 100, 'p2_stand');
    this.p2.setScale(0.15);
    this.p2.setBounce(0.1);
    this.p2.setCollideWorldBounds(true);
    this.p2.damagePercent = 0;
    this.p2.health = 100;
    this.p2.isPunching = false;

    // Collisions
    this.physics.add.collider(this.p1, this.platforms);
    this.physics.add.collider(this.p2, this.platforms);
    this.physics.add.collider(this.p1, this.p2, this.handlePlayerCollision, null, this);

    // Controls P1
    this.keysP1 = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      punch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    };

    // Controls P2
    this.keysP2 = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      punch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
    };

    // UI elements references
    this.p1ScoreText = document.getElementById('p1-score');
    this.p2ScoreText = document.getElementById('p2-score');
    this.p1HealthBar = document.getElementById('p1-health-bar');
    this.p2HealthBar = document.getElementById('p2-health-bar');

    this.updateScoreUI();
  }

  update() {
    this.handlePlayerMovement(this.p1, this.keysP1, 'p1');
    this.handlePlayerMovement(this.p2, this.keysP2, 'p2');

    this.checkBlastZones(this.p1);
    this.checkBlastZones(this.p2);

    this.handleTrailingGhost(this.p1);
    this.handleTrailingGhost(this.p2);
  }

  handlePlayerMovement(player, keys, prefix) {
    const jumpForce = -750;
    let state = 'stand';

    // Punching
    if (keys.punch.isDown && !player.isPunching) {
      player.isPunching = true;
      player.setTexture(`${prefix}_punch`);
      this.time.delayedCall(200, () => { player.isPunching = false; });
      return;
    }

    if (player.isPunching) return;

    // Movement
    if (keys.left.isDown) {
      player.setAccelerationX(-2000);
      player.setFlipX(true);
      state = 'walk';
    } else if (keys.right.isDown) {
      player.setAccelerationX(2000);
      player.setFlipX(false);
      state = 'walk';
    } else {
      player.setAccelerationX(0);
      player.setDragX(player.body.touching.down ? 3000 : 500);
      state = 'stand';
    }

    if (!player.body.touching.down) {
      state = 'jump';
    }

    if (keys.up.isDown && player.body.touching.down) {
      player.setVelocityY(jumpForce);
    }

    player.setTexture(`${prefix}_${state}`);
  }

  handleTrailingGhost(player) {
    if (Math.abs(player.body.velocity.x) > 500 || Math.abs(player.body.velocity.y) > 500) {
      const ghost = this.add.sprite(player.x, player.y, player.texture.key);
      ghost.setScale(player.scaleX, player.scaleY);
      ghost.setFlipX(player.flipX);
      ghost.setAlpha(0.5);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 200,
        onComplete: () => ghost.destroy()
      });
    }
  }

  handlePlayerCollision(p1, p2) {
    if (p1.isPunching || p2.isPunching) {
      const attacker = p1.isPunching ? p1 : p2;
      const victim = p1.isPunching ? p2 : p1;

      victim.health -= 10;
      victim.damagePercent += 15;

      this.applyHitEffect();
      this.applyKnockback(attacker, victim, 1.2);

      if (victim.health <= 0) {
        this.gameOver(attacker === this.p1 ? "P1" : "P2");
      }
    }
    this.updateScoreUI();
  }

  applyHitEffect() {
    this.physics.world.pause();
    this.time.delayedCall(100, () => {
      this.physics.world.resume();
    });
    this.cameras.main.shake(100, 0.015);
  }

  applyKnockback(attacker, victim, multiplierModifier = 1) {
    const knockbackBaseX = 400;
    const knockbackBaseY = -300;
    const multiplier = (1 + (victim.damagePercent / 40)) * multiplierModifier;
    const dirX = Math.sign(victim.x - attacker.x) || 1;
    victim.setVelocityX(dirX * knockbackBaseX * multiplier);
    victim.setVelocityY(knockbackBaseY * multiplier);
  }

  checkBlastZones(player) {
    if (player.x < -150 || player.x > 950 || player.y > 650 || player.y < -400) {
      this.respawn(player);
    }
  }

  respawn(player) {
    player.health -= 20;
    player.damagePercent = 0;

    if (player.health <= 0) {
      this.gameOver(player === this.p1 ? "P2" : "P1");
      return;
    }

    player.setPosition(400, 100);
    player.setVelocity(0, 0);
    player.setAcceleration(0, 0);
    this.updateScoreUI();
  }

  gameOver(winner) {
    LogManager.log('FATALITY_INIT');
    this.scene.pause();

    // Arcade-style game over overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';
    overlay.innerHTML = `
      <div class="game-over-title">${winner} WINS!</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#aaa;margin-bottom:20px;">K.O.</div>
      <button class="game-over-btn" onclick="location.reload()">▶ REMATCH</button>
      <button class="game-over-btn" onclick="location.reload()" style="margin-top:6px;background:linear-gradient(180deg,#333 0%,#222 100%);border-color:#555;">✕ MAIN MENU</button>
    `;
    document.getElementById('game-container').appendChild(overlay);
  }

  updateScoreUI() {
    if (this.p1ScoreText && this.p2ScoreText) {
      this.p1ScoreText.innerText = `${this.p1.damagePercent}%`;
      this.p2ScoreText.innerText = `${this.p2.damagePercent}%`;
      this.p1HealthBar.style.width = `${Math.max(0, this.p1.health)}%`;
      this.p2HealthBar.style.width = `${Math.max(0, this.p2.health)}%`;

      // Change bar color when health is low
      if (this.p1.health <= 30) {
        this.p1HealthBar.style.background = 'repeating-linear-gradient(90deg, #ff4444 0px, #ff4444 6px, #cc0000 6px, #cc0000 12px)';
      }
      if (this.p2.health <= 30) {
        this.p2HealthBar.style.background = 'repeating-linear-gradient(90deg, #ff4444 0px, #ff4444 6px, #cc0000 6px, #cc0000 12px)';
      }
    }
  }
}