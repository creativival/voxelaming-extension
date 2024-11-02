import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './voxelamming_40x40_transparent.png';
import {
  addVectors,
  getRotationMatrix,
  matrixMultiply,
  transformPointByRotationMatrix,
  transpose3x3
} from './matrixUtil.js'

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.defaultMessage;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
  const localeSetup = formatMessage.setup();
  if (localeSetup && localeSetup.translations[localeSetup.locale]) {
    Object.assign(
      localeSetup.translations[localeSetup.locale],
      translations[localeSetup.locale]
    );
  }
};

const EXTENSION_ID = 'voxelamming';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://creativival.github.io/voxelamming-extension/dist/voxelamming.mjs';

/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {

  /**
   * @return {string} - the name of this extension.
   */
  static get EXTENSION_NAME() {
    return formatMessage({
      id: 'voxelamming.name',
      default: 'Voxelamming',
      description: 'name of the extension'
    });
  }

  /**
   * @return {string} - the ID of this extension.
   */
  static get EXTENSION_ID() {
    return EXTENSION_ID;
  }

  /**
   * URL to get this extension.
   * @type {string}
   */
  static get extensionURL() {
    return extensionURL;
  }

  /**
   * Set URL to get this extension.
   * The extensionURL will be changed to the URL of the loading server.
   * @param {string} url - URL
   */
  static set extensionURL(url) {
    extensionURL = url;
  }

  /**
   * Construct a set of blocks for Voxelamming.
   * @param {Runtime} runtime - the Scratch 3.0 runtime.
   */
  constructor(runtime) {
    /**
     * The Scratch 3.0 runtime.
     * @type {Runtime}
     */
    this.runtime = runtime;
    this.roomName = '1000'
    this.textureNames = ["grass", "stone", "dirt", "planks", "bricks"];
    this.modelNames = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Sun",
      "Moon", "ToyBiplane", "ToyCar", "Drummer", "Robot", "ToyRocket", "RocketToy1", "RocketToy2", "Skull"];
    this.isAllowedMatrix = 0;
    this.savedMatrices = [];
    this.nodeTransform = [0, 0, 0, 0, 0, 0];
    this.matrixTransform = [0, 0, 0, 0, 0, 0];
    this.frameTransforms = [];
    this.globalAnimation = [0, 0, 0, 0, 0, 0, 1, 0]
    this.animation = [0, 0, 0, 0, 0, 0, 1, 0]
    this.boxes = [];
    this.frames = [];
    this.sentences = []
    this.lights = [];
    this.commands = [];
    this.models = [];
    this.modelMoves = [];
    this.sprites = [];
    this.spriteMoves = [];
    this.gameScore = [];
    this.gameScreen = [];
    this.size = 1.0;
    this.shape = 'box'
    this.isMetallic = 0
    this.roughness = 0.5
    this.isAllowedFloat = 0
    this.buildInterval = 0.01;
    this.isFraming = false;
    this.frameId = 0;
    this.rotationStyles = {}; // 回転の制御（送信しない）
    this.spriteScales = {}; // スプライトのスケールを保存（送信しない）
    this.spriteCloneMoves = {}; // スプライトのスケールを保存（送信しない）
    this.socket = null;
    this.inactivityTimeout = null; // 非アクティブタイマー
    this.inactivityDelay = 2000; // 2秒後に接続を切断
    this.spriteBaseSize = 35; // スプライトのデフォルトサイズ（spriteImageSizeが変更されたら計算し直す）
    this.spriteImageSize = 128; // スプライトのデフォルトサイズ（もし変更する時のみ設定する）
    this.winndowSize = [480, 360]  // ウィンドウサイズ

    if (runtime.formatMessage) {
      // Replace 'formatMessage' to a formatter which is used in the runtime.
      formatMessage = runtime.formatMessage;
    }
  }

  /**
   * @returns {object} metadata for this extension and its blocks.
   */
  getInfo() {
    setupTranslations();
    return {
      id: ExtensionBlocks.EXTENSION_ID,
      name: ExtensionBlocks.EXTENSION_NAME,
      extensionURL: ExtensionBlocks.extensionURL,
      blockIconURI: blockIcon,
      showStatusButton: false,
      blocks: [
        {
          opcode: 'setRoomName',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setRoomName',
            default: 'Set room name to [ROOMNAME]',
            description: 'set room name'
          }),
          arguments: {
            ROOMNAME: {
              type: ArgumentType.STRING,
              defaultValue: '1000'
            }
          }
        },
        {
          opcode: 'setBoxSize',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setBoxSize',
            default: 'Set box size to [BOXSIZE]',
            description: 'set box size'
          }),
          arguments: {
            BOXSIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 1.0
            }
          }
        },
        {
          opcode: 'changeShape',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.changeShape',
            default: 'Change shape: [SHAPE]',
            description: 'change shape'
          }),
          arguments: {
            SHAPE: {
              type: ArgumentType.STRING,
              defaultValue: 'box',
              menu: 'shapeTypeMenu'
            }
          }
        },
        {
          opcode: 'changeMaterial',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.changeMaterial',
            default: 'Change material: metallic: [IS_METALLIC] roughness: [ROUGHNESS]',
            description: 'change material'
          }),
          arguments: {
            IS_METALLIC: {
              type: ArgumentType.STRING,
              defaultValue: 'off',
              menu: 'onOrOffMenu'
            },
            ROUGHNESS: {
              type: ArgumentType.NUMBER,
              defaultValue: 0.5
            }
          }
        },
        {
          opcode: 'setBuildInterval',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setBuildInterval',
            default: 'Set build interval to [INTERVAL]',
            description: 'set build interval'
          }),
          arguments: {
            INTERVAL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0.01
            }
          }
        },
        {
          opcode: 'createBox',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.createBox',
            default: 'Create box at x: [X] y: [Y] z: [Z] r: [R] g: [G] b: [B] alpha: [ALPHA]',
            description: 'create box'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            R: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            G: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            B: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ALPHA: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'createTexturedBox',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.createTexturedBox',
            default: 'Create box at x: [X] y: [Y] z: [Z] texture: [TEXTURE]',
            description: 'create textured box'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            TEXTURE: {
              type: ArgumentType.STRING,
              defaultValue: 'grass',
              menu: 'textureTypeMenu'
            }
          }
        },
        {
          opcode: 'removeBox',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.removeBox',
            default: 'Remove box at x: [X] y: [Y] z: [Z]',
            description: 'remove box'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'sendData',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.sendData',
            default: 'Send data',
            description: 'send data to server'
          }),
        },
        {
          opcode: 'sendAndRecordData',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.sendAndRecordData',
            default: 'Send data and record as [NAME]',
            description: 'send data to server'
          }),
          arguments: {
            NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Title'
            }
          }
        },
        {
          opcode: 'clearData',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.clearData',
            default: 'Clear data',
            description: 'clear data'
          }),
        },
        {
          opcode: 'setNode',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setNode',
            default: 'Set node at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL]',
            description: 'set node'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'animateNode',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.animateNode',
            default: 'Animate node at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL] scale: [SCALE] interval: [INTERVAL]',
            description: 'animate node'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SCALE: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            INTERVAL: {
              type: ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'animateGlobal',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.animateGlobal',
            default: 'Animate global at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL] scale: [SCALE] interval: [INTERVAL]',
            description: 'animate global'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SCALE: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            INTERVAL: {
              type: ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'writeSentence',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.writeSentence',
            default: 'Write [SENTENCE] at x: [X] y: [Y] z: [Z] r: [R] g: [G] b: [B] alpha: [ALPHA] fontsize: [FONTSIZE] fixed width: [IS_FIXED_WIDTH]',
            description: 'write sentence'
          }),
          arguments: {
            SENTENCE: {
              type: ArgumentType.STRING,
              defaultValue: 'Hello World'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            R: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            G: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            B: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ALPHA: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            FONTSIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 16
            },
            IS_FIXED_WIDTH: {
              type: ArgumentType.STRING,
              defaultValue: 'off',
              menu: 'onOrOffMenu'
            }
          }
        },
        {
          opcode: 'setLight',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setLight',
            default: 'Set light at x: [X] y: [Y] z: [Z] r: [R] g: [G] b: [B] alpha: [ALPHA] intensity: [INTENSITY] interval: [INTERVAL] type: [LIGHT_TYPE]',
            description: 'set light'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            R: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            G: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            B: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ALPHA: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            INTENSITY: {
              type: ArgumentType.NUMBER,
              defaultValue: 1000
            },
            INTERVAL: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            LIGHT_TYPE: {
              type: ArgumentType.STRING,
              defaultValue: "point",
              menu: 'lightTypeMenu'
            }
          }
        },
        {
          opcode: 'setCommand',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setCommand',
            default: 'Set command [COMMAND]',
            description: 'set command'
          }),
          arguments: {
            COMMAND: {
              type: ArgumentType.STRING,
              defaultValue: 'axis'
            }
          }
        },
        {
          opcode: 'drawLine',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.drawLine',
            default: 'Draw line x1: [X1] y1: [Y1] z1: [Z1] x2: [X2] y2: [Y2] z2: [Z2] r: [R] g: [G] b: [B] alpha: [ALPHA]',
            description: 'draw line'
          }),
          arguments: {
            X1: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y1: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z1: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            X2: {
              type: ArgumentType.NUMBER,
              defaultValue: 5
            },
            Y2: {
              type: ArgumentType.NUMBER,
              defaultValue: 10
            },
            Z2: {
              type: ArgumentType.NUMBER,
              defaultValue: 20
            },
            R: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            G: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            B: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ALPHA: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'makePlyModel',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.makePlyModel',
            default: 'Make a ply model list: [LIST_CONTENT] at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL]',
            description: 'make a ply model'
          }),
          arguments: {
            LIST_CONTENT: {
              type: ArgumentType.STRING,
              defaultValue: 'plyFile'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'createModel',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.createModel',
            default: 'Create a default model [MODEL_NAME] at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL] scale: [SCALE] entityName: [ENTITY_NAME]',
            description: 'create model'
          }),
          arguments: {
            MODEL_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Skull',
              menu: 'modelNameMenu'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SCALE: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            ENTITY_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'SkullEntity'
            }
          }
        },
        {
          opcode: 'moveModel',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.moveModel',
            default: 'Move a entity model [ENTITY_NAME] at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL] scale: [SCALE]',
            description: 'create model'
          }),
          arguments: {
            ENTITY_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'SkullEntity'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Z: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SCALE: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            }
          },
        },
        {
          opcode: 'setGameScreen',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setGameScreen',
            default: 'Set Game Screen angle: [ANGLE] r: [R] g: [G] b: [B] alpha: [ALPHA]',
            description: 'set game screen'
          }),
          arguments: {
            ANGLE: {
              type: ArgumentType.NUMBER,
              defaultValue: 90
            },
            R: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            G: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            B: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            ALPHA: {
              type: ArgumentType.NUMBER,
              defaultValue: 0.3
            }
          }
        },
        {
          opcode: 'setGameScore',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setGameScore',
            default: 'Set Game Score: [GAME_SCORE] position: [POSITION]',
            description: 'set game score'
          }),
          arguments: {
            GAME_SCORE: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            POSITION: {
              type: ArgumentType.STRING,
              defaultValue: 'top-left',
              menu: 'positionMenu'
            }
          }
        },
        {
          opcode: 'sendGameOver',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.sendGameOver',
            default: 'Send Game Over',
            description: 'send game over'
          })
        },
        {
          opcode: 'sendGameClear',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.sendGameClear',
            default: 'Send Game Clear',
            description: 'send game clear'
          })
        },
        // { // setSpriteImageSizeに変更
        //   opcode: 'setSpriteBaseSize',
        //   blockType: BlockType.COMMAND,
        //   text: formatMessage({
        //     id: 'voxelamming.setSpriteBaseSize',
        //     default: 'Set sprite base size: [SPRITE_BASE_SIZE]',
        //     description: 'set sprite base size'
        //   }),
        //   arguments: {
        //     SPRITE_BASE_SIZE: {
        //       type: ArgumentType.NUMBER,
        //       defaultValue: 35
        //     }
        //   }
        // },
        {
          opcode: 'setSpriteImageSize',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setSpriteImageSize',
            default: 'Set sprite image size: [SPRITE_IMAGE_SIZE]',
            description: 'set sprite image size'
          }),
          arguments: {
            SPRITE_IMAGE_SIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 128
            }
          }
        },
        {
          opcode: 'setRotationStyle',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setRotationStyle',
            default: 'Set rotation style spriteName: [SPRITE_NAME] style: [ROTATION_STYLE]',
            description: 'change material'
          }),
          arguments: {
            SPRITE_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Sprite1'
            },
            ROTATION_STYLE: {
              type: ArgumentType.STRING,
              defaultValue: 'left-right',
              menu: 'rotationStyleMenu'
            }
          }
        },
        {
          opcode: 'createSprite',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.createSprite',
            default: 'Create [SPRITE_NAME] list [COLOR_LIST] at x: [X] y: [Y] direction: [DIRECTION] size: [SIZE] visible: [VISIBLE]',
            description: 'create sprite'
          }),
          arguments: {
            SPRITE_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Sprite1'
            },
            COLOR_LIST: {
              type: ArgumentType.STRING,
              defaultValue: 'colorList'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            DIRECTION: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 50
            },
            VISIBLE: {
              type: ArgumentType.STRING,
              defaultValue: 'on',
              menu: 'onOrOffMenu'
            }
          }
        },
        {
          opcode: 'moveSprite',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.moveSprite',
            default: 'Move [SPRITE_NAME] at x: [X] y: [Y] direction: [DIRECTION] size: [SIZE] visible: [VISIBLE]',
            description: 'create sprite'
          }),
          arguments: {
            SPRITE_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Sprite1'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            DIRECTION: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 50
            },
            VISIBLE: {
              type: ArgumentType.STRING,
              defaultValue: 'on',
              menu: 'onOrOffMenu'
            }
          }
        },
        {
          opcode: 'moveSpriteClone',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.moveSpriteClone',
            default: 'Move [SPRITE_NAME] clone id: [CLONE_ID] at x: [X] y: [Y] direction: [DIRECTION] visible: [VISIBLE]',
            description: 'create sprite'
          }),
          arguments: {
            SPRITE_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Sprite1'
            },
            CLONE_ID: {
              type: ArgumentType.NUMBER,
              defaultValue: '1'
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            DIRECTION: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 50
            },
            VISIBLE: {
              type: ArgumentType.STRING,
              defaultValue: 'on',
              menu: 'onOrOffMenu'
            }
          }
        },
        {
          opcode: 'displayDot',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.displayDot',
            default: 'Display a dot at x: [X] y: [Y] direction: [DIRECTION] color id: [COLOR_ID] width: [WIDTH] height: [HEIGHT]',
            description: 'display a dot'
          }),
          arguments: {
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            DIRECTION: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            COLOR_ID: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            WIDTH: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
            HEIGHT: {
              type: ArgumentType.NUMBER,
              defaultValue: 1
            },
          }
        },
        {
          opcode: 'displayText',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.displayText',
            default: 'Display text at x: [X] y: [Y] direction: [DIRECTION] size: [SIZE] color id: [COLOR_ID] vertical: [VERTICAL]',
            description: 'create sprite'
          }),
          arguments: {
            TEXT: {
              type: ArgumentType.STRING,
              defaultValue: 'Hello World',
            },
            X: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            DIRECTION: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            SIZE: {
              type: ArgumentType.NUMBER,
              defaultValue: 50
            },
            COLOR_ID: {
              type: ArgumentType.NUMBER,
              defaultValue: 0
            },
            VERTICAL: {
              type: ArgumentType.STRING,
              defaultValue: 'off',
              menu: 'onOrOffMenu'
            },
            ALIGN: {
              type: ArgumentType.STRING,
              defaultValue: 'off',
              menu: 'alignMenu'
            }
          }
        },
        {
          opcode: 'getSpriteProperties',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.getSpriteProperties',
            default: 'Get properties of [SPRITE_NAME]',
            description: 'get sprite position'
          }),
          arguments: {
            SPRITE_NAME: {
              type: ArgumentType.STRING,
              defaultValue: 'Sprite1'
            }
          }
        },
        {
          opcode: 'pushMatrix',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.pushMatrix',
            default: 'Push Matrix',
            description: 'push matrix'
          }),
        },
        {
          opcode: 'popMatrix',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.popMatrix',
            default: 'Pop Matrix',
            description: 'pop matrix'
          }),
        },
        {
          opcode: 'setFrameFPS',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setFrameFPS',
            default: 'Set Frame FPS: [FPS]',
            description: 'set frame fps'
          }),
          arguments: {
            FPS: {
              type: ArgumentType.NUMBER,
              defaultValue: 2
            }
          }
        },
        {
          opcode: 'setFrameRepeats',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.setFrameRepeats',
            default: 'Set Frame Repeats: [REPEATS]',
            description: 'set frame repeats'
          }),
          arguments: {
            REPEATS: {
              type: ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'frameIn',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.frameIn',
            default: 'Frame In',
            description: 'frame in'
          }),
        },
        {
          opcode: 'frameOut',
          blockType: BlockType.COMMAND,
          text: formatMessage({
            id: 'voxelamming.frameOut',
            default: 'Frame Out',
            description: 'frame out'
          }),
        }
      ],
      menus: {
        shapeTypeMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.box',
                default: 'box',
                description: 'Menu item for box'
              }),
              value: 'box'
            },
            {
              text: formatMessage({
                id: 'voxelamming.sphere',
                default: 'sphere',
                description: 'Menu item for sphere'
              }),
              value: 'sphere'
            },
            {
              text: formatMessage({
                id: 'voxelamming.plane',
                default: 'plane',
                description: 'Menu item for plane'
              }),
              value: 'plane'
            }
          ]
        },
        textureTypeMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.grass',
                default: 'grass',
                description: 'Menu item for grass'
              }),
              value: 'grass'
            },
            {
              text: formatMessage({
                id: 'voxelamming.stone',
                default: 'stone',
                description: 'Menu item for stone'
              }),
              value: 'stone'
            },
            {
              text: formatMessage({
                id: 'voxelamming.dirt',
                default: 'dirt',
                description: 'Menu item for dirt'
              }),
              value: 'dirt'
            },
            {
              text: formatMessage({
                id: 'voxelamming.planks',
                default: 'planks',
                description: 'Menu item for planks'
              }),
              value: 'planks'
            },
            {
              text: formatMessage({
                id: 'voxelamming.bricks',
                default: 'bricks',
                description: 'Menu item for bricks'
              }),
              value: 'bricks'
            },
          ]
        },
        lightTypeMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.point',
                default: 'point',
                description: 'Menu item for point'
              }),
              value: 'point'
            },
            {
              text: formatMessage({
                id: 'voxelamming.spot',
                default: 'spot',
                description: 'Menu item for spot'
              }),
              value: 'spot'
            },
            {
              text: formatMessage({
                id: 'voxelamming.directional',
                default: 'directional',
                description: 'Menu item for directional'
              }),
              value: 'directional'
            }
          ]
        },
        onOrOffMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.off',
                default: 'off',
                description: 'Menu item for off'
              }),
              value: 'off'
            },
            {
              text: formatMessage({
                id: 'voxelamming.on',
                default: 'on',
                description: 'Menu item for on'
              }),
              value: 'on'
            }
          ]
        },
        alignMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.top-left',
                default: 'top-left',
                description: 'Menu item for top-left'
              }),
              value: 'top-left'
            },
            {
              text: formatMessage({
                id: 'voxelamming.top-center',
                default: 'top-center',
                description: 'Menu item for top-center'
              }),
              value: 'top-center'
            },
            {
              text: formatMessage({
                id: 'voxelamming.top-right',
                default: 'top-right',
                description: 'Menu item for top-right'
              }),
              value: 'top-right'
            },
            {
              text: formatMessage({
                id: 'voxelamming.middle-left',
                default: 'middle-left',
                description: 'Menu item for middle-left'
              }),
              value: 'middle-left'
            },
            {
              text: formatMessage({
                id: 'voxelamming.middle-center',
                default: 'middle-center',
                description: 'Menu item for middle-center'
              }),
              value: 'middle-center'
            },
            {
              text: formatMessage({
                id: 'voxelamming.middle-right',
                default: 'middle-right',
                description: 'Menu item for middle-right'
              }),
              value: 'middle-right'
            },
            {
              text: formatMessage({
                id: 'voxelamming.bottom-left',
                default: 'bottom-left',
                description: 'Menu item for bottom-left'
              }),
              value: 'bottom-left'
            },
            {
              text: formatMessage({
                id: 'voxelamming.bottom-center',
                default: 'bottom-center',
                description: 'Menu item for bottom-center'
              }),
              value: 'bottom-center'
            },
            {
              text: formatMessage({
                id: 'voxelamming.bottom-right',
                default: 'bottom-right',
                description: 'Menu item for bottom-right'
              }),
              value: 'bottom-right'
            },
          ]
        },
        modelNameMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.Mercury',
                default: 'Mercury',
                description: 'Menu item for Mercury'
              }),
              value: 'Mercury'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Venus',
                default: 'Venus',
                description: 'Menu item for Venus'
              }),
              value: 'Venus'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Earth',
                default: 'Earth',
                description: 'Menu item for Earth'
              }),
              value: 'Earth'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Mars',
                default: 'Mars',
                description: 'Menu item for Mars'
              }),
              value: 'Mars'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Jupiter',
                default: 'Jupiter',
                description: 'Menu item for Jupiter'
              }),
              value: 'Jupiter'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Saturn',
                default: 'Saturn',
                description: 'Menu item for Saturn'
              }),
              value: 'Saturn'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Uranus',
                default: 'Uranus',
                description: 'Menu item for Uranus'
              }),
              value: 'Uranus'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Neptune',
                default: 'Neptune',
                description: 'Menu item for Neptune'
              }),
              value: 'Neptune'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Pluto',
                default: 'Pluto',
                description: 'Menu item for Pluto'
              }),
              value: 'Pluto'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Sun',
                default: 'Sun',
                description: 'Menu item for Sun'
              }),
              value: 'Sun'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Moon',
                default: 'Moon',
                description: 'Menu item for Moon'
              }),
              value: 'Moon'
            },
            {
              text: formatMessage({
                id: 'voxelamming.ToyBiplane',
                default: 'ToyBiplane',
                description: 'Menu item for ToyBiplane'
              }),
              value: 'ToyBiplane'
            },
            {
              text: formatMessage({
                id: 'voxelamming.ToyCar',
                default: 'ToyCar',
                description: 'Menu item for ToyCar'
              }),
              value: 'ToyCar'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Drummer',
                default: 'Drummer',
                description: 'Menu item for Drummer'
              }),
              value: 'Drummer'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Robot',
                default: 'Robot',
                description: 'Menu item for Robot'
              }),
              value: 'Robot'
            },
            {
              text: formatMessage({
                id: 'voxelamming.ToyRocket',
                default: 'ToyRocket',
                description: 'Menu item for ToyRocket'
              }),
              value: 'ToyRocket'
            },
            {
              text: formatMessage({
                id: 'voxelamming.RocketToy1',
                default: 'RocketToy1',
                description: 'Menu item for RocketToy1'
              }),
              value: 'RocketToy1'
            },
            {
              text: formatMessage({
                id: 'voxelamming.RocketToy2',
                default: 'RocketToy2',
                description: 'Menu item for RocketToy2'
              }),
              value: 'RocketToy2'
            },
            {
              text: formatMessage({
                id: 'voxelamming.Skull',
                default: 'Skull',
                description: 'Menu item for Skull'
              }),
              value: 'Skull'
            },
          ]
        },
        rotationStyleMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.left-right',
                default: 'left-right',
                description: 'Menu item for left-right'
              }),
              value: 'left-right'
            },
            {
              text: formatMessage({
                id: "voxelamming.don't-rotate",
                default: "don't rotate",
                description: "Menu item for don't rotate"
              }),
              value: "don't rotate"
            },
            {
              text: formatMessage({
                id: 'voxelamming.all-around',
                default: 'all around',
                description: 'Menu item for all around'
              }),
              value: 'all around'
            }
          ]
        },
        positionMenu: {
          acceptReporters: false,
          items: [
            {
              text: formatMessage({
                id: 'voxelamming.top-left',
                default: 'top-left',
                description: 'Menu item for top-left'
              }),
              value: 'top-left'
            },
            {
              text: formatMessage({
                id: 'voxelamming.top-right',
                default: 'top-right',
                description: 'Menu item for top-right'
              }),
              value: 'top-right'
            },
            {
              text: formatMessage({
                id: 'voxelamming.bottom-left',
                default: 'bottom-left',
                description: 'Menu item for bottom-left'
              }),
              value: 'bottom-left'
            },
            {
              text: formatMessage({
                id: 'voxelamming.bottom-right',
                default: 'bottom-right',
                description: 'Menu item for bottom-right'
              }),
              value: 'bottom-right'
            },
            {
              text: formatMessage({
                id: 'voxelamming.center',
                default: 'center',
                description: 'Menu item for center'
              }),
              value: 'center'
            },
          ]
        },
      }
    };
  }

  setRoomName(args) {
    this.roomName = args.ROOMNAME;
  }

  clearData() {
    // this.roomName = '1000'; // 初期化しない（明示的に変更されるまで同じ値を使用する）
    this.isAllowedMatrix = 0;
    this.savedMatrices = [];
    this.nodeTransform = [0, 0, 0, 0, 0, 0];
    this.matrixTransform = [0, 0, 0, 0, 0, 0];
    this.frameTransforms = [];
    this.globalAnimation = [0, 0, 0, 0, 0, 0, 1, 0]
    this.animation = [0, 0, 0, 0, 0, 0, 1, 0]
    this.boxes = [];
    this.frames = [];
    this.sentences = []
    this.lights = [];
    this.commands = [];
    this.models = [];
    this.modelMoves = [];
    this.sprites = [];
    this.spriteMoves = [];
    this.gameScore = [];
    this.gameScreen = [];
    this.size = 1.0;
    this.shape = 'box'
    this.isMetallic = 0
    this.roughness = 0.5
    this.isAllowedFloat = 0
    this.buildInterval = 0.01;
    this.isFraming = false;
    this.frameId = 0;
    // this.rotationStyles = {}; // 初期化しない（クローン送信のため）
    // this.spriteScales = {}; // 初期化しない（クローン送信のため）
    this.spriteCloneMoves = {}; // スプライトのスケールを保存（送信しない）
    this.spriteBaseSize = 35; // スプライトのデフォルトサイズ（spriteImageSizeを変更したときに計算し直す）
    this.spriteImageSize = 128; // スプライトの画像デフォルトサイズ（もし変更する時のみ設定する）
  }

  setFrameFPS(args) {
    const fps = args.FPS
    this.commands.push(`fps ${fps}`);
  }

  setFrameRepeats(args) {
    const repeats = args.REPEATS
    this.commands.push(`repeats ${repeats}`);
  }

  frameIn() {
    this.isFraming = true;
  }

  frameOut() {
    this.isFraming = false;
    this.frameId++;
  }

  pushMatrix() {
    this.isAllowedMatrix++;
    this.savedMatrices.push(this.matrixTransform);
  }

  popMatrix() {
    this.isAllowedMatrix--;
    this.matrixTransform = this.savedMatrices.pop();
  }

  setNode(args) {  // method name changed from translate to setNode.
    const _x = Number(args.X);
    const _y = Number(args.Y);
    const _z = Number(args.Z);
    let [x, y, z] = this.roundNumbers([_x, _y, _z]);
    const pitch = Number(args.PITCH);
    const yaw = Number(args.YAW);
    const roll = Number(args.ROLL);

    if (this.isAllowedMatrix) {
      const matrix = this.savedMatrices[this.savedMatrices.length - 1];
      const basePosition = matrix.slice(0, 3);

      let baseRotationMatrix;
      if (matrix.length === 6) {
        baseRotationMatrix = getRotationMatrix(...matrix.slice(3));
      } else {
        baseRotationMatrix = [
          matrix.slice(3, 6),
          matrix.slice(6, 9),
          matrix.slice(9, 12)
        ];
      }

      const [addX, addY, addZ] = transformPointByRotationMatrix([x, y, z], transpose3x3(baseRotationMatrix));

      [x, y, z] = addVectors(basePosition, [addX, addY, addZ]);
      [x, y, z] = this.roundNumbers([x, y, z]);

      const translateRotationMatrix = getRotationMatrix(-pitch, -yaw, -roll);
      const rotateMatrix = matrixMultiply(translateRotationMatrix, baseRotationMatrix);

      this.matrixTransform = [x, y, z, ...rotateMatrix[0], ...rotateMatrix[1], ...rotateMatrix[2]];
    } else {
      [x, y, z] = this.roundNumbers([x, y, z]);

      if (this.isFraming) {
        this.frameTransforms.push([x, y, z, pitch, yaw, roll, this.frameId]);
      } else {
        this.nodeTransform = [x, y, z, pitch, yaw, roll];
      }
    }
  }

  createBox(args) {
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    let r = Number(args.R);
    let g = Number(args.G);
    let b = Number(args.B);
    let alpha = Number(args.ALPHA);

    if (this.isAllowedMatrix) {
      // 移動用のマトリックスにより位置を計算する
      const matrix = this.matrixTransform;
      const basePosition = matrix.slice(0, 3);

      let baseRotationMatrix;
      if (matrix.length === 6) {
        baseRotationMatrix = getRotationMatrix(...matrix.slice(3));
      } else {
        baseRotationMatrix = [
          matrix.slice(3, 6),
          matrix.slice(6, 9),
          matrix.slice(9, 12)
        ];
      }

      const [addX, addY, addZ] = transformPointByRotationMatrix([x, y, z], transpose3x3(baseRotationMatrix));
      [x, y, z] = addVectors(basePosition, [addX, addY, addZ]);
    }

    [x, y, z] = this.roundNumbers([x, y, z]);
    [r, g, b, alpha] = this.roundTwoDecimals([r, g, b, alpha]);

    // 重ねて置くことを防止するために、同じ座標の箱があれば削除する
    this.removeBox({X: x, Y: y, Z: z});

    if (this.isFraming) {
      this.frames.push([x, y, z, r, g, b, alpha, -1, this.frameId]);
    } else {
      this.boxes.push([x, y, z, r, g, b, alpha, -1]);
    }
  }

  createTexturedBox(args) {
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    const texture = args.TEXTURE;

    if (this.isAllowedMatrix) {
      // 移動用のマトリックスにより位置を計算する
      const matrix = this.matrixTransform;
      const basePosition = matrix.slice(0, 3);

      let baseRotationMatrix;
      if (matrix.length === 6) {
        baseRotationMatrix = getRotationMatrix(...matrix.slice(3));
      } else {
        baseRotationMatrix = [
          matrix.slice(3, 6),
          matrix.slice(6, 9),
          matrix.slice(9, 12)
        ];
      }

      const [addX, addY, addZ] = transformPointByRotationMatrix([x, y, z], transpose3x3(baseRotationMatrix));
      [x, y, z] = addVectors(basePosition, [addX, addY, addZ]);
    }

    [x, y, z] = this.roundNumbers([x, y, z]);

    let textureId;
    if (!this.textureNames.includes(texture)) {
      textureId = -1;
    } else {
      textureId = this.textureNames.indexOf(texture);
    }
    // 重ねて置くことを防止するために、同じ座標の箱があれば削除する
    this.removeBox({X: x, Y: y, Z: z});

    if (this.isFraming) {
      this.frames.push([x, y, z, 0, 0, 0, 1, textureId, this.frameId]);
    } else {
      this.boxes.push([x, y, z, 0, 0, 0, 1, textureId]);
    }
  }

  removeBox(args) {
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    [x, y, z] = this.roundNumbers([x, y, z]);

    if (this.isFraming) {
      for (let i = 0; i < this.frames.length; i++) {
        let box = this.frames[i];
        if (box[0] === x && box[1] === y && box[2] === z && box[8] === this.frameId) {
          this.frames.splice(i, 1);
          break;
        }
      }
    } else {
      for (let i = 0; i < this.boxes.length; i++) {
        let box = this.boxes[i];
        if (box[0] === x && box[1] === y && box[2] === z) {
          this.boxes.splice(i, 1);
          break;
        }
      }
    }
  }

  animateGlobal(args) {
    const _x = Number(args.X);
    const _y = Number(args.Y);
    const _z = Number(args.Z);
    const [x, y, z] = this.roundNumbers([_x, _y, _z]);
    const pitch = Number(args.PITCH);
    const yaw = Number(args.YAW);
    const roll = Number(args.ROLL);
    const scale = Number(args.SCALE);
    const interval = Number(args.INTERVAL);
    this.globalAnimation = [x, y, z, pitch, yaw, roll, scale, interval];
  }

  animateNode(args) {
    const _x = Number(args.X);
    const _y = Number(args.Y);
    const _z = Number(args.Z);
    const [x, y, z] = this.roundNumbers([_x, _y, _z]);
    const pitch = Number(args.PITCH);
    const yaw = Number(args.YAW);
    const roll = Number(args.ROLL);
    const scale = Number(args.SCALE);
    const interval = Number(args.INTERVAL);
    this.animation = [x, y, z, pitch, yaw, roll, scale, interval];
  }

  setBoxSize(args) {
    this.size = Number(args.BOXSIZE);
  }

  setBuildInterval(args) {
    this.buildInterval = Number(args.INTERVAL);
  }

  writeSentence(args) {
    const sentence = args.SENTENCE;
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    let r = Number(args.R);
    let g = Number(args.G);
    let b = Number(args.B);
    let alpha = Number(args.ALPHA);
    let fontSize = args.FONTSIZE;
    let isFixedWidth = args.IS_FIXED_WIDTH === 'true' ? "1" : "0";

    [x, y, z] = this.roundNumbers([x, y, z]);
    [r, g, b, alpha] = this.roundTwoDecimals([r, g, b, alpha]);
    [x, y, z] = [x, y, z].map(val => String(val));
    [r, g, b, alpha] = [r, g, b, alpha].map(val => String(val));
    this.sentences.push([sentence, x, y, z, r, g, b, alpha, fontSize, isFixedWidth]);
  }

  setLight(args) {
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    let r = Number(args.R);
    let g = Number(args.G);
    let b = Number(args.B);
    let alpha = Number(args.ALPHA);
    const intensity = Number(args.INTENSITY);
    const interval = Number(args.INTERVAL);
    let lightType = 1;  // point light

    [x, y, z] = this.roundNumbers([x, y, z]);
    [r, g, b, alpha] = this.roundTwoDecimals([r, g, b, alpha]);

    if (args.LIGHT_TYPE === "spot") {
      lightType = 2;
    } else if (args.LIGHT_TYPE === "directional") {
      lightType = 3;
    }
    this.lights.push([x, y, z, r, g, b, alpha, intensity, interval, lightType]);
  }

  setCommand(args) {
    const command = args.COMMAND;

    if (command === 'float') {
      this.isAllowedFloat = 1;
    }
    this.commands.push(command);
  }

  drawLine(args) {
    const _x1 = Number(args.X1);
    const _y1 = Number(args.Y1);
    const _z1 = Number(args.Z1);
    const [x1, y1, z1] = this.roundNumbers([_x1, _y1, _z1]);
    const _x2 = Number(args.X2);
    const _y2 = Number(args.Y2);
    const _z2 = Number(args.Z2);
    const [x2, y2, z2] = this.roundNumbers([_x2, _y2, _z2]);
    const diff_x = x2 - x1;
    const diff_y = y2 - y1;
    const diff_z = z2 - z1;
    const r = Number(args.R);
    const g = Number(args.G);
    const b = Number(args.B);
    const alpha = Number(args.ALPHA);
    const maxLength = Math.max(Math.abs(diff_x), Math.abs(diff_y), Math.abs(diff_z));

    if (diff_x === 0 && diff_y === 0 && diff_z === 0) {
      return false;
    }

    if (Math.abs(diff_x) === maxLength) {
      if (x2 > x1) {
        for (let x = x1; x <= x2; x++) {
          const y = y1 + (x - x1) * diff_y / diff_x;
          const z = z1 + (x - x1) * diff_z / diff_x;
          const args = {X: x, Y: y, Z: z, R: r, G: g, B: b, ALPHA: alpha};
          this.createBox(args);
        }
      } else {
        for (let x = x1; x >= x2; x--) {
          const y = y1 + (x - x1) * diff_y / diff_x;
          const z = z1 + (x - x1) * diff_z / diff_x;
          const args = {X: x, Y: y, Z: z, R: r, G: g, B: b, ALPHA: alpha};
          this.createBox(args);
        }
      }
    } else if (Math.abs(diff_y) === maxLength) {
      if (y2 > y1) {
        for (let y = y1; y <= y2; y++) {
          const x = x1 + (y - y1) * diff_x / diff_y;
          const z = z1 + (y - y1) * diff_z / diff_y;
          const args = {X: x, Y: y, Z: z, R: r, G: g, B: b, ALPHA: alpha};
          this.createBox(args);
        }
      } else {
        for (let y = y1; y >= y2; y--) {
          const x = x1 + (y - y1) * diff_x / diff_y;
          const z = z1 + (y - y1) * diff_z / diff_y;
          const args = {X: x, Y: y, Z: z, R: r, G: g, B: b, ALPHA: alpha};
          this.createBox(args);
        }
      }
    } else if (Math.abs(diff_z) === maxLength) {
      if (z2 > z1) {
        for (let z = z1; z <= z2; z++) {
          const x = x1 + (z - z1) * diff_x / diff_z;
          const y = y1 + (z - z1) * diff_y / diff_z;
          const args = {X: x, Y: y, Z: z, R: r, G: g, B: b, ALPHA: alpha};
          this.createBox(args);
        }
      } else {
        for (let z = z1; z >= z2; z--) {
          const x = x1 + (z - z1) * diff_x / diff_z;
          const y = y1 + (z - z1) * diff_y / diff_z;
          const args = {X: x, Y: y, Z: z, R: r, G: g, B: b, ALPHA: alpha};
          this.createBox(args);
        }
      }
    }
  }

  makePlyModel(args) {
    // create boxes to make a model
    let vertex_num = args.LIST_CONTENT;
    vertex_num = vertex_num.replace(/.*element vertex\s*/, "").replace(/\s*property float x.*/, "");
    vertex_num = Number(vertex_num);
    let list = args.LIST_CONTENT;
    list = list.replace(/.*end_header\s*/, "");
    list = list.split(' ')
    list = list.map((str) => Number(str));
    const positions = [];
    for (let i = 0; i < vertex_num * 6; i += 6) {
      positions.push(list.slice(i, i + 6));
    }

    const boxes = this.getBoxes(positions, vertex_num);

    for (const box of boxes) {
      const args = {
        X: box[0],
        Y: box[1],
        Z: box[2],
        R: box[3],
        G: box[4],
        B: box[5],
        ALPHA: box[6],
      }
      this.createBox(args);
    }

    const x = Math.floor(Number(args.X));
    const y = Math.floor(Number(args.Y));
    const z = Math.floor(Number(args.Z));
    const pitch = Number(args.PITCH);
    const yaw = Number(args.YAW);
    const roll = Number(args.ROLL);
    this.nodeTransform = [x, y, z, pitch, yaw, roll];
  }

  createModel(args) {
    const modelName = args.MODEL_NAME;
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    let pitch = Number(args.PITCH);
    let yaw = Number(args.YAW);
    let roll = Number(args.ROLL);
    let scale = Number(args.SCALE);
    const entityName = args.ENTITY_NAME;
    if (this.modelNames.includes(modelName)) {
      [x, y, z, pitch, yaw, roll, scale] = this.roundTwoDecimals([x, y, z, pitch, yaw, roll, scale]);
      [x, y, z, pitch, yaw, roll, scale] = [x, y, z, pitch, yaw, roll, scale].map(String);

      this.models.push([modelName, x, y, z, pitch, yaw, roll, scale, entityName]);
    } else {
      console.log(`No model name: ${modelName}`);
    }
  }

  moveModel(args) {
    const entityName = args.ENTITY_NAME;
    let x = Number(args.X);
    let y = Number(args.Y);
    let z = Number(args.Z);
    let pitch = Number(args.PITCH);
    let yaw = Number(args.YAW);
    let roll = Number(args.ROLL);
    let scale = Number(args.SCALE);
    [x, y, z, pitch, yaw, roll, scale] = this.roundTwoDecimals([x, y, z, pitch, yaw, roll, scale]);
    [x, y, z, pitch, yaw, roll, scale] = [x, y, z, pitch, yaw, roll, scale].map(String);

    this.modelMoves.push([entityName, x, y, z, pitch, yaw, roll, scale]);
  }

  changeShape(args) {
    this.shape = args.SHAPE
  }

  changeMaterial(args) {
    let isMetallic = 0;

    if (args.IS_METALLIC === "on") {
      isMetallic = 1;
    }
    this.isMetallic = isMetallic;
    this.roughness = Number(args.ROUGHNESS);
  }

  // Game API

  // スプライトの作成と表示について、テンプレートとクローンの概念を導入する
  // テンプレートはボクセルの集合で、標準サイズは8x8に設定する
  // この概念により、スプライトの複数作成が可能となる（敵キャラや球など）
  // スプライトは、ボクセラミングアプリ上で、テンプレートとして作成される（isEnable=falseにより表示されない）
  // スプライトは、テンプレートのクローンとして画面上に表示される
  // 送信ごとに、クローンはすべて削除されて、新しいクローンが作成される
  // 上記の仕様により、テンプレートからスプライトを複数作成できる

  // スプライトのテンプレートを作成（スプライトは配置されない）
  createSpriteTemplate(spriteName, colorList) {
    this.sprites.push([spriteName, colorList]);
  }

  // スプライトのテンプレートを使って、複数のスプライトを表示する
  displaySpriteTemplate(spriteName, x, y, direction = 0, scale = 1) {
    // x, y, directionを丸める
    [x, y, direction] = this.roundTwoDecimals([x, y, direction]);
    this.spriteScales[spriteName] = scale;

    // rotationStyleを取得して、送信用のdirectionを計算
    direction = this.getSpriteDirection(spriteName, direction);

    // spriteMoves 配列から指定されたスプライト名の情報を検索
    let matchingSprites = this.spriteMoves
      .map((info, index) => ({index, info}))
      .filter(item => item.info[0] === spriteName);

    [x, y, direction, scale] = [x, y, direction, scale].map(String);

    // スプライトの移動データを保存または更新
    if (matchingSprites.length === 0) {
      // 新しいスプライトデータをリストに追加
      this.spriteMoves.push([spriteName, x, y, direction, scale]);
    } else {
      // 既存のスプライトデータを更新（2つ目以降のスプライトデータ）
      let {index, info: spriteData} = matchingSprites[0];
      this.spriteMoves[index] = [...this.spriteMoves[index], x, y, direction, scale];
    }
  }

  // スプライトの画像サイズを設定（標準は128x128）
  setSpriteImageSize(args) {
    this.spriteImageSize = Number(args.SPRITE_IMAGE_SIZE)
    // デフォルト値128のときは35.15625。スプライトのサイズを35にすると、画面高さのほぼ8分の1になる（基本設定）
    this.spriteBaseSize = (360 / 8) * 100 / this.spriteImageSize;
  }

  // // 概念が分かりにくいため、スプライトの画像サイズを設定するように変更する
  // // スプライトの基本サイズを設定
  // // 推奨設定の場合はデフォルト値は35を使うため、設定不要
  // // 推奨設定：スクラッチで読み込む画像サイズは128x128
  // // 推奨設置：ボクセラミングでは、画面サイズ縦が64で、スプライトは8x8のサイズになる（8分の1）
  // // 上記の推奨設定以外の値を使うときは、このブロックでスプライトの基本サイズを変更する事で、見た目を同じにする
  // setSpriteBaseSize(args) {
  //   this.spriteBaseSize = Number(args.SPRITE_BASE_SIZE)
  // }

  // ゲーム画面の設定を更新
  // スクラッチでは480x360は画面サイズとして固定されているため、それに合わせて調整する
  // ボクセラミングの画面サイズが縦64になるように調整する（Pyxelの画面スケールに合わせる）
  setGameScreen(args) {
    const width = this.winndowSize[0] * 64 / 360;
    const height = this.winndowSize[1] * 64 / 360; // 画面サイズが縦64になるように調整する
    const angle = Number(args.ANGLE);
    const red = Number(args.R);
    const green = Number(args.G);
    const blue = Number(args.B);
    const alpha = Number(args.ALPHA);
    this.gameScreen = [width, height, angle, red, green, blue, alpha]
  }

  // ゲームスコアを更新
  setGameScore(args) {
    const score = Number(args.GAME_SCORE);
    const position = args.POSITION
    let x = 0;
    let y = 0;
    if (position === "top-left") {
      x = -28;
      y = 29;
    } else if (position === "top-right") {
      x = 28;
      y = 29;
    } else if (position === "bottom-left") {
      x = -28;
      y = -29;
    } else if (position === "bottom-right") {
      x = 28;
      y = -29;
    } else if (position === "center") {
      x = 0;
      y = 0;
    }

    this.gameScore = [score, x, y];
  }

  // ゲームオーバーを送信
  sendGameOver() {
    this.commands.push('gameOver');
  }

  // ゲームクリアを送信
  sendGameClear() {
    this.commands.push('gameClear');
  }

  // 回転スタイルの設定
  setRotationStyle(args) {
    const spriteName = args.SPRITE_NAME;
    this.rotationStyles[spriteName] = args.ROTATION_STYLE;
  }

  // ドットデータからスプライトを作成する
  createSprite(args) {
    const spriteName = args.SPRITE_NAME;
    const colorList = args.COLOR_LIST;
    let x = Number(args.X) * 64 / 360;
    let y = Number(args.Y) * 64 / 360;
    let direction = Number(args.DIRECTION);
    const size = Number(args.SIZE);
    const visible = args.VISIBLE === "on";

    // スケールを計算
    // スプライトの画像サイズが128のときに、大きさ35にすると1になるように調整
    let scale = size / this.spriteBaseSize;
    this.spriteScales[spriteName] = scale;

    // スプライトのテンプレートデータを配列に追加（これだけでは表示されない）
    this.createSpriteTemplate(spriteName, colorList);

    // スプライトが表示される場合、スプライトの移動データを配列に追加（これでスプライトが表示される）
    if (visible) {
      [x, y, direction] = this.roundTwoDecimals([x, y, direction]);
      // rotationStyleを取得して、送信用のdirectionを計算
      direction = this.getSpriteDirection(spriteName, direction);
      [x, y, direction, scale] = [x, y, direction, scale].map(String);
      this.spriteMoves.push([spriteName, x, y, direction, scale]);
    }
  }

  // 直接数値を指定して動かす
  // 通常は、getSpritePropertiesメソッドを優勢して使用し、このメソッドは使わない
  moveSprite(args) {
    const spriteName = args.SPRITE_NAME;
    let x = Number(args.X) * 64 / 360;
    let y = Number(args.Y) * 64 / 360;
    let direction = Number(args.DIRECTION);
    const size = Number(args.SIZE);
    const visible = (args.VISIBLE === "on") ? '1' : '0';

    if (visible) {
      // displaySpriteTemplateと同じ処理
      this.displaySpriteTemplate(spriteName, x, y, direction, size);
    }
  }

  // スプライトのテンプレートを使って、複数のスプライトを表示する
  moveSpriteClone(args) {
    const spriteName = args.SPRITE_NAME;
    const cloneID = Number(args.CLONE_ID);
    let x = Number(args.X) * 64 / 360;
    let y = Number(args.Y) * 64 / 360;
    let direction = Number(args.DIRECTION);
    let scale = this.spriteScales[spriteName] || 1;
    const visible = args.VISIBLE === "on";

    if (visible) {
      // x, y, directionを丸める
      [x, y, direction, scale] = this.roundTwoDecimals([x, y, direction, scale]);

      // rotationStyleを取得して、送信用のdirectionを計算
      direction = this.getSpriteDirection(spriteName, direction);

      // spriteCloneMoves辞書に移動情報を保存する
      [x, y, direction, scale] = [x, y, direction, scale].map(String);

      if (spriteName in this.spriteCloneMoves) {
        this.insertAt(this.spriteCloneMoves[spriteName], cloneID, [x, y, direction, scale]);
      } else {
        // スプライトの移動データを保存または更新
        this.spriteCloneMoves[spriteName] = [];
        this.insertAt(this.spriteCloneMoves[spriteName], cloneID, [x, y, direction, scale]);
      }
    }
  }

  addSpriteCloneMoves() {
    // spriteMoves配列にクローン情報を追加する
    for (const spriteName in this.spriteCloneMoves) {
      const moves = this.spriteCloneMoves[spriteName];
      for (const move of moves) {
        if (Array.isArray(move) && move.length === 4) {
          // moveは配列であり、要素数が4つの場合、スプライト名を先頭に追加して配列に追加
          // spriteMoves 配列から指定されたスプライト名の情報を検索
          let matchingSprites = this.spriteMoves
            .map((info, index) => ({index, info})) // インデックスと要素の辞書に変換
            .filter(item => item.info[0] === spriteName); // 前頭の要素とスプライト名が一致するものを検索

          // スプライトの移動データを保存または更新
          if (matchingSprites.length === 0) {
            // 新しいスプライトデータをリストに追加
            this.spriteMoves.push([spriteName, ...move]);
          } else {
            // 既存のスプライトデータを更新（2つ目以降のスプライトデータ）
            let {index: index, info: spriteData} = matchingSprites[0];
            this.spriteMoves[index] = [...spriteData, ...move];
          }
        }
      }
    }
  }

  // スプライトの情報を取得して自動で動かす
  // ゲーム中のスプライトの位置を取得するときに使用する
  getSpriteProperties(args) {
    const spriteName = args.SPRITE_NAME;
    const sprite = this.runtime.getSpriteTargetByName(spriteName);
    if (sprite) {
      console.log(sprite);
      let x = sprite.x * 64 / 360;
      let y = sprite.y * 64 / 360;
      let direction = sprite.direction;
      const size = sprite.size; // 大きさ35のときに1になるように調整
      const visible = sprite.visible;

      if (visible) {
        // スケールを計算
        // スプライトの画像サイズが128のときに、大きさ35にすると1になるように調整
        let [scale] = this.roundTwoDecimals([size / this.spriteBaseSize]);
        this.spriteScales[spriteName] = scale;

        // rotationStyleを取得して、送信用のdirectionを計算
        direction = this.getSpriteDirection(spriteName, direction);

        // sprites配列から同じスプライト名の要素を削除
        this.spriteMoves = this.spriteMoves.filter(spriteInfo => spriteInfo[0] !== spriteName);

        // 新しいスプライトデータを配列に追加
        [x, y, direction, scale] = [x, y, direction, scale].map(String);
        this.spriteMoves.push([spriteName, x, y, direction, scale]);
      }
    }
  }

  // ドット（弾）を表示する
  // ドットの表示は、特別な名前（dot_色_幅_高さ）のテンプレートとして表示する
  // displayDot(x, y, direction = 0, colorId = 10, width = 1, height = 1) {
  displayDot(args) {
    const x = Number(args.X) * 64 / 360;
    const y = Number(args.Y) * 64 / 360;
    let direction = Number(args.DIRECTION);
    const colorId = args.COLOR_ID;
    const width = Number(args.WIDTH) / this.spriteBaseSize;
    const height = Number(args.HEIGHT) / this.spriteBaseSize;
    const [w, h] = this.roundNumbers([width, height]);
    let templateName = `dot_${colorId}_${w}_${h}`;
    this.displaySpriteTemplate(templateName, x, y, direction, 1);
  }

  // テキストを表示する
  // テキストの表示は、特別な名前（template_色_幅_高さ）のテンプレートとして表示する
  // 一度表示した後はテンプレートが自動で保存されているため、テンプレートをクローンとして表示できる
  // displayText(text, x, y, direction = 0, scale = 1, colorId = 7, isVertical = false) {
  displayText(args) {
    const text = args.TEXT;
    const x = Number(args.X) * 64 / 360;
    const y = Number(args.Y) * 64 / 360;
    let direction = Number(args.DIRECTION);
    const size = Number(args.SIZE); // 大きさ35のときに1になるように調整
    // スプライトの画像サイズが128のときに、大きさ35にすると1になるように調整
    const scale = size / this.spriteBaseSize;
    const colorId = args.COLOR_ID;
    const isVertical = args.VERTICAL === "on" ? "1" : "0";
    const align = args.ALIGN.toLowerCase();
    // テキストの右寄せなどの情報を取得
    let textFormat = '';

    if (align.includes('top')) {
      textFormat += 't';
    } else if (align.includes('bottom')) {
      textFormat += 'b';
    }

    if (align.includes('left')) {
      textFormat += 'l';
    } else if (align.includes('right')) {
      textFormat += 'r';
    }

    if (isVertical) {
      textFormat += 'v';
    } else {
      textFormat += 'h';
    }

    const templateName = `text_${text}_${colorId}_${textFormat}`;

    this.displaySpriteTemplate(templateName, x, y, direction, scale);
  }

  sendData() {
    const args = {'NAME': ''};
    this.sendAndRecordData(args)
  }

  sendAndRecordData(args) {
    console.log('Sending data...');
    // クローンの移動データを追加
    this.addSpriteCloneMoves()

    const name = args.NAME;
    const date = new Date();
    const dataToSend = {
      nodeTransform: this.nodeTransform,
      frameTransforms: this.frameTransforms,
      globalAnimation: this.globalAnimation,
      animation: this.animation,
      boxes: this.boxes,
      frames: this.frames,
      sentences: this.sentences,
      lights: this.lights,
      commands: this.commands,
      models: this.models,
      modelMoves: this.modelMoves,
      sprites: this.sprites,
      spriteMoves: this.spriteMoves,
      gameScore: this.gameScore,
      gameScreen: this.gameScreen,
      size: this.size,
      shape: this.shape,
      interval: this.buildInterval,
      isMetallic: this.isMetallic,
      roughness: this.roughness,
      isAllowedFloat: this.isAllowedFloat,
      name: name,
      date: date.toISOString()
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(dataToSend));
      console.log('Sent data to server (existing connection):', dataToSend);
      this.startInactivityTimer(); // タイマーを開始
    } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.onopen = () => {
        this.socket.send(this.roomName);
        console.log(`Joined room: ${this.roomName}`);
        this.socket.send(JSON.stringify(dataToSend));
        console.log('Sent data to server (connected):', dataToSend);
        this.startInactivityTimer(); // タイマーを開始
      };
    } else {
      this.socket = new WebSocket('wss://websocket.voxelamming.com');

      this.socket.onopen = () => {
        this.socket.send(this.roomName);
        console.log(`Joined room: ${this.roomName}`);
        this.socket.send(JSON.stringify(dataToSend));
        console.log('Sent data to server (new connection):', dataToSend);
        this.startInactivityTimer(); // タイマーを開始
      };

      this.socket.onerror = error => {
        console.error(`WebSocket error: ${error}`);
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed.');
      };
    }
  }

  startInactivityTimer() {
    this.clearInactivityTimer(); // 既存のタイマーをクリア
    this.inactivityTimeout = setTimeout(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('No data sent for 2 seconds. Closing WebSocket connection.');
        this.socket.close();
      }
    }, this.inactivityDelay);
  }

  clearInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  getBoxes(positions) {
    const boxPositions = new Set();
    const numberOfFaces = Math.floor(positions.length / 4);
    for (let i = 0; i < numberOfFaces; i++) {
      const vertex1 = positions[i * 4];
      const vertex2 = positions[i * 4 + 1];
      const vertex3 = positions[i * 4 + 2];
      // const vertex4 = positions[i * 4 + 3]; // no need
      let x = Math.min(vertex1[0], vertex2[0], vertex3[0]);
      let y = Math.min(vertex1[1], vertex2[1], vertex3[1]);
      let z = Math.min(vertex1[2], vertex2[2], vertex3[2]);
      const r = vertex1[3] / 255;
      const g = vertex1[4] / 255;
      const b = vertex1[5] / 255;
      const alpha = 1
      let step = 0;

      // ボックスを置く方向を解析
      if (vertex1[0] === vertex2[0] && vertex2[0] === vertex3[0]) {
        // y-z plane
        step = Math.max(vertex1[1], vertex2[1], vertex3[1]) - y;
        if (vertex1[1] !== vertex2[1]) {
          x -= step;
        }
      } else if (vertex1[1] === vertex2[1] && vertex2[1] === vertex3[1]) {
        // z-x plane
        step = Math.max(vertex1[2], vertex2[2], vertex3[2]) - z;
        if (vertex1[2] !== vertex2[2]) {
          y -= step;
        }
      } else {
        // x-y plane
        step = Math.max(vertex1[0], vertex2[0], vertex3[0]) - x;
        if (vertex1[0] !== vertex2[0]) {
          z -= step;
        }
      }

      // minimum unit: 0.1
      const positionX = Math.floor(Math.round((x * 10) / step) / 10);
      const positionY = Math.floor(Math.round((y * 10) / step) / 10);
      const positionZ = Math.floor(Math.round((z * 10) / step) / 10);
      boxPositions.add([positionX, positionZ, -positionY, r, g, b, alpha]);
    }

    return [...boxPositions];
  }

  roundNumbers(num_list) {
    if (this.isAllowedFloat) {
      return num_list.map(val => parseFloat(val.toFixed(2)));
    } else {
      return num_list.map(val => Math.floor(parseFloat(val.toFixed(1))));
    }
  }

  roundTwoDecimals(num_list) {
    return num_list.map(val => parseFloat(val.toFixed(2)));
  }

  insertAt(arr, index, value) {
    // 配列が必要な長さに達していない場合、空の要素を追加
    while (arr.length <= index) {
      arr.push(""); // 必要に応じて空の文字列を追加
    }
    arr[index] = value; // 指定した位置に値を挿入
  }

  getSpriteDirection(spriteName, direction) {
    // rotationStyleを取得して、送信用のdirectionを計算
    if (spriteName in this.rotationStyles) {
      const rotationStyle = this.rotationStyles[spriteName];

      // rotationStyleが変更された場合、新しいスプライトデータを配列に追加
      // 送信用のdirectionを計算（スクラッチはy軸が0度で、時計回りに増加するため、変換が必要）
      if (rotationStyle === 'left-right') {
        if (direction < 0) {
          return -180; // 取得できる値は-90から90である。-180にすることで特別な値として、左右反転を表現する
        } else {
          return 0;
        }
      } else if (rotationStyle === "don't rotate") {
        return 0
      } else {
        return 90 - direction;
      }
    } else {
      // rotationStyleが設定されていない場合、そのままの値を使う
      return 90 - direction;
    }
  }
}

export {
  ExtensionBlocks as default,
  ExtensionBlocks as blockClass
};
