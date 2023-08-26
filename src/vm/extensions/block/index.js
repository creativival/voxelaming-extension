import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import translations from './translations.json';
import blockIcon from './voxelamming_40x40_transparent.png';
import {
    getRotationMatrix,
    matrixMultiply,
    transformPointByRotationMatrix,
    addVectors,
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
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'voxelamming.name',
            default: 'Voxelamming',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for Voxelamming.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;
        this.isAllowedMatrix = 0;
        this.savedMatrices = [];
        this.translation = [0, 0, 0, 0, 0, 0];
        this.globalAnimation = [0, 0, 0, 0, 0, 0, 1, 0]
        this.animation = [0, 0, 0, 0, 0, 0, 1, 0]
        this.boxes = [];
        this.sentence = []
        this.lights = [];
        this.commands = []
        this.size = 1.0;
        this.shape = 'box'
        this.isMetallic = 0
        this.roughness = 0.5
        this.isAllowedFloat = 0
        this.buildInterval = 0.01;
        this.dataQueue = [];
        setInterval(this.sendQueuedData.bind(this), 1000);

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
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
                        default: 'Write [SENTENCE] at x: [X] y: [Y] z: [Z] r: [R] g: [G] b: [B] alpha: [ALPHA]',
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
                    opcode: 'makeModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'voxelamming.makeModel',
                        default: 'Make model [LIST_NAME] at x: [X] y: [Y] z: [Z] pitch: [PITCH] yaw: [YAW] roll: [ROLL]',
                        description: 'make model'
                    }),
                    arguments: {
                        LIST_NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'list'
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
                }
            }
        };
    }

    setRoomName(args) {
        this.roomName = args.ROOMNAME;
    }

    pushMatrix() {
        this.isAllowedMatrix++;
        this.savedMatrices.push(this.translation);
    }

    popMatrix() {
        this.isAllowedMatrix--;
        this.translation = this.savedMatrices.pop();
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

            this.translation = [x, y, z, ...rotateMatrix[0], ...rotateMatrix[1], ...rotateMatrix[2]];
        } else {
            [x, y, z] = this.roundNumbers([x, y, z]);
            this.translation = [x, y, z, pitch, yaw, roll];
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

    createBox(args) {
        const _x = Number(args.X);
        const _y = Number(args.Y);
        const _z = Number(args.Z);
        const [x, y, z] = this.roundNumbers([_x, _y, _z]);
        const r = Number(args.R);
        const g = Number(args.G);
        const b = Number(args.B);
        const alpha = Number(args.ALPHA);
        // 重ねて置くことを防止するために、同じ座標の箱があれば削除する
        this.removeBox({X: x, Y: y, Z: z});
        this.boxes.push([x, y, z, r, g, b, alpha]);
    }

    removeBox(args) {
        const _x = Number(args.X);
        const _y = Number(args.Y);
        const _z = Number(args.Z);
        const [x, y, z] = this.roundNumbers([_x, _y, _z]);
        for (let i = 0; i < this.boxes.length; i++) {
            const box = this.boxes[i];
            if (box[0] === x && box[1] === y && box[2] === z) {
                this.boxes.splice(i, 1);
                break;
            }
        }
    }

    setBoxSize(args) {
        this.size = Number(args.BOXSIZE);
    }

    setBuildInterval(args) {
        this.buildInterval = Number(args.INTERVAL);
    }

    clearData() {
        this.translation = [0, 0, 0, 0, 0, 0];
        this.globalAnimation = [0, 0, 0, 0, 0, 0, 1, 0]
        this.animation = [0, 0, 0, 0, 0, 0, 1, 0]
        this.boxes = [];
        this.sentence = []
        this.lights = [];
        this.commands = []
        this.size = 1.0;
        this.shape = 'box'
        this.isMetallic = 0
        this.roughness = 0.5
        this.isAllowedFloat = 0
        this.buildInterval = 0.01;
    }

    writeSentence(args) {
        const sentence = args.SENTENCE;
        const x = args.X;
        const y = args.Y;
        const z = args.Z;
        const r = args.R;
        const g = args.G
        const b = args.B
        const alpha = args.ALPHA
        this.sentence = [sentence, x, y, z, r, g, b, alpha];
    }

    setLight(args) {
        console.log(args)
        const _x = Number(args.X);
        const _y = Number(args.Y);
        const _z = Number(args.Z);
        const [x, y, z] = this.roundNumbers([_x, _y, _z]);
        const r = Number(args.R);
        const g = Number(args.G);
        const b = Number(args.B);
        const alpha = Number(args.ALPHA);
        const intensity = Number(args.INTENSITY);
        const interval = Number(args.INTERVAL);
        let lightType = 1;  // point light

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
            } else{
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

    makeModel(args) {
        // create boxes to make a model
        let vertex_num = args.LIST_NAME;
        vertex_num = vertex_num.replace(/.*element vertex\s*/, "").replace(/\s*property float x.*/, "");
        vertex_num = Number(vertex_num);
        let list = args.LIST_NAME;
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
        this.translation = [x, y, z, pitch, yaw, roll];
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

    // 連続してデータを送信するときに、データをキューに入れる
    sendData () {
        console.log('Sending data...');
        const date = new Date();
        const self = this;
        const dataToSend = {
            translation: this.translation,
            globalAnimation: this.globalAnimation,
            animation: this.animation,
            boxes: this.boxes,
            sentence: this.sentence,
            lights: this.lights,
            commands: this.commands,
            size: this.size,
            shape: this.shape,
            isMetallic: this.isMetallic,
            roughness: this.roughness,
            interval: this.buildInterval,
            isAllowedFloat: this.isAllowedFloat,
            date: date.toISOString()
        };

        this.dataQueue.push(dataToSend);
    }

    // 定期的にキューに入れたデータを送信する
    sendQueuedData() {
        const self = this;
        if (this.dataQueue.length === 0) return; // If there's no data in queue, skip

        const dataToSend = this.dataQueue.shift(); // Dequeue the data
        console.log('Sending data...', dataToSend);


        let socket = new WebSocket("wss://websocket.voxelamming.com");
        // console.log(socket);

        socket.onopen = function() {
            console.log("Connection open...");
            // socket.send("Hello Server");
            socket.send(self.roomName);
            console.log(`Joined room: ${self.roomName}`);
            socket.send(JSON.stringify(dataToSend));
            console.log("Sent data: ", JSON.stringify(dataToSend));

            // Not clear data after sending because we want to keep the data for the next sending
            // self.clearData();  // clear data after sending

            // Close the WebSocket connection after sending data
            socket.close();
        };

        socket.onmessage = function(event) {
            console.log("Received data: ", event.data);
        };

        socket.onclose = function() {
            console.log("Connection closed.");
        };

        socket.onerror = function(error) {
            console.error("WebSocket Error: ", error);
        };
    }

    getBoxes(positions) {
        const boxPositions = new Set();
        const numberOfFaces = Math.floor(positions.length / 4);
        for (let i = 0; i < numberOfFaces; i++) {
            const vertex1 = positions[i * 4];
            const vertex2 = positions[i * 4 + 1];
            const vertex3 = positions[i * 4 + 2];
            const vertex4 = positions[i * 4 + 3]; // no need
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
}

export {
    ExtensionBlocks as default,
    ExtensionBlocks as blockClass
};
