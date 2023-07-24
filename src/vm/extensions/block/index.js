import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import translations from './translations.json';
import blockIcon from './voxelamming_40x40_transparent.png';

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
        this.roomName = '1000';
        this.node = [0, 0, 0, 0, 0, 0]
        this.animation = [0, 0, 0, 0, 0, 0, 1, 0]
        this.boxes = [];
        this.sentence = [];
        this.lights = [];
        this.commands = []
        this.size = 1.0;
        this.shape = 'box';
        this.buildInterval = 0.01;

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
                    opcode: 'clearData',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'voxelamming.clearData',
                        default: 'Clear data',
                        description: 'clear data'
                    }),
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
                        default: 'Set light at x: [X] y: [Y] z: [Z] r: [R] g: [G] b: [B] alpha: [ALPHA] intensity: [INTENSITY] interval: [INTERVAL]',
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
                    opcode: 'sendData',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'voxelamming.sendData',
                        default: 'Send data',
                        description: 'send data to server'
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
                }
            }
        };
    }

    setRoomName(args) {
        this.roomName = args.ROOMNAME;
    }

    setNode(args) {
        const x = Math.floor(Number(args.X));
        const y = Math.floor(Number(args.Y));
        const z = Math.floor(Number(args.Z));
        const pitch = Number(args.PITCH);
        const yaw = Number(args.YAW);
        const roll = Number(args.ROLL);
        this.node = [x, y, z, pitch, yaw, roll];
    }

    animateNode(args) {
        const x = Math.floor(Number(args.X));
        const y = Math.floor(Number(args.Y));
        const z = Math.floor(Number(args.Z));
        const pitch = Number(args.PITCH);
        const yaw = Number(args.YAW);
        const roll = Number(args.ROLL);
        const scale = Number(args.SCALE);
        const interval = Number(args.INTERVAL);
        this.animation = [x, y, z, pitch, yaw, roll, scale, interval];
    }

    createBox(args) {
        const x = Math.floor(Number(args.X));
        const y = Math.floor(Number(args.Y));
        const z = Math.floor(Number(args.Z));
        const r = Number(args.R);
        const g = Number(args.G);
        const b = Number(args.B);
        const alpha = Number(args.ALPHA);
        // 重ねて置くことを防止するために、同じ座標の箱があれば削除する
        this.removeBox({X: x, Y: y, Z: z});
        this.boxes.push([x, y, z, r, g, b, alpha]);
    }

    removeBox(args) {
        const x = Math.floor(Number(args.X));
        const y = Math.floor(Number(args.Y));
        const z = Math.floor(Number(args.Z));
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
        this.node = [0, 0, 0, 0, 0, 0]
        this.animation = [0, 0, 0, 0, 0, 0, 1, 0]
        this.boxes = [];
        this.sentence = [];
        this.lights = [];
        this.commands = []
        this.size = 1.0;
        this.shape = 'box';
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
        const x = Math.floor(Number(args.X));
        const y = Math.floor(Number(args.Y));
        const z = Math.floor(Number(args.Z));
        const r = Number(args.R);
        const g = Number(args.G);
        const b = Number(args.B);
        const alpha = Number(args.ALPHA);
        const intensity = Number(args.INTENSITY);
        const interval = Number(args.INTERVAL);
        this.lights.push([x, y, z, r, g, b, alpha, intensity, interval]);
    }

    setCommand(args) {
        const command = args.COMMAND;
        this.commands.push(command);
    }

    drawLine(args) {
        const x1 = Math.floor(Number(args.X1));
        const y1 = Math.floor(Number(args.Y1));
        const z1 = Math.floor(Number(args.Z1));
        const x2 = Math.floor(Number(args.X2));
        const y2 = Math.floor(Number(args.Y2));
        const z2 = Math.floor(Number(args.Z2));
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
                    this.createBox(x, y, z, r, g, b, alpha);
                }
            } else{
                for (let x = x1; x >= x2; x--) {
                    const y = y1 + (x - x1) * diff_y / diff_x;
                    const z = z1 + (x - x1) * diff_z / diff_x;
                    this.createBox(x, y, z, r, g, b, alpha);
                }
            }
        } else if (Math.abs(diff_y) === maxLength) {
            if (y2 > y1) {
                for (let y = y1; y <= y2; y++) {
                    const x = x1 + (y - y1) * diff_x / diff_y;
                    const z = z1 + (y - y1) * diff_z / diff_y;
                    this.createBox(x, y, z, r, g, b, alpha);
                }
            } else {
                for (let y = y1; y >= y2; y--) {
                    const x = x1 + (y - y1) * diff_x / diff_y;
                    const z = z1 + (y - y1) * diff_z / diff_y;
                    this.createBox(x, y, z, r, g, b, alpha);
                }
            }
        } else if (Math.abs(diff_z) === maxLength) {
            if (z2 > z1) {
                for (let z = z1; z <= z2; z++) {
                    const x = x1 + (z - z1) * diff_x / diff_z;
                    const y = y1 + (z - z1) * diff_y / diff_z;
                    this.createBox(x, y, z, r, g, b, alpha);
                }
            } else {
                for (let z = z1; z >= z2; z--) {
                    const x = x1 + (z - z1) * diff_x / diff_z;
                    const y = y1 + (z - z1) * diff_y / diff_z;
                    this.createBox(x, y, z, r, g, b, alpha);
                }
            }
        }
    }

    changeShape(args) {
        this.shape = args.SHAPE
    }

    sendData () {
        console.log('Sending data...');
        const date = new Date();
        const self = this;
        const dataToSend = {
            node: this.node,
            animation: this.animation,
            boxes: this.boxes,
            sentence: this.sentence,
            lights: this.lights,
            commands: this.commands,
            size: this.size,
            shape: this.shape,
            interval: this.buildInterval,
            date: date.toISOString()
        };

        let socket = new WebSocket("wss://render-nodejs-server.onrender.com");
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
}

export {
    ExtensionBlocks as default,
    ExtensionBlocks as blockClass
};
