/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "./";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _gl3Core = __webpack_require__(1);

var _gl3Core2 = _interopRequireDefault(_gl3Core);

var _geometory = __webpack_require__(7);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* textures
 * 0: draw target framebuffer
 * 1: gauss horizon
 * 2: gauss vertical
 * 3: noise buffer
 * 4: position buffer
 * 5: position swap buffer
 * 6: velocity buffer
 * 7: velocity swap buffer
 */

/* shaders
 * scenePrg   : base scene program
 * finalPrg   : final scene program
 * noisePrg   : noise program
 * gaussPrg   : gauss blur program
 * positionPrg: gpgpu position update program
 * velocityPrg: gpgpu velocity update program
 */

// variable ===============================================================
var gl3 = new _gl3Core2.default();
var canvas = void 0,
    gl = void 0,
    ext = void 0,
    run = void 0,
    mat4 = void 0,
    qtn = void 0;
var scenePrg = void 0,
    finalPrg = void 0,
    noisePrg = void 0,
    gaussPrg = void 0,
    positionPrg = void 0,
    velocityPrg = void 0;
var gWeight = void 0,
    nowTime = void 0;
var canvasWidth = void 0,
    canvasHeight = void 0,
    bufferSize = void 0,
    gpgpuBufferSize = void 0;

// variable initialize ====================================================
run = true;
mat4 = gl3.Math.Mat4;
qtn = gl3.Math.Qtn;
bufferSize = 1024;
gpgpuBufferSize = 64;

// const variable =========================================================
var DEFAULT_CAM_POSITION = [0.0, 0.0, 3.0];
var DEFAULT_CAM_CENTER = [0.0, 0.0, 0.0];
var DEFAULT_CAM_UP = [0.0, 1.0, 0.0];

// onload =================================================================
window.addEventListener('load', function () {
    // gl3 initialize
    gl3.init('canvas');
    if (!gl3.ready) {
        console.log('initialize error');return;
    }
    canvas = gl3.canvas;gl = gl3.gl;
    canvas.width = canvasWidth = window.innerWidth;
    canvas.height = canvasHeight = window.innerHeight;

    // extension
    ext = {};
    ext.elementIndexUint = gl.getExtension('OES_element_index_uint');
    ext.textureFloat = gl.getExtension('OES_texture_float');
    ext.drawBuffers = gl.getExtension('WEBGL_draw_buffers');

    // event
    window.addEventListener('keydown', function (eve) {
        run = eve.keyCode !== 27;
        console.log(nowTime);
    }, true);

    shaderLoader();
}, false);

function shaderLoader() {
    // programs
    scenePrg = gl3.createProgramFromFile('shader/planePoint.vert', 'shader/planePoint.frag', ['position', 'color', 'texCoord', 'type', 'random'], [3, 4, 2, 4, 4], ['mvpMatrix', 'positionTexture', 'time', 'globalColor'], ['matrix4fv', '1i', '1f', '4fv'], shaderLoadCheck);

    // final program
    finalPrg = gl3.createProgramFromFile('shader/final.vert', 'shader/final.frag', ['position'], [3], ['globalColor', 'texture', 'time', 'resolution'], ['4fv', '1i', '1f', '2fv'], shaderLoadCheck);

    // noise program
    noisePrg = gl3.createProgramFromFile('shader/noise.vert', 'shader/noise.frag', ['position'], [3], ['resolution'], ['2fv'], shaderLoadCheck);

    // gauss program
    gaussPrg = gl3.createProgramFromFile('shader/gaussian.vert', 'shader/gaussian.frag', ['position'], [3], ['resolution', 'horizontal', 'weight', 'texture'], ['2fv', '1i', '1fv', '1i'], shaderLoadCheck);

    // gpgpu position program
    positionPrg = gl3.createProgramFromFile('shader/gpgpuPosition.vert', 'shader/gpgpuPosition.frag', ['position', 'texCoord'], [3, 2], ['time', 'noiseTexture', 'previousTexture', 'velocityTexture'], ['1f', '1i', '1i', '1i'], shaderLoadCheck);

    // gpgpu velocity program
    velocityPrg = gl3.createProgramFromFile('shader/gpgpuVelocity.vert', 'shader/gpgpuVelocity.frag', ['position', 'texCoord'], [3, 2], ['time', 'noiseTexture', 'previousTexture'], ['1f', '1i', '1i'], shaderLoadCheck);

    function shaderLoadCheck() {
        if (scenePrg.prg != null && finalPrg.prg != null && noisePrg.prg != null && gaussPrg.prg != null && positionPrg.prg != null && velocityPrg.prg != null && true) {
            init();
        }
    }
}

function init() {
    var resetBufferFunction = null;
    window.addEventListener('resize', function () {
        resetBufferFunction = generateScreenBuffer;
        run = false;
    }, false);

    // application setting
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    gWeight = gaussWeight(20, 100.0);

    // tiled plane point mesh
    var tiledPlanePointData = (0, _geometory.tiledPlanePoint)(gpgpuBufferSize);
    var tiledPlanePointVBO = [gl3.createVbo(tiledPlanePointData.position), gl3.createVbo(tiledPlanePointData.color), gl3.createVbo(tiledPlanePointData.texCoord), gl3.createVbo(tiledPlanePointData.type), gl3.createVbo(tiledPlanePointData.random)];
    var tiledPlaneHorizonLineIBO = gl3.createIboInt(tiledPlanePointData.indexHorizon);
    var tiledPlaneCrossLineIBO = gl3.createIboInt(tiledPlanePointData.indexCross);
    var tiledPlanePointLength = tiledPlanePointData.position.length / 3;

    // plane mesh
    var planePosition = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0];
    var planeTexCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    var planeIndex = [0, 2, 1, 1, 2, 3];
    var planeVBO = [gl3.createVbo(planePosition)];
    var planeTexCoordVBO = [gl3.createVbo(planePosition), gl3.createVbo(planeTexCoord)];
    var planeIBO = gl3.createIboInt(planeIndex);

    // matrix
    var mMatrix = mat4.identity(mat4.create());
    var vMatrix = mat4.identity(mat4.create());
    var pMatrix = mat4.identity(mat4.create());
    var vpMatrix = mat4.identity(mat4.create());
    var mvpMatrix = mat4.identity(mat4.create());
    var invMatrix = mat4.identity(mat4.create());

    // frame buffer
    var frameBuffer = void 0,
        hGaussBuffer = void 0,
        vGaussBuffer = void 0;
    generateScreenBuffer();
    function generateScreenBuffer() {
        if (frameBuffer != null) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            var arr = [frameBuffer, hGaussBuffer, vGaussBuffer];
            for (var i = 0; i < 3; ++i) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.deleteTexture(arr[i].texture);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.deleteRenderbuffer(arr[i].depthRenderbuffer);
                gl.deleteFramebuffer(arr[i].framebuffer);
            }
        }
        frameBuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 0);
        hGaussBuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 1);
        vGaussBuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 2);
        for (var _i = 0; _i < 3; ++_i) {
            gl.activeTexture(gl.TEXTURE0 + _i);
            gl.bindTexture(gl.TEXTURE_2D, gl3.textures[_i].texture);
        }
    }
    var noiseBuffer = gl3.createFramebuffer(bufferSize, bufferSize, 3);
    var positionBuffer = [];
    positionBuffer[0] = gl3.createFramebufferFloat(gpgpuBufferSize, gpgpuBufferSize, 4);
    positionBuffer[1] = gl3.createFramebufferFloat(gpgpuBufferSize, gpgpuBufferSize, 5);
    var velocityBuffer = [];
    velocityBuffer[0] = gl3.createFramebufferFloat(gpgpuBufferSize, gpgpuBufferSize, 6);
    velocityBuffer[1] = gl3.createFramebufferFloat(gpgpuBufferSize, gpgpuBufferSize, 7);

    // texture setting
    (function () {
        var i = void 0;
        for (i = 0; i < 8; ++i) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, gl3.textures[i].texture);
        }
    })();

    // noise texture
    noisePrg.useProgram();
    noisePrg.setAttribute(planeVBO, planeIBO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, noiseBuffer.framebuffer);
    gl3.sceneClear([0.0, 0.0, 0.0, 1.0]);
    gl3.sceneView(0, 0, bufferSize, bufferSize);
    noisePrg.pushShader([[bufferSize, bufferSize]]);
    gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);

    // gl flags
    gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);

    // rendering
    var count = 0;
    var beginTime = Date.now();
    var targetBufferNum = 0;
    render();

    function render() {
        var i = void 0;
        nowTime = Date.now() - beginTime;
        nowTime /= 1000;
        count++;
        targetBufferNum = count % 2;

        // canvas
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // perspective projection
        var cameraPosition = DEFAULT_CAM_POSITION;
        var centerPoint = DEFAULT_CAM_CENTER;
        var cameraUpDirection = DEFAULT_CAM_UP;
        mat4.vpFromCameraProperty(cameraPosition, centerPoint, cameraUpDirection, 45, canvasWidth / canvasHeight, 0.1, 10.0, vMatrix, pMatrix, vpMatrix);

        // gpgpu update ---------------------------------------------------
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, velocityBuffer[targetBufferNum].framebuffer);
        gl3.sceneView(0, 0, gpgpuBufferSize, gpgpuBufferSize);
        velocityPrg.useProgram();
        velocityPrg.setAttribute(planeTexCoordVBO, planeIBO);
        velocityPrg.pushShader([nowTime, 3, 6 + 1 - targetBufferNum]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);
        gl.bindFramebuffer(gl.FRAMEBUFFER, positionBuffer[targetBufferNum].framebuffer);
        gl3.sceneView(0, 0, gpgpuBufferSize, gpgpuBufferSize);
        positionPrg.useProgram();
        positionPrg.setAttribute(planeTexCoordVBO, planeIBO);
        positionPrg.pushShader([nowTime, 3, 4 + 1 - targetBufferNum, 6 + targetBufferNum]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);

        // render to frame buffer -----------------------------------------
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.framebuffer);
        gl3.sceneClear([0.0, 0.0, 0.1, 1.0], 1.0);
        gl3.sceneView(0, 0, canvasWidth, canvasHeight);

        // temp plane point draw
        scenePrg.useProgram();
        // scenePrg.setAttribute(tiledPlanePointVBO, null);
        scenePrg.setAttribute(tiledPlanePointVBO, tiledPlaneCrossLineIBO);
        mat4.identity(mMatrix);
        mat4.rotate(mMatrix, Math.sin(nowTime), [1, 1, 0], mMatrix);
        mat4.multiply(vpMatrix, mMatrix, mvpMatrix);
        scenePrg.pushShader([mvpMatrix, 4 + targetBufferNum, nowTime, [0.8, 0.75, 1.0, 0.5]]);
        gl3.drawArrays(gl.POINTS, tiledPlanePointLength);
        gl3.drawElementsInt(gl.LINES, tiledPlanePointData.indexCross.length);

        // horizon gauss render to fBuffer --------------------------------
        gaussPrg.useProgram();
        gaussPrg.setAttribute(planeVBO, planeIBO);
        gl.bindFramebuffer(gl.FRAMEBUFFER, hGaussBuffer.framebuffer);
        gl3.sceneClear([0.0, 0.0, 0.0, 1.0], 1.0);
        gl3.sceneView(0, 0, canvasWidth, canvasHeight);
        gaussPrg.pushShader([[canvasWidth, canvasHeight], true, gWeight, 0]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);

        // vertical gauss render to fBuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, vGaussBuffer.framebuffer);
        gl3.sceneClear([0.0, 0.0, 0.0, 1.0], 1.0);
        gl3.sceneView(0, 0, canvasWidth, canvasHeight);
        gaussPrg.pushShader([[canvasWidth, canvasHeight], false, gWeight, 1]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);

        // final scene ----------------------------------------------------
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        finalPrg.useProgram();
        finalPrg.setAttribute(planeVBO, planeIBO);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl3.sceneClear([0.01, 0.02, 0.08, 1.0], 1.0);
        gl3.sceneView(0, 0, canvasWidth, canvasHeight);
        finalPrg.pushShader([[1.0, 1.0, 1.0, 1.0], 0, nowTime, [canvasWidth, canvasHeight]]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);
        finalPrg.pushShader([[1.0, 1.0, 1.0, 1.0], 2, nowTime, [canvasWidth, canvasHeight]]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);

        if (run) {
            requestAnimationFrame(render);
        } else {
            if (resetBufferFunction != null) {
                resetBufferFunction();
                resetBufferFunction = null;
                run = true;
                requestAnimationFrame(render);
            }
        }
    }
}

function gaussWeight(resolution, power) {
    var i = void 0;
    var t = 0.0;
    var weight = [];
    for (i = 0; i < resolution; i++) {
        var r = 1.0 + 2.0 * i;
        var w = Math.exp(-0.5 * (r * r) / power);
        weight[i] = w;
        if (i > 0) {
            w *= 2.0;
        }
        t += w;
    }
    for (i = 0; i < weight.length; i++) {
        weight[i] /= t;
    }
    return weight;
}

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _gl3Audio = __webpack_require__(2);

var _gl3Audio2 = _interopRequireDefault(_gl3Audio);

var _gl3Math = __webpack_require__(3);

var _gl3Math2 = _interopRequireDefault(_gl3Math);

var _gl3Mesh = __webpack_require__(4);

var _gl3Mesh2 = _interopRequireDefault(_gl3Mesh);

var _gl3Util = __webpack_require__(5);

var _gl3Util2 = _interopRequireDefault(_gl3Util);

var _gl3Gui = __webpack_require__(6);

var _gl3Gui2 = _interopRequireDefault(_gl3Gui);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * glcubic
 * @class gl3
 */
var gl3 = function () {
    /**
     * @constructor
     */
    function gl3() {
        _classCallCheck(this, gl3);

        /**
         * version
         * @const
         * @type {string}
         */
        this.VERSION = '0.2.2';
        /**
         * pi * 2
         * @const
         * @type {number}
         */
        this.PI2 = 6.28318530717958647692528676655900576;
        /**
         * pi
         * @const
         * @type {number}
         */
        this.PI = 3.14159265358979323846264338327950288;
        /**
         * pi / 2
         * @const
         * @type {number}
         */
        this.PIH = 1.57079632679489661923132169163975144;
        /**
         * pi / 4
         * @const
         * @type {number}
         */
        this.PIH2 = 0.78539816339744830961566084581987572;
        /**
         * gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS を利用して得られるテクスチャユニットの最大利用可能数
         * @const
         * @type {number}
         */
        this.TEXTURE_UNIT_COUNT = null;

        /**
         * glcubic が正しく初期化されたどうかのフラグ
         * @type {boolean}
         */
        this.ready = false;
        /**
         * glcubic と紐付いている canvas element
         * @type {HTMLCanvasElement}
         */
        this.canvas = null;
        /**
         * glcubic と紐付いている canvas から取得した WebGL Rendering Context
         * @type {WebGLRenderingContext}
         */
        this.gl = null;
        /**
         * WebGL2RenderingContext として初期化したかどうかを表す真偽値
         * @type {bool}
         */
        this.isWebGL2 = false;
        /**
         * cubic としてのログ出力をするかどうか
         * @type {bool}
         */
        this.isConsoleOutput = true;
        /**
         * glcubic が内部的に持っているテクスチャ格納用の配列
         * @type {Array.<WebGLTexture>}
         */
        this.textures = null;
        /**
         * WebGL の拡張機能を格納するオブジェクト
         * @type {Object}
         */
        this.ext = null;

        /**
         * gl3Audio クラスのインスタンス
         * @type {gl3Audio}
         */
        this.Audio = _gl3Audio2.default;
        /**
         * gl3Mesh クラスのインスタンス
         * @type {gl3Mesh}
         */
        this.Mesh = _gl3Mesh2.default;
        /**
         * gl3Util クラスのインスタンス
         * @type {gl3Util}
         */
        this.Util = _gl3Util2.default;
        /**
         * gl3Gui クラスのインスタンス
         * @type {gl3Gui}
         */
        this.Gui = new _gl3Gui2.default();
        /**
         * gl3Math クラスのインスタンス
         * @type {gl3Math}
         */
        this.Math = new _gl3Math2.default();
    }

    /**
     * glcubic を初期化する
     * @param {HTMLCanvasElement|string} canvas - canvas element か canvas に付与されている ID 文字列
     * @param {Object} initOptions - canvas.getContext で第二引数に渡す初期化時オプション
     * @param {Object} cubicOptions
     * @property {bool} webgl2Mode - webgl2 を有効化する場合 true
     * @property {bool} consoleMessage - console に cubic のログを出力するかどうか
     * @return {boolean} 初期化が正しく行われたかどうかを表す真偽値
     */


    _createClass(gl3, [{
        key: 'init',
        value: function init(canvas, initOptions, cubicOptions) {
            var opt = initOptions || {};
            this.ready = false;
            if (canvas == null) {
                return false;
            }
            if (canvas instanceof HTMLCanvasElement) {
                this.canvas = canvas;
            } else if (Object.prototype.toString.call(canvas) === '[object String]') {
                this.canvas = document.getElementById(canvas);
            }
            if (this.canvas == null) {
                return false;
            }
            if (cubicOptions != null) {
                if (cubicOptions.hasOwnProperty('webgl2Mode') === true && cubicOptions.webgl2Mode === true) {
                    this.gl = this.canvas.getContext('webgl2', opt);
                    this.isWebGL2 = true;
                }
                if (cubicOptions.hasOwnProperty('consoleMessage') === true && cubicOptions.consoleMessage !== true) {
                    this.isConsoleOutput = false;
                }
            }
            if (this.gl == null) {
                this.gl = this.canvas.getContext('webgl', opt) || this.canvas.getContext('experimental-webgl', opt);
            }
            if (this.gl != null) {
                this.ready = true;
                this.TEXTURE_UNIT_COUNT = this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
                this.textures = new Array(this.TEXTURE_UNIT_COUNT);
                this.ext = {
                    elementIndexUint: this.gl.getExtension('OES_element_index_uint'),
                    textureFloat: this.gl.getExtension('OES_texture_float'),
                    textureHalfFloat: this.gl.getExtension('OES_texture_half_float'),
                    drawBuffers: this.gl.getExtension('WEBGL_draw_buffers')
                };
                if (this.isConsoleOutput === true) {
                    console.log('%c◆%c glcubic.js %c◆%c : version %c' + this.VERSION, 'color: crimson', '', 'color: crimson', '', 'color: royalblue');
                }
            }
            return this.ready;
        }

        /**
         * フレームバッファをクリアする
         * @param {Array.<number>} color - クリアする色（0.0 ~ 1.0）
         * @param {number} [depth] - クリアする深度
         * @param {number} [stencil] - クリアするステンシル値
         */

    }, {
        key: 'sceneClear',
        value: function sceneClear(color, depth, stencil) {
            var gl = this.gl;
            var flg = gl.COLOR_BUFFER_BIT;
            gl.clearColor(color[0], color[1], color[2], color[3]);
            if (depth != null) {
                gl.clearDepth(depth);
                flg = flg | gl.DEPTH_BUFFER_BIT;
            }
            if (stencil != null) {
                gl.clearStencil(stencil);
                flg = flg | gl.STENCIL_BUFFER_BIT;
            }
            gl.clear(flg);
        }

        /**
         * ビューポートを設定する
         * @param {number} [x] - x（左端原点）
         * @param {number} [y] - y（下端原点）
         * @param {number} [width] - 横の幅
         * @param {number} [height] - 縦の高さ
         */

    }, {
        key: 'sceneView',
        value: function sceneView(x, y, width, height) {
            var X = x || 0;
            var Y = y || 0;
            var w = width || window.innerWidth;
            var h = height || window.innerHeight;
            this.gl.viewport(X, Y, w, h);
        }

        /**
         * gl.drawArrays をコールするラッパー
         * @param {number} primitive - プリミティブタイプ
         * @param {number} vertexCount - 描画する頂点の個数
         * @param {number} [offset=0] - 描画する頂点の開始オフセット
         */

    }, {
        key: 'drawArrays',
        value: function drawArrays(primitive, vertexCount) {
            var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            this.gl.drawArrays(primitive, offset, vertexCount);
        }

        /**
         * gl.drawElements をコールするラッパー
         * @param {number} primitive - プリミティブタイプ
         * @param {number} indexLength - 描画するインデックスの個数
         * @param {number} [offset=0] - 描画するインデックスの開始オフセット
         */

    }, {
        key: 'drawElements',
        value: function drawElements(primitive, indexLength) {
            var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            this.gl.drawElements(primitive, indexLength, this.gl.UNSIGNED_SHORT, offset);
        }

        /**
         * gl.drawElements をコールするラッパー（gl.UNSIGNED_INT） ※要拡張機能（WebGL 1.0）
         * @param {number} primitive - プリミティブタイプ
         * @param {number} indexLength - 描画するインデックスの個数
         * @param {number} [offset=0] - 描画するインデックスの開始オフセット
         */

    }, {
        key: 'drawElementsInt',
        value: function drawElementsInt(primitive, indexLength) {
            var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            this.gl.drawElements(primitive, indexLength, this.gl.UNSIGNED_INT, offset);
        }

        /**
         * VBO（Vertex Buffer Object）を生成して返す
         * @param {Array.<number>} data - 頂点情報を格納した配列
         * @return {WebGLBuffer} 生成した頂点バッファ
         */

    }, {
        key: 'createVbo',
        value: function createVbo(data) {
            if (data == null) {
                return;
            }
            var vbo = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            return vbo;
        }

        /**
         * IBO（Index Buffer Object）を生成して返す
         * @param {Array.<number>} data - インデックス情報を格納した配列
         * @return {WebGLBuffer} 生成したインデックスバッファ
         */

    }, {
        key: 'createIbo',
        value: function createIbo(data) {
            if (data == null) {
                return;
            }
            var ibo = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
            return ibo;
        }

        /**
         * IBO（Index Buffer Object）を生成して返す（gl.UNSIGNED_INT） ※要拡張機能（WebGL 1.0）
         * @param {Array.<number>} data - インデックス情報を格納した配列
         * @return {WebGLBuffer} 生成したインデックスバッファ
         */

    }, {
        key: 'createIboInt',
        value: function createIboInt(data) {
            if (data == null) {
                return;
            }
            var ibo = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), this.gl.STATIC_DRAW);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
            return ibo;
        }

        /**
         * ファイルを元にテクスチャを生成して返す
         * @param {string} source - ファイルパス
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         * @param {function} callback - 画像のロードが完了しテクスチャを生成した後に呼ばれるコールバック
         */

    }, {
        key: 'createTextureFromFile',
        value: function createTextureFromFile(source, number, callback) {
            var _this = this;

            if (source == null || number == null) {
                return;
            }
            var img = new Image();
            var gl = this.gl;
            img.onload = function () {
                _this.textures[number] = { texture: null, type: null, loaded: false };
                var tex = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + number);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                _this.textures[number].texture = tex;
                _this.textures[number].type = gl.TEXTURE_2D;
                _this.textures[number].loaded = true;
                if (_this.isConsoleOutput === true) {
                    console.log('%c◆%c texture number: %c' + number + '%c, file loaded: %c' + source, 'color: crimson', '', 'color: blue', '', 'color: goldenrod');
                }
                gl.bindTexture(gl.TEXTURE_2D, null);
                if (callback != null) {
                    callback(number);
                }
            };
            img.src = source;
        }

        /**
         * オブジェクトを元にテクスチャを生成して返す
         * @param {object} object - ロード済みの Image オブジェクトや Canvas オブジェクト
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         */

    }, {
        key: 'createTextureFromObject',
        value: function createTextureFromObject(object, number) {
            if (object == null || number == null) {
                return;
            }
            var gl = this.gl;
            var tex = gl.createTexture();
            this.textures[number] = { texture: null, type: null, loaded: false };
            gl.activeTexture(gl.TEXTURE0 + number);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, object);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this.textures[number].texture = tex;
            this.textures[number].type = gl.TEXTURE_2D;
            this.textures[number].loaded = true;
            if (this.isConsoleOutput === true) {
                console.log('%c◆%c texture number: %c' + number + '%c, object attached', 'color: crimson', '', 'color: blue', '');
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        /**
         * 画像を元にキューブマップテクスチャを生成する
         * @param {Array.<string>} source - ファイルパスを格納した配列
         * @param {Array.<number>} target - キューブマップテクスチャに設定するターゲットの配列
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         * @param {function} callback - 画像のロードが完了しテクスチャを生成した後に呼ばれるコールバック
         */

    }, {
        key: 'createTextureCubeFromFile',
        value: function createTextureCubeFromFile(source, target, number, callback) {
            var _this2 = this;

            if (source == null || target == null || number == null) {
                return;
            }
            var cImg = [];
            var gl = this.gl;
            this.textures[number] = { texture: null, type: null, loaded: false };
            for (var i = 0; i < source.length; i++) {
                cImg[i] = { image: new Image(), loaded: false };
                cImg[i].image.onload = function (index) {
                    return function () {
                        cImg[index].loaded = true;
                        if (cImg.length === 6) {
                            var f = true;
                            cImg.map(function (v) {
                                f = f && v.loaded;
                            });
                            if (f === true) {
                                var tex = gl.createTexture();
                                gl.activeTexture(gl.TEXTURE0 + number);
                                gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
                                for (var j = 0; j < source.length; j++) {
                                    gl.texImage2D(target[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cImg[j].image);
                                }
                                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                                _this2.textures[number].texture = tex;
                                _this2.textures[number].type = gl.TEXTURE_CUBE_MAP;
                                _this2.textures[number].loaded = true;
                                if (_this2.isConsoleOutput === true) {
                                    console.log('%c◆%c texture number: %c' + number + '%c, file loaded: %c' + source[0] + '...', 'color: crimson', '', 'color: blue', '', 'color: goldenrod');
                                }
                                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                                if (callback != null) {
                                    callback(number);
                                }
                            }
                        }
                    };
                }(i);
                cImg[i].image.src = source[i];
            }
        }

        /**
         * glcubic が持つ配列のインデックスとテクスチャユニットを指定してテクスチャをバインドする
         * @param {number} unit - テクスチャユニット
         * @param {number} number - glcubic が持つ配列のインデックス
         */

    }, {
        key: 'bindTexture',
        value: function bindTexture(unit, number) {
            if (this.textures[number] == null) {
                return;
            }
            this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            this.gl.bindTexture(this.textures[number].type, this.textures[number].texture);
        }

        /**
         * glcubic が持つ配列内のテクスチャ用画像が全てロード済みかどうか確認する
         * @return {boolean} ロードが完了しているかどうかのフラグ
         */

    }, {
        key: 'isTextureLoaded',
        value: function isTextureLoaded() {
            var i = void 0,
                j = void 0,
                f = void 0,
                g = void 0;
            f = true;g = false;
            for (i = 0, j = this.textures.length; i < j; i++) {
                if (this.textures[i] != null) {
                    g = true;
                    f = f && this.textures[i].loaded;
                }
            }
            if (g) {
                return f;
            } else {
                return false;
            }
        }

        /**
         * フレームバッファを生成しカラーバッファにテクスチャを設定してオブジェクトとして返す
         * @param {number} width - フレームバッファの横幅
         * @param {number} height - フレームバッファの高さ
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         * @return {object} 生成した各種オブジェクトはラップして返却する
         * @property {WebGLFramebuffer} framebuffer - フレームバッファ
         * @property {WebGLRenderbuffer} depthRenderBuffer - 深度バッファとして設定したレンダーバッファ
         * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
         */

    }, {
        key: 'createFramebuffer',
        value: function createFramebuffer(width, height, number) {
            if (width == null || height == null || number == null) {
                return;
            }
            var gl = this.gl;
            this.textures[number] = { texture: null, type: null, loaded: false };
            var frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            var depthRenderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
            var fTexture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + number);
            gl.bindTexture(gl.TEXTURE_2D, fTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.textures[number].texture = fTexture;
            this.textures[number].type = gl.TEXTURE_2D;
            this.textures[number].loaded = true;
            if (this.isConsoleOutput === true) {
                console.log('%c◆%c texture number: %c' + number + '%c, framebuffer created', 'color: crimson', '', 'color: blue', '');
            }
            return { framebuffer: frameBuffer, depthRenderbuffer: depthRenderBuffer, texture: fTexture };
        }

        /**
         * フレームバッファを生成しカラーバッファにテクスチャを設定、ステンシル有効でオブジェクトとして返す
         * @param {number} width - フレームバッファの横幅
         * @param {number} height - フレームバッファの高さ
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         * @return {object} 生成した各種オブジェクトはラップして返却する
         * @property {WebGLFramebuffer} framebuffer - フレームバッファ
         * @property {WebGLRenderbuffer} depthStencilRenderbuffer - 深度バッファ兼ステンシルバッファとして設定したレンダーバッファ
         * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
         */

    }, {
        key: 'createFramebufferStencil',
        value: function createFramebufferStencil(width, height, number) {
            if (width == null || height == null || number == null) {
                return;
            }
            var gl = this.gl;
            this.textures[number] = { texture: null, type: null, loaded: false };
            var frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            var depthStencilRenderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilRenderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilRenderBuffer);
            var fTexture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + number);
            gl.bindTexture(gl.TEXTURE_2D, fTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.textures[number].texture = fTexture;
            this.textures[number].type = gl.TEXTURE_2D;
            this.textures[number].loaded = true;
            if (this.isConsoleOutput === true) {
                console.log('%c◆%c texture number: %c' + number + '%c, framebuffer created (enable stencil)', 'color: crimson', '', 'color: blue', '');
            }
            return { framebuffer: frameBuffer, depthStencilRenderbuffer: depthStencilRenderBuffer, texture: fTexture };
        }

        /**
         * フレームバッファを生成しカラーバッファに浮動小数点テクスチャを設定してオブジェクトとして返す ※要拡張機能（WebGL 1.0）
         * @param {number} width - フレームバッファの横幅
         * @param {number} height - フレームバッファの高さ
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         * @return {object} 生成した各種オブジェクトはラップして返却する
         * @property {WebGLFramebuffer} framebuffer - フレームバッファ
         * @property {WebGLRenderbuffer} depthRenderBuffer - 深度バッファとして設定したレンダーバッファ
         * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
         */

    }, {
        key: 'createFramebufferFloat',
        value: function createFramebufferFloat(width, height, number) {
            if (width == null || height == null || number == null) {
                return;
            }
            if (this.ext == null || this.ext.textureFloat == null && this.ext.textureHalfFloat == null) {
                console.log('float texture not support');
                return;
            }
            var gl = this.gl;
            var flg = this.ext.textureFloat != null ? gl.FLOAT : this.ext.textureHalfFloat.HALF_FLOAT_OES;
            this.textures[number] = { texture: null, type: null, loaded: false };
            var frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            var fTexture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + number);
            gl.bindTexture(gl.TEXTURE_2D, fTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, flg, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.textures[number].texture = fTexture;
            this.textures[number].type = gl.TEXTURE_2D;
            this.textures[number].loaded = true;
            if (this.isConsoleOutput === true) {
                console.log('%c◆%c texture number: %c' + number + '%c, framebuffer created (enable float)', 'color: crimson', '', 'color: blue', '');
            }
            return { framebuffer: frameBuffer, depthRenderbuffer: null, texture: fTexture };
        }

        /**
         * フレームバッファを生成しカラーバッファにキューブテクスチャを設定してオブジェクトとして返す
         * @param {number} width - フレームバッファの横幅
         * @param {number} height - フレームバッファの高さ
         * @param {Array.<number>} target - キューブマップテクスチャに設定するターゲットの配列
         * @param {number} number - glcubic が内部的に持つ配列のインデックス ※非テクスチャユニット
         * @return {object} 生成した各種オブジェクトはラップして返却する
         * @property {WebGLFramebuffer} framebuffer - フレームバッファ
         * @property {WebGLRenderbuffer} depthRenderBuffer - 深度バッファとして設定したレンダーバッファ
         * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
         */

    }, {
        key: 'createFramebufferCube',
        value: function createFramebufferCube(width, height, target, number) {
            if (width == null || height == null || target == null || number == null) {
                return;
            }
            var gl = this.gl;
            this.textures[number] = { texture: null, type: null, loaded: false };
            var frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            var depthRenderBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
            var fTexture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + number);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, fTexture);
            for (var i = 0; i < target.length; i++) {
                gl.texImage2D(target[i], 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this.textures[number].texture = fTexture;
            this.textures[number].type = gl.TEXTURE_CUBE_MAP;
            this.textures[number].loaded = true;
            if (this.isConsoleOutput === true) {
                console.log('%c◆%c texture number: %c' + number + '%c, framebuffer cube created', 'color: crimson', '', 'color: blue', '');
            }
            return { framebuffer: frameBuffer, depthRenderbuffer: depthRenderBuffer, texture: fTexture };
        }

        /**
         * HTML 内に存在する ID 文字列から script タグを参照しプログラムオブジェクトを生成する
         * @param {string} vsId - 頂点シェーダのソースが記述された script タグの ID 文字列
         * @param {string} fsId - フラグメントシェーダのソースが記述された script タグの ID 文字列
         * @param {Array.<string>} attLocation - attribute 変数名の配列
         * @param {Array.<number>} attStride - attribute 変数のストライドの配列
         * @param {Array.<string>} uniLocation - uniform 変数名の配列
         * @param {Array.<string>} uniType - uniform 変数更新メソッドの名前を示す文字列 ※例：'matrix4fv'
         * @return {ProgramManager} プログラムマネージャークラスのインスタンス
         */

    }, {
        key: 'createProgramFromId',
        value: function createProgramFromId(vsId, fsId, attLocation, attStride, uniLocation, uniType) {
            if (this.gl == null) {
                return null;
            }
            var i = void 0;
            var mng = new ProgramManager(this.gl, this.isWebGL2);
            mng.vs = mng.createShaderFromId(vsId);
            mng.fs = mng.createShaderFromId(fsId);
            mng.prg = mng.createProgram(mng.vs, mng.fs);
            if (mng.prg == null) {
                return mng;
            }
            mng.attL = new Array(attLocation.length);
            mng.attS = new Array(attLocation.length);
            for (i = 0; i < attLocation.length; i++) {
                mng.attL[i] = this.gl.getAttribLocation(mng.prg, attLocation[i]);
                mng.attS[i] = attStride[i];
            }
            mng.uniL = new Array(uniLocation.length);
            for (i = 0; i < uniLocation.length; i++) {
                mng.uniL[i] = this.gl.getUniformLocation(mng.prg, uniLocation[i]);
            }
            mng.uniT = uniType;
            mng.locationCheck(attLocation, uniLocation);
            return mng;
        }

        /**
         * シェーダのソースコード文字列からプログラムオブジェクトを生成する
         * @param {string} vs - 頂点シェーダのソース
         * @param {string} fs - フラグメントシェーダのソース
         * @param {Array.<string>} attLocation - attribute 変数名の配列
         * @param {Array.<number>} attStride - attribute 変数のストライドの配列
         * @param {Array.<string>} uniLocation - uniform 変数名の配列
         * @param {Array.<string>} uniType - uniform 変数更新メソッドの名前を示す文字列 ※例：'matrix4fv'
         * @return {ProgramManager} プログラムマネージャークラスのインスタンス
         */

    }, {
        key: 'createProgramFromSource',
        value: function createProgramFromSource(vs, fs, attLocation, attStride, uniLocation, uniType) {
            if (this.gl == null) {
                return null;
            }
            var i = void 0;
            var mng = new ProgramManager(this.gl, this.isWebGL2);
            mng.vs = mng.createShaderFromSource(vs, this.gl.VERTEX_SHADER);
            mng.fs = mng.createShaderFromSource(fs, this.gl.FRAGMENT_SHADER);
            mng.prg = mng.createProgram(mng.vs, mng.fs);
            if (mng.prg == null) {
                return mng;
            }
            mng.attL = new Array(attLocation.length);
            mng.attS = new Array(attLocation.length);
            for (i = 0; i < attLocation.length; i++) {
                mng.attL[i] = this.gl.getAttribLocation(mng.prg, attLocation[i]);
                mng.attS[i] = attStride[i];
            }
            mng.uniL = new Array(uniLocation.length);
            for (i = 0; i < uniLocation.length; i++) {
                mng.uniL[i] = this.gl.getUniformLocation(mng.prg, uniLocation[i]);
            }
            mng.uniT = uniType;
            mng.locationCheck(attLocation, uniLocation);
            return mng;
        }

        /**
         * ファイルからシェーダのソースコードを取得しプログラムオブジェクトを生成する
         * @param {string} vsPath - 頂点シェーダのソースが記述されたファイルのパス
         * @param {string} fsPath - フラグメントシェーダのソースが記述されたファイルのパス
         * @param {Array.<string>} attLocation - attribute 変数名の配列
         * @param {Array.<number>} attStride - attribute 変数のストライドの配列
         * @param {Array.<string>} uniLocation - uniform 変数名の配列
         * @param {Array.<string>} uniType - uniform 変数更新メソッドの名前を示す文字列 ※例：'matrix4fv'
         * @param {function} callback - ソースコードのロードが完了しプログラムオブジェクトを生成した後に呼ばれるコールバック
         * @return {ProgramManager} プログラムマネージャークラスのインスタンス ※ロード前にインスタンスは戻り値として返却される
         */

    }, {
        key: 'createProgramFromFile',
        value: function createProgramFromFile(vsPath, fsPath, attLocation, attStride, uniLocation, uniType, callback) {
            if (this.gl == null) {
                return null;
            }
            var mng = new ProgramManager(this.gl, this.isWebGL2);
            var src = {
                vs: {
                    targetUrl: vsPath,
                    source: null
                },
                fs: {
                    targetUrl: fsPath,
                    source: null
                }
            };
            xhr(this.gl, src.vs);
            xhr(this.gl, src.fs);
            function xhr(gl, target) {
                var xml = new XMLHttpRequest();
                xml.open('GET', target.targetUrl, true);
                xml.setRequestHeader('Pragma', 'no-cache');
                xml.setRequestHeader('Cache-Control', 'no-cache');
                xml.onload = function () {
                    if (this.isConsoleOutput === true) {
                        console.log('%c◆%c shader file loaded: %c' + target.targetUrl, 'color: crimson', '', 'color: goldenrod');
                    }
                    target.source = xml.responseText;
                    loadCheck(gl);
                };
                xml.send();
            }
            function loadCheck(gl) {
                if (src.vs.source == null || src.fs.source == null) {
                    return;
                }
                var i = void 0;
                mng.vs = mng.createShaderFromSource(src.vs.source, gl.VERTEX_SHADER);
                mng.fs = mng.createShaderFromSource(src.fs.source, gl.FRAGMENT_SHADER);
                mng.prg = mng.createProgram(mng.vs, mng.fs);
                if (mng.prg == null) {
                    return mng;
                }
                mng.attL = new Array(attLocation.length);
                mng.attS = new Array(attLocation.length);
                for (i = 0; i < attLocation.length; i++) {
                    mng.attL[i] = gl.getAttribLocation(mng.prg, attLocation[i]);
                    mng.attS[i] = attStride[i];
                }
                mng.uniL = new Array(uniLocation.length);
                for (i = 0; i < uniLocation.length; i++) {
                    mng.uniL[i] = gl.getUniformLocation(mng.prg, uniLocation[i]);
                }
                mng.uniT = uniType;
                mng.locationCheck(attLocation, uniLocation);
                callback(mng);
            }
            return mng;
        }

        /**
         * バッファオブジェクトを削除する
         * @param {WebGLBuffer} buffer - 削除するバッファオブジェクト
         */

    }, {
        key: 'deleteBuffer',
        value: function deleteBuffer(buffer) {
            if (this.gl.isBuffer(buffer) !== true) {
                return;
            }
            this.gl.deleteBuffer(buffer);
            buffer = null;
        }

        /**
         * テクスチャオブジェクトを削除する
         * @param {WebGLTexture} texture - 削除するテクスチャオブジェクト
         */

    }, {
        key: 'deleteTexture',
        value: function deleteTexture(texture) {
            if (this.gl.isTexture(texture) !== true) {
                return;
            }
            this.gl.deleteTexture(texture);
            texture = null;
        }

        /**
         * フレームバッファやレンダーバッファを削除する
         * @param {object} obj - フレームバッファ生成メソッドが返すオブジェクト
         */

    }, {
        key: 'deleteFramebuffer',
        value: function deleteFramebuffer(obj) {
            if (obj == null) {
                return;
            }
            for (var v in obj) {
                if (obj[v] instanceof WebGLFramebuffer && this.gl.isFramebuffer(obj[v]) === true) {
                    this.gl.deleteFramebuffer(obj[v]);
                    obj[v] = null;
                    continue;
                }
                if (obj[v] instanceof WebGLRenderbuffer && this.gl.isRenderbuffer(obj[v]) === true) {
                    this.gl.deleteRenderbuffer(obj[v]);
                    obj[v] = null;
                    continue;
                }
                if (obj[v] instanceof WebGLTexture && this.gl.isTexture(obj[v]) === true) {
                    this.gl.deleteTexture(obj[v]);
                    obj[v] = null;
                }
            }
            obj = null;
        }

        /**
         * シェーダオブジェクトを削除する
         * @param {WebGLShader} shader - シェーダオブジェクト
         */

    }, {
        key: 'deleteShader',
        value: function deleteShader(shader) {
            if (this.gl.isShader(shader) !== true) {
                return;
            }
            this.gl.deleteShader(shader);
            shader = null;
        }

        /**
         * プログラムオブジェクトを削除する
         * @param {WebGLProgram} program - プログラムオブジェクト
         */

    }, {
        key: 'deleteProgram',
        value: function deleteProgram(program) {
            if (this.gl.isProgram(program) !== true) {
                return;
            }
            this.gl.deleteProgram(program);
            program = null;
        }

        /**
         * ProgramManager クラスを内部プロパティごと削除する
         * @param {ProgramManager} prg - ProgramManager クラスのインスタンス
         */

    }, {
        key: 'deleteProgramManager',
        value: function deleteProgramManager(prg) {
            if (prg == null || !(prg instanceof ProgramManager)) {
                return;
            }
            this.deleteShader(prg.vs);
            this.deleteShader(prg.fs);
            this.deleteProgram(prg.prg);
            prg.attL = null;
            prg.attS = null;
            prg.uniL = null;
            prg.uniT = null;
            prg = null;
        }
    }]);

    return gl3;
}();

/**
 * プログラムオブジェクトやシェーダを管理するマネージャ
 * @class ProgramManager
 */


exports.default = gl3;

var ProgramManager = function () {
    /**
     * @constructor
     * @param {WebGLRenderingContext} gl - 自身が属する WebGL Rendering Context
     * @param {bool} [webgl2Mode=false] - webgl2 を有効化したかどうか
     */
    function ProgramManager(gl) {
        var webgl2Mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        _classCallCheck(this, ProgramManager);

        /**
         * 自身が属する WebGL Rendering Context
         * @type {WebGLRenderingContext}
         */
        this.gl = gl;
        /**
         * WebGL2RenderingContext として初期化したかどうかを表す真偽値
         * @type {bool}
         */
        this.isWebGL2 = webgl2Mode;
        /**
         * 頂点シェーダのシェーダオブジェクト
         * @type {WebGLShader}
         */
        this.vs = null;
        /**
         * フラグメントシェーダのシェーダオブジェクト
         * @type {WebGLShader}
         */
        this.fs = null;
        /**
         * プログラムオブジェクト
         * @type {WebGLProgram}
         */
        this.prg = null;
        /**
         * アトリビュートロケーションの配列
         * @type {Array.<number>}
         */
        this.attL = null;
        /**
         * アトリビュート変数のストライドの配列
         * @type {Array.<number>}
         */
        this.attS = null;
        /**
         * ユニフォームロケーションの配列
         * @type {Array.<WebGLUniformLocation>}
         */
        this.uniL = null;
        /**
         * ユニフォーム変数のタイプの配列
         * @type {Array.<string>}
         */
        this.uniT = null;
        /**
         * エラー関連情報を格納する
         * @type {object}
         * @property {string} vs - 頂点シェーダのコンパイルエラー
         * @property {string} fs - フラグメントシェーダのコンパイルエラー
         * @property {string} prg - プログラムオブジェクトのリンクエラー
         */
        this.error = { vs: null, fs: null, prg: null };
    }

    /**
     * script タグの ID を元にソースコードを取得しシェーダオブジェクトを生成する
     * @param {string} id - script タグに付加された ID 文字列
     * @return {WebGLShader} 生成したシェーダオブジェクト
     */


    _createClass(ProgramManager, [{
        key: 'createShaderFromId',
        value: function createShaderFromId(id) {
            var shader = void 0;
            var scriptElement = document.getElementById(id);
            if (!scriptElement) {
                return;
            }
            switch (scriptElement.type) {
                case 'x-shader/x-vertex':
                    shader = this.gl.createShader(this.gl.VERTEX_SHADER);
                    break;
                case 'x-shader/x-fragment':
                    shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                    break;
                default:
                    return;
            }
            var source = scriptElement.text;
            if (this.isWebGL2 !== true) {
                if (source.search(/^#version 300 es/) > -1) {
                    console.warn('◆ can not use glsl es 3.0');
                    return;
                }
            }
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                return shader;
            } else {
                var err = this.gl.getShaderInfoLog(shader);
                if (scriptElement.type === 'x-shader/x-vertex') {
                    this.error.vs = err;
                } else {
                    this.error.fs = err;
                }
                console.warn('◆ compile failed of shader: ' + err);
            }
        }

        /**
         * シェーダのソースコードを文字列で引数から取得しシェーダオブジェクトを生成する
         * @param {string} source - シェーダのソースコード
         * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
         * @return {WebGLShader} 生成したシェーダオブジェクト
         */

    }, {
        key: 'createShaderFromSource',
        value: function createShaderFromSource(source, type) {
            var shader = void 0;
            switch (type) {
                case this.gl.VERTEX_SHADER:
                    shader = this.gl.createShader(this.gl.VERTEX_SHADER);
                    break;
                case this.gl.FRAGMENT_SHADER:
                    shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                    break;
                default:
                    return;
            }
            if (this.isWebGL2 !== true) {
                if (source.search(/^#version 300 es/) > -1) {
                    console.warn('◆ can not use glsl es 3.0');
                    return;
                }
            }
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                return shader;
            } else {
                var err = this.gl.getShaderInfoLog(shader);
                if (type === this.gl.VERTEX_SHADER) {
                    this.error.vs = err;
                } else {
                    this.error.fs = err;
                }
                console.warn('◆ compile failed of shader: ' + err);
            }
        }

        /**
         * シェーダオブジェクトを引数から取得しプログラムオブジェクトを生成する
         * @param {WebGLShader} vs - 頂点シェーダのシェーダオブジェクト
         * @param {WebGLShader} fs - フラグメントシェーダのシェーダオブジェクト
         * @return {WebGLProgram} 生成したプログラムオブジェクト
         */

    }, {
        key: 'createProgram',
        value: function createProgram(vs, fs) {
            if (vs == null || fs == null) {
                return null;
            }
            var program = this.gl.createProgram();
            this.gl.attachShader(program, vs);
            this.gl.attachShader(program, fs);
            this.gl.linkProgram(program);
            if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                this.gl.useProgram(program);
                return program;
            } else {
                var err = this.gl.getProgramInfoLog(program);
                this.error.prg = err;
                console.warn('◆ link program failed: ' + err);
            }
        }

        /**
         * 自身の内部プロパティとして存在するプログラムオブジェクトを設定する
         */

    }, {
        key: 'useProgram',
        value: function useProgram() {
            this.gl.useProgram(this.prg);
        }

        /**
         * VBO と IBO をバインドして有効化する
         * @param {Array.<WebGLBuffer>} vbo - VBO を格納した配列
         * @param {WebGLBuffer} [ibo] - IBO
         */

    }, {
        key: 'setAttribute',
        value: function setAttribute(vbo, ibo) {
            var gl = this.gl;
            for (var i in vbo) {
                if (this.attL[i] >= 0) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
                    gl.enableVertexAttribArray(this.attL[i]);
                    gl.vertexAttribPointer(this.attL[i], this.attS[i], gl.FLOAT, false, 0, 0);
                }
            }
            if (ibo != null) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            }
        }

        /**
         * シェーダにユニフォーム変数に設定する値をプッシュする
         * @param {Array.<mixed>} mixed - ユニフォーム変数に設定する値を格納した配列
         */

    }, {
        key: 'pushShader',
        value: function pushShader(mixed) {
            var gl = this.gl;
            for (var i = 0, j = this.uniT.length; i < j; i++) {
                var uni = 'uniform' + this.uniT[i].replace(/matrix/i, 'Matrix');
                if (gl[uni] != null) {
                    if (uni.search(/Matrix/) !== -1) {
                        gl[uni](this.uniL[i], false, mixed[i]);
                    } else {
                        gl[uni](this.uniL[i], mixed[i]);
                    }
                } else {
                    console.warn('◆ not support uniform type: ' + this.uniT[i]);
                }
            }
        }

        /**
         * アトリビュートロケーションとユニフォームロケーションが正しく取得できたかチェックする
         * @param {Array.<number>} attLocation - 取得したアトリビュートロケーションの配列
         * @param {Array.<WebGLUniformLocation>} uniLocation - 取得したユニフォームロケーションの配列
         */

    }, {
        key: 'locationCheck',
        value: function locationCheck(attLocation, uniLocation) {
            var i = void 0,
                l = void 0;
            for (i = 0, l = attLocation.length; i < l; i++) {
                if (this.attL[i] == null || this.attL[i] < 0) {
                    console.warn('◆ invalid attribute location: %c"' + attLocation[i] + '"', 'color: crimson');
                }
            }
            for (i = 0, l = uniLocation.length; i < l; i++) {
                if (this.uniL[i] == null || this.uniL[i] < 0) {
                    console.warn('◆ invalid uniform location: %c"' + uniLocation[i] + '"', 'color: crimson');
                }
            }
        }
    }]);

    return ProgramManager;
}();

window.gl3 = window.gl3 || new gl3();

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @example
 * step 1: let a = new gl3Audio(bgmGainValue, soundGainValue) <- float(0.0 to 1.0)
 * step 2: a.load(url, index, loop, background) <- string, int, boolean, boolean
 * step 3: a.src[index].loaded then a.src[index].play()
 */

/**
 * gl3Audio
 * @class gl3Audio
 */
var gl3Audio = function () {
    /**
     * @constructor
     * @param {number} bgmGainValue - BGM の再生音量
     * @param {number} soundGainValue - 効果音の再生音量
     */
    function gl3Audio(bgmGainValue, soundGainValue) {
        _classCallCheck(this, gl3Audio);

        /**
         * オーディオコンテキスト
         * @type {AudioContext}
         */
        this.ctx = null;
        /**
         * ダイナミックコンプレッサーノード
         * @type {DynamicsCompressorNode}
         */
        this.comp = null;
        /**
         * BGM 用のゲインノード
         * @type {GainNode}
         */
        this.bgmGain = null;
        /**
         * 効果音用のゲインノード
         * @type {GainNode}
         */
        this.soundGain = null;
        /**
         * オーディオソースをラップしたクラスの配列
         * @type {Array.<AudioSrc>}
         */
        this.src = null;
        if (typeof AudioContext != 'undefined' || typeof webkitAudioContext != 'undefined') {
            if (typeof AudioContext != 'undefined') {
                this.ctx = new AudioContext();
            } else {
                this.ctx = new webkitAudioContext();
            }
            this.comp = this.ctx.createDynamicsCompressor();
            this.comp.connect(this.ctx.destination);
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.connect(this.comp);
            this.bgmGain.gain.setValueAtTime(bgmGainValue, 0);
            this.soundGain = this.ctx.createGain();
            this.soundGain.connect(this.comp);
            this.soundGain.gain.setValueAtTime(soundGainValue, 0);
            this.src = [];
        } else {
            throw new Error('not found AudioContext');
        }
    }

    /**
     * ファイルをロードする
     * @param {string} path - オーディオファイルのパス
     * @param {number} index - 内部プロパティの配列に格納するインデックス
     * @param {boolean} loop - ループ再生を設定するかどうか
     * @param {boolean} background - BGM として設定するかどうか
     * @param {function} callback - 読み込みと初期化が完了したあと呼ばれるコールバック
     */


    _createClass(gl3Audio, [{
        key: 'load',
        value: function load(path, index, loop, background, callback) {
            var ctx = this.ctx;
            var gain = background ? this.bgmGain : this.soundGain;
            var src = this.src;
            src[index] = null;
            var xml = new XMLHttpRequest();
            xml.open('GET', path, true);
            xml.setRequestHeader('Pragma', 'no-cache');
            xml.setRequestHeader('Cache-Control', 'no-cache');
            xml.responseType = 'arraybuffer';
            xml.onload = function () {
                ctx.decodeAudioData(xml.response, function (buf) {
                    src[index] = new AudioSrc(ctx, gain, buf, loop, background);
                    src[index].loaded = true;
                    console.log('%c◆%c audio number: %c' + index + '%c, audio loaded: %c' + path, 'color: crimson', '', 'color: blue', '', 'color: goldenrod');
                    callback();
                }, function (e) {
                    console.log(e);
                });
            };
            xml.send();
        }

        /**
         * ロードの完了をチェックする
         * @return {boolean} ロードが完了しているかどうか
         */

    }, {
        key: 'loadComplete',
        value: function loadComplete() {
            var i = void 0,
                f = void 0;
            f = true;
            for (i = 0; i < this.src.length; i++) {
                f = f && this.src[i] != null && this.src[i].loaded;
            }
            return f;
        }
    }]);

    return gl3Audio;
}();

/**
 * オーディオやソースファイルを管理するためのクラス
 * @class AudioSrc
 */


exports.default = gl3Audio;

var AudioSrc = function () {
    /**
     * @constructor
     * @param {AudioContext} ctx - 対象となるオーディオコンテキスト
     * @param {GainNode} gain - 対象となるゲインノード
     * @param {ArrayBuffer} audioBuffer - バイナリのオーディオソース
     * @param {boolean} bool - ループ再生を設定するかどうか
     * @param {boolean} background - BGM として設定するかどうか
     */
    function AudioSrc(ctx, gain, audioBuffer, loop, background) {
        _classCallCheck(this, AudioSrc);

        /**
         * 対象となるオーディオコンテキスト
         * @type {AudioContext}
         */
        this.ctx = ctx;
        /**
         * 対象となるゲインノード
         * @type {GainNode}
         */
        this.gain = gain;
        /**
         * ソースファイルのバイナリデータ
         * @type {ArrayBuffer}
         */
        this.audioBuffer = audioBuffer;
        /**
         * オーディオバッファソースノードを格納する配列
         * @type {Array.<AudioBufferSourceNode>}
         */
        this.bufferSource = [];
        /**
         * アクティブなバッファソースのインデックス
         * @type {number}
         */
        this.activeBufferSource = 0;
        /**
         * ループするかどうかのフラグ
         * @type {boolean}
         */
        this.loop = loop;
        /**
         * ロード済みかどうかを示すフラグ
         * @type {boolean}
         */
        this.loaded = false;
        /**
         * FFT サイズ
         * @type {number}
         */
        this.fftLoop = 16;
        /**
         * このフラグが立っている場合再生中のデータを一度取得する
         * @type {boolean}
         */
        this.update = false;
        /**
         * BGM かどうかを示すフラグ
         * @type {boolean}
         */
        this.background = background;
        /**
         * スクリプトプロセッサーノード
         * @type {ScriptProcessorNode}
         */
        this.node = this.ctx.createScriptProcessor(2048, 1, 1);
        /**
         * アナライザノード
         * @type {AnalyserNode}
         */
        this.analyser = this.ctx.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.fftSize = this.fftLoop * 2;
        /**
         * データを取得する際に利用する型付き配列
         * @type {Uint8Array}
         */
        this.onData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    /**
     * オーディオを再生する
     */


    _createClass(AudioSrc, [{
        key: 'play',
        value: function play() {
            var _this = this;

            var i = void 0,
                j = void 0,
                k = void 0;
            var self = this;
            i = this.bufferSource.length;
            k = -1;
            if (i > 0) {
                for (j = 0; j < i; j++) {
                    if (!this.bufferSource[j].playnow) {
                        this.bufferSource[j] = null;
                        this.bufferSource[j] = this.ctx.createBufferSource();
                        k = j;
                        break;
                    }
                }
                if (k < 0) {
                    this.bufferSource[this.bufferSource.length] = this.ctx.createBufferSource();
                    k = this.bufferSource.length - 1;
                }
            } else {
                this.bufferSource[0] = this.ctx.createBufferSource();
                k = 0;
            }
            this.activeBufferSource = k;
            this.bufferSource[k].buffer = this.audioBuffer;
            this.bufferSource[k].loop = this.loop;
            this.bufferSource[k].playbackRate.value = 1.0;
            if (!this.loop) {
                this.bufferSource[k].onended = function () {
                    _this.stop(0);
                    _this.playnow = false;
                };
            }
            if (this.background) {
                this.bufferSource[k].connect(this.analyser);
                this.analyser.connect(this.node);
                this.node.connect(this.ctx.destination);
                this.node.onaudioprocess = function (eve) {
                    onprocessEvent(eve);
                };
            }
            this.bufferSource[k].connect(this.gain);
            this.bufferSource[k].start(0);
            this.bufferSource[k].playnow = true;

            function onprocessEvent(eve) {
                if (self.update) {
                    self.update = false;
                    self.analyser.getByteFrequencyData(self.onData);
                }
            }
        }

        /**
         * オーディオの再生を止める
         */

    }, {
        key: 'stop',
        value: function stop() {
            this.bufferSource[this.activeBufferSource].stop(0);
            this.playnow = false;
        }
    }]);

    return AudioSrc;
}();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * gl3Math
 * @class gl3Math
 */
var gl3Math =
/**
 * @constructor
 */
function gl3Math() {
    _classCallCheck(this, gl3Math);

    /**
     * Mat4
     * @type {Mat4}
     */
    this.Mat4 = Mat4;
    /**
     * Vec3
     * @type {Vec3}
     */
    this.Vec3 = Vec3;
    /**
     * Vec2
     * @type {Vec2}
     */
    this.Vec2 = Vec2;
    /**
     * Qtn
     * @type {Qtn}
     */
    this.Qtn = Qtn;
};

/**
 * Mat4
 * @class Mat4
 */


exports.default = gl3Math;

var Mat4 = function () {
    function Mat4() {
        _classCallCheck(this, Mat4);
    }

    _createClass(Mat4, null, [{
        key: "create",

        /**
         * 4x4 の正方行列を生成する
         * @return {Float32Array} 行列格納用の配列
         */
        value: function create() {
            return new Float32Array(16);
        }
        /**
         * 行列を単位化する（参照に注意）
         * @param {Float32Array.<Mat4>} dest - 単位化する行列
         * @return {Float32Array.<Mat4>} 単位化した行列
         */

    }, {
        key: "identity",
        value: function identity(dest) {
            dest[0] = 1;dest[1] = 0;dest[2] = 0;dest[3] = 0;
            dest[4] = 0;dest[5] = 1;dest[6] = 0;dest[7] = 0;
            dest[8] = 0;dest[9] = 0;dest[10] = 1;dest[11] = 0;
            dest[12] = 0;dest[13] = 0;dest[14] = 0;dest[15] = 1;
            return dest;
        }
        /**
         * 行列を乗算する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Mat4>} mat0 - 乗算される行列
         * @param {Float32Array.<Mat4>} mat1 - 乗算する行列
         * @param {Float32Array.<Mat4>} [dest] - 乗算結果を格納する行列
         * @return {Float32Array.<Mat4>} 乗算結果の行列
         */

    }, {
        key: "multiply",
        value: function multiply(mat0, mat1, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var a = mat0[0],
                b = mat0[1],
                c = mat0[2],
                d = mat0[3],
                e = mat0[4],
                f = mat0[5],
                g = mat0[6],
                h = mat0[7],
                i = mat0[8],
                j = mat0[9],
                k = mat0[10],
                l = mat0[11],
                m = mat0[12],
                n = mat0[13],
                o = mat0[14],
                p = mat0[15],
                A = mat1[0],
                B = mat1[1],
                C = mat1[2],
                D = mat1[3],
                E = mat1[4],
                F = mat1[5],
                G = mat1[6],
                H = mat1[7],
                I = mat1[8],
                J = mat1[9],
                K = mat1[10],
                L = mat1[11],
                M = mat1[12],
                N = mat1[13],
                O = mat1[14],
                P = mat1[15];
            out[0] = A * a + B * e + C * i + D * m;
            out[1] = A * b + B * f + C * j + D * n;
            out[2] = A * c + B * g + C * k + D * o;
            out[3] = A * d + B * h + C * l + D * p;
            out[4] = E * a + F * e + G * i + H * m;
            out[5] = E * b + F * f + G * j + H * n;
            out[6] = E * c + F * g + G * k + H * o;
            out[7] = E * d + F * h + G * l + H * p;
            out[8] = I * a + J * e + K * i + L * m;
            out[9] = I * b + J * f + K * j + L * n;
            out[10] = I * c + J * g + K * k + L * o;
            out[11] = I * d + J * h + K * l + L * p;
            out[12] = M * a + N * e + O * i + P * m;
            out[13] = M * b + N * f + O * j + P * n;
            out[14] = M * c + N * g + O * k + P * o;
            out[15] = M * d + N * h + O * l + P * p;
            return out;
        }
        /**
         * 行列に拡大縮小を適用する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Mat4>} mat - 適用を受ける行列
         * @param {Float32Array.<Vec3>} vec - XYZ の各軸に対して拡縮を適用する値の行列
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "scale",
        value: function scale(mat, vec, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            out[0] = mat[0] * vec[0];
            out[1] = mat[1] * vec[0];
            out[2] = mat[2] * vec[0];
            out[3] = mat[3] * vec[0];
            out[4] = mat[4] * vec[1];
            out[5] = mat[5] * vec[1];
            out[6] = mat[6] * vec[1];
            out[7] = mat[7] * vec[1];
            out[8] = mat[8] * vec[2];
            out[9] = mat[9] * vec[2];
            out[10] = mat[10] * vec[2];
            out[11] = mat[11] * vec[2];
            out[12] = mat[12];
            out[13] = mat[13];
            out[14] = mat[14];
            out[15] = mat[15];
            return out;
        }
        /**
         * 行列に平行移動を適用する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Mat4>} mat - 適用を受ける行列
         * @param {Float32Array.<Vec3>} vec - XYZ の各軸に対して平行移動を適用する値の行列
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "translate",
        value: function translate(mat, vec, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            out[0] = mat[0];out[1] = mat[1];out[2] = mat[2];out[3] = mat[3];
            out[4] = mat[4];out[5] = mat[5];out[6] = mat[6];out[7] = mat[7];
            out[8] = mat[8];out[9] = mat[9];out[10] = mat[10];out[11] = mat[11];
            out[12] = mat[0] * vec[0] + mat[4] * vec[1] + mat[8] * vec[2] + mat[12];
            out[13] = mat[1] * vec[0] + mat[5] * vec[1] + mat[9] * vec[2] + mat[13];
            out[14] = mat[2] * vec[0] + mat[6] * vec[1] + mat[10] * vec[2] + mat[14];
            out[15] = mat[3] * vec[0] + mat[7] * vec[1] + mat[11] * vec[2] + mat[15];
            return out;
        }
        /**
         * 行列に回転を適用する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Mat4>} mat - 適用を受ける行列
         * @param {number} angle - 回転量を表す値（ラジアン）
         * @param {Float32Array.<Vec3>} axis - 回転の軸
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "rotate",
        value: function rotate(mat, angle, axis, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
            if (!sq) {
                return null;
            }
            var a = axis[0],
                b = axis[1],
                c = axis[2];
            if (sq != 1) {
                sq = 1 / sq;a *= sq;b *= sq;c *= sq;
            }
            var d = Math.sin(angle),
                e = Math.cos(angle),
                f = 1 - e,
                g = mat[0],
                h = mat[1],
                i = mat[2],
                j = mat[3],
                k = mat[4],
                l = mat[5],
                m = mat[6],
                n = mat[7],
                o = mat[8],
                p = mat[9],
                q = mat[10],
                r = mat[11],
                s = a * a * f + e,
                t = b * a * f + c * d,
                u = c * a * f - b * d,
                v = a * b * f - c * d,
                w = b * b * f + e,
                x = c * b * f + a * d,
                y = a * c * f + b * d,
                z = b * c * f - a * d,
                A = c * c * f + e;
            if (angle) {
                if (mat != out) {
                    out[12] = mat[12];out[13] = mat[13];
                    out[14] = mat[14];out[15] = mat[15];
                }
            } else {
                out = mat;
            }
            out[0] = g * s + k * t + o * u;
            out[1] = h * s + l * t + p * u;
            out[2] = i * s + m * t + q * u;
            out[3] = j * s + n * t + r * u;
            out[4] = g * v + k * w + o * x;
            out[5] = h * v + l * w + p * x;
            out[6] = i * v + m * w + q * x;
            out[7] = j * v + n * w + r * x;
            out[8] = g * y + k * z + o * A;
            out[9] = h * y + l * z + p * A;
            out[10] = i * y + m * z + q * A;
            out[11] = j * y + n * z + r * A;
            return out;
        }
        /**
         * ビュー座標変換行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Vec3>} eye - 視点位置
         * @param {Float32Array.<Vec3>} center - 注視点
         * @param {Float32Array.<Vec3>} up - 上方向を示すベクトル
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "lookAt",
        value: function lookAt(eye, center, up, dest) {
            var eyeX = eye[0],
                eyeY = eye[1],
                eyeZ = eye[2],
                centerX = center[0],
                centerY = center[1],
                centerZ = center[2],
                upX = up[0],
                upY = up[1],
                upZ = up[2];
            if (eyeX == centerX && eyeY == centerY && eyeZ == centerZ) {
                return Mat4.identity(dest);
            }
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var x0 = void 0,
                x1 = void 0,
                x2 = void 0,
                y0 = void 0,
                y1 = void 0,
                y2 = void 0,
                z0 = void 0,
                z1 = void 0,
                z2 = void 0,
                l = void 0;
            z0 = eyeX - center[0];z1 = eyeY - center[1];z2 = eyeZ - center[2];
            l = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
            z0 *= l;z1 *= l;z2 *= l;
            x0 = upY * z2 - upZ * z1;
            x1 = upZ * z0 - upX * z2;
            x2 = upX * z1 - upY * z0;
            l = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
            if (!l) {
                x0 = 0;x1 = 0;x2 = 0;
            } else {
                l = 1 / l;
                x0 *= l;x1 *= l;x2 *= l;
            }
            y0 = z1 * x2 - z2 * x1;y1 = z2 * x0 - z0 * x2;y2 = z0 * x1 - z1 * x0;
            l = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
            if (!l) {
                y0 = 0;y1 = 0;y2 = 0;
            } else {
                l = 1 / l;
                y0 *= l;y1 *= l;y2 *= l;
            }
            out[0] = x0;out[1] = y0;out[2] = z0;out[3] = 0;
            out[4] = x1;out[5] = y1;out[6] = z1;out[7] = 0;
            out[8] = x2;out[9] = y2;out[10] = z2;out[11] = 0;
            out[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
            out[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
            out[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
            out[15] = 1;
            return out;
        }
        /**
         * 透視投影変換行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {number} fovy - 視野角（度数法）
         * @param {number} aspect - アスペクト比（幅 / 高さ）
         * @param {number} near - ニアクリップ面までの距離
         * @param {number} far - ファークリップ面までの距離
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "perspective",
        value: function perspective(fovy, aspect, near, far, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var t = near * Math.tan(fovy * Math.PI / 360);
            var r = t * aspect;
            var a = r * 2,
                b = t * 2,
                c = far - near;
            out[0] = near * 2 / a;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = near * 2 / b;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = -(far + near) / c;
            out[11] = -1;
            out[12] = 0;
            out[13] = 0;
            out[14] = -(far * near * 2) / c;
            out[15] = 0;
            return out;
        }
        /**
         * 正射影投影変換行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {number} left - 左端
         * @param {number} right - 右端
         * @param {number} top - 上端
         * @param {number} bottom - 下端
         * @param {number} near - ニアクリップ面までの距離
         * @param {number} far - ファークリップ面までの距離
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "ortho",
        value: function ortho(left, right, top, bottom, near, far, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var h = right - left;
            var v = top - bottom;
            var d = far - near;
            out[0] = 2 / h;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 2 / v;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = -2 / d;
            out[11] = 0;
            out[12] = -(left + right) / h;
            out[13] = -(top + bottom) / v;
            out[14] = -(far + near) / d;
            out[15] = 1;
            return out;
        }
        /**
         * 転置行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Mat4>} mat - 適用する行列
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "transpose",
        value: function transpose(mat, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            out[0] = mat[0];out[1] = mat[4];
            out[2] = mat[8];out[3] = mat[12];
            out[4] = mat[1];out[5] = mat[5];
            out[6] = mat[9];out[7] = mat[13];
            out[8] = mat[2];out[9] = mat[6];
            out[10] = mat[10];out[11] = mat[14];
            out[12] = mat[3];out[13] = mat[7];
            out[14] = mat[11];out[15] = mat[15];
            return out;
        }
        /**
         * 逆行列を生成する（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Mat4>} mat - 適用する行列
         * @param {Float32Array.<Mat4>} [dest] - 結果を格納する行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "inverse",
        value: function inverse(mat, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var a = mat[0],
                b = mat[1],
                c = mat[2],
                d = mat[3],
                e = mat[4],
                f = mat[5],
                g = mat[6],
                h = mat[7],
                i = mat[8],
                j = mat[9],
                k = mat[10],
                l = mat[11],
                m = mat[12],
                n = mat[13],
                o = mat[14],
                p = mat[15],
                q = a * f - b * e,
                r = a * g - c * e,
                s = a * h - d * e,
                t = b * g - c * f,
                u = b * h - d * f,
                v = c * h - d * g,
                w = i * n - j * m,
                x = i * o - k * m,
                y = i * p - l * m,
                z = j * o - k * n,
                A = j * p - l * n,
                B = k * p - l * o,
                ivd = 1 / (q * B - r * A + s * z + t * y - u * x + v * w);
            out[0] = (f * B - g * A + h * z) * ivd;
            out[1] = (-b * B + c * A - d * z) * ivd;
            out[2] = (n * v - o * u + p * t) * ivd;
            out[3] = (-j * v + k * u - l * t) * ivd;
            out[4] = (-e * B + g * y - h * x) * ivd;
            out[5] = (a * B - c * y + d * x) * ivd;
            out[6] = (-m * v + o * s - p * r) * ivd;
            out[7] = (i * v - k * s + l * r) * ivd;
            out[8] = (e * A - f * y + h * w) * ivd;
            out[9] = (-a * A + b * y - d * w) * ivd;
            out[10] = (m * u - n * s + p * q) * ivd;
            out[11] = (-i * u + j * s - l * q) * ivd;
            out[12] = (-e * z + f * x - g * w) * ivd;
            out[13] = (a * z - b * x + c * w) * ivd;
            out[14] = (-m * t + n * r - o * q) * ivd;
            out[15] = (i * t - j * r + k * q) * ivd;
            return out;
        }
        /**
         * 行列にベクトルを乗算する（ベクトルに行列を適用する）
         * @param {Float32Array.<Mat4>} mat - 適用する行列
         * @param {Array.<number>} vec - 乗算するベクトル（4 つの要素を持つ配列）
         * @return {Float32Array} 結果のベクトル
         */

    }, {
        key: "toVecIV",
        value: function toVecIV(mat, vec) {
            var a = mat[0],
                b = mat[1],
                c = mat[2],
                d = mat[3],
                e = mat[4],
                f = mat[5],
                g = mat[6],
                h = mat[7],
                i = mat[8],
                j = mat[9],
                k = mat[10],
                l = mat[11],
                m = mat[12],
                n = mat[13],
                o = mat[14],
                p = mat[15];
            var x = vec[0],
                y = vec[1],
                z = vec[2],
                w = vec[3];
            var out = [];
            out[0] = x * a + y * e + z * i + w * m;
            out[1] = x * b + y * f + z * j + w * n;
            out[2] = x * c + y * g + z * k + w * o;
            out[3] = x * d + y * h + z * l + w * p;
            vec = out;
            return out;
        }
        /**
         * カメラのプロパティに相当する情報を受け取り行列を生成する
         * @param {Float32Array.<Vec3>} position - カメラの座標
         * @param {Float32Array.<Vec3>} centerPoint - カメラの注視点
         * @param {Float32Array.<Vec3>} upDirection - カメラの上方向
         * @param {number} fovy - 視野角
         * @param {number} aspect - アスペクト比
         * @param {number} near - ニアクリップ面
         * @param {number} far - ファークリップ面
         * @param {Float32Array.<Mat4>} vmat - ビュー座標変換行列の結果を格納する行列
         * @param {Float32Array.<Mat4>} pmat - 透視投影座標変換行列の結果を格納する行列
         * @param {Float32Array.<Mat4>} dest - ビュー x 透視投影変換行列の結果を格納する行列
         */

    }, {
        key: "vpFromCameraProperty",
        value: function vpFromCameraProperty(position, centerPoint, upDirection, fovy, aspect, near, far, vmat, pmat, dest) {
            Mat4.lookAt(position, centerPoint, upDirection, vmat);
            Mat4.perspective(fovy, aspect, near, far, pmat);
            Mat4.multiply(pmat, vmat, dest);
        }
        /**
         * MVP 行列に相当する行列を受け取りベクトルを変換して返す
         * @param {Float32Array.<Mat4>} mat - MVP 行列
         * @param {Array.<number>} vec - MVP 行列と乗算するベクトル
         * @param {number} width - ビューポートの幅
         * @param {number} height - ビューポートの高さ
         * @return {Array.<number>} 結果のベクトル（2 つの要素を持つベクトル）
         */

    }, {
        key: "screenPositionFromMvp",
        value: function screenPositionFromMvp(mat, vec, width, height) {
            var halfWidth = width * 0.5;
            var halfHeight = height * 0.5;
            var v = Mat4.toVecIV(mat, [vec[0], vec[1], vec[2], 1.0]);
            if (v[3] <= 0.0) {
                return [NaN, NaN];
            }
            v[0] /= v[3];v[1] /= v[3];v[2] /= v[3];
            return [halfWidth + v[0] * halfWidth, halfHeight - v[1] * halfHeight];
        }
    }]);

    return Mat4;
}();

/**
 * Vec3
 * @class Vec3
 */


var Vec3 = function () {
    function Vec3() {
        _classCallCheck(this, Vec3);
    }

    _createClass(Vec3, null, [{
        key: "create",

        /**
         * 3 つの要素を持つベクトルを生成する
         * @return {Float32Array} ベクトル格納用の配列
         */
        value: function create() {
            return new Float32Array(3);
        }
        /**
         * ベクトルの長さ（大きさ）を返す
         * @param {Float32Array.<Vec3>} v - 3 つの要素を持つベクトル
         * @return {number} ベクトルの長さ（大きさ）
         */

    }, {
        key: "len",
        value: function len(v) {
            return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        }
        /**
         * 2 つの座標（始点・終点）を結ぶベクトルを返す
         * @param {Float32Array.<Vec3>} v0 - 3 つの要素を持つ始点座標
         * @param {Float32Array.<Vec3>} v1 - 3 つの要素を持つ終点座標
         * @return {Float32Array.<Vec3>} 視点と終点を結ぶベクトル
         */

    }, {
        key: "distance",
        value: function distance(v0, v1) {
            var n = Vec3.create();
            n[0] = v1[0] - v0[0];
            n[1] = v1[1] - v0[1];
            n[2] = v1[2] - v0[2];
            return n;
        }
        /**
         * ベクトルを正規化した結果を返す
         * @param {Float32Array.<Vec3>} v - 3 つの要素を持つベクトル
         * @return {Float32Array.<Vec3>} 正規化したベクトル
         */

    }, {
        key: "normalize",
        value: function normalize(v) {
            var n = Vec3.create();
            var l = Vec3.len(v);
            if (l > 0) {
                var e = 1.0 / l;
                n[0] = v[0] * e;
                n[1] = v[1] * e;
                n[2] = v[2] * e;
            } else {
                n[0] = 0.0;
                n[1] = 0.0;
                n[2] = 0.0;
            }
            return n;
        }
        /**
         * 2 つのベクトルの内積の結果を返す
         * @param {Float32Array.<Vec3>} v0 - 3 つの要素を持つベクトル
         * @param {Float32Array.<Vec3>} v1 - 3 つの要素を持つベクトル
         * @return {number} 内積の結果
         */

    }, {
        key: "dot",
        value: function dot(v0, v1) {
            return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        }
        /**
         * 2 つのベクトルの外積の結果を返す
         * @param {Float32Array.<Vec3>} v0 - 3 つの要素を持つベクトル
         * @param {Float32Array.<Vec3>} v1 - 3 つの要素を持つベクトル
         * @return {Float32Array.<Vec3>} 外積の結果
         */

    }, {
        key: "cross",
        value: function cross(v0, v1) {
            var n = Vec3.create();
            n[0] = v0[1] * v1[2] - v0[2] * v1[1];
            n[1] = v0[2] * v1[0] - v0[0] * v1[2];
            n[2] = v0[0] * v1[1] - v0[1] * v1[0];
            return n;
        }
        /**
         * 3 つのベクトルから面法線を求めて返す
         * @param {Float32Array.<Vec3>} v0 - 3 つの要素を持つベクトル
         * @param {Float32Array.<Vec3>} v1 - 3 つの要素を持つベクトル
         * @param {Float32Array.<Vec3>} v2 - 3 つの要素を持つベクトル
         * @return {Float32Array.<Vec3>} 面法線ベクトル
         */

    }, {
        key: "faceNormal",
        value: function faceNormal(v0, v1, v2) {
            var n = Vec3.create();
            var vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            var vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
            n[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
            n[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
            n[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];
            return Vec3.normalize(n);
        }
    }]);

    return Vec3;
}();

/**
 * Vec2
 * @class Vec2
 */


var Vec2 = function () {
    function Vec2() {
        _classCallCheck(this, Vec2);
    }

    _createClass(Vec2, null, [{
        key: "create",

        /**
         * 2 つの要素を持つベクトルを生成する
         * @return {Float32Array} ベクトル格納用の配列
         */
        value: function create() {
            return new Float32Array(2);
        }
        /**
         * ベクトルの長さ（大きさ）を返す
         * @param {Float32Array.<Vec2>} v - 2 つの要素を持つベクトル
         * @return {number} ベクトルの長さ（大きさ）
         */

    }, {
        key: "len",
        value: function len(v) {
            return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        }
        /**
         * 2 つの座標（始点・終点）を結ぶベクトルを返す
         * @param {Float32Array.<Vec2>} v0 - 2 つの要素を持つ始点座標
         * @param {Float32Array.<Vec2>} v1 - 2 つの要素を持つ終点座標
         * @return {Float32Array.<Vec2>} 視点と終点を結ぶベクトル
         */

    }, {
        key: "distance",
        value: function distance(v0, v1) {
            var n = Vec2.create();
            n[0] = v1[0] - v0[0];
            n[1] = v1[1] - v0[1];
            return n;
        }
        /**
         * ベクトルを正規化した結果を返す
         * @param {Float32Array.<Vec2>} v - 2 つの要素を持つベクトル
         * @return {Float32Array.<Vec2>} 正規化したベクトル
         */

    }, {
        key: "normalize",
        value: function normalize(v) {
            var n = Vec2.create();
            var l = Vec2.len(v);
            if (l > 0) {
                var e = 1.0 / l;
                n[0] = v[0] * e;
                n[1] = v[1] * e;
            }
            return n;
        }
        /**
         * 2 つのベクトルの内積の結果を返す
         * @param {Float32Array.<Vec2>} v0 - 2 つの要素を持つベクトル
         * @param {Float32Array.<Vec2>} v1 - 2 つの要素を持つベクトル
         * @return {number} 内積の結果
         */

    }, {
        key: "dot",
        value: function dot(v0, v1) {
            return v0[0] * v1[0] + v0[1] * v1[1];
        }
        /**
         * 2 つのベクトルの外積の結果を返す
         * @param {Float32Array.<Vec2>} v0 - 2 つの要素を持つベクトル
         * @param {Float32Array.<Vec2>} v1 - 2 つの要素を持つベクトル
         * @return {Float32Array.<Vec2>} 外積の結果
         */

    }, {
        key: "cross",
        value: function cross(v0, v1) {
            var n = Vec2.create();
            return v0[0] * v1[1] - v0[1] * v1[0];
        }
    }]);

    return Vec2;
}();

/**
 * Qtn
 * @class Qtn
 */


var Qtn = function () {
    function Qtn() {
        _classCallCheck(this, Qtn);
    }

    _createClass(Qtn, null, [{
        key: "create",

        /**
         * 4 つの要素からなるクォータニオンのデータ構造を生成する（虚部 x, y, z, 実部 w の順序で定義）
         * @return {Float32Array} クォータニオンデータ格納用の配列
         */
        value: function create() {
            return new Float32Array(4);
        }
        /**
         * クォータニオンを初期化する（参照に注意）
         * @param {Float32Array.<Qtn>} dest - 初期化するクォータニオン
         * @return {Float32Array.<Qtn>} 結果のクォータニオン
         */

    }, {
        key: "identity",
        value: function identity(dest) {
            dest[0] = 0;dest[1] = 0;dest[2] = 0;dest[3] = 1;
            return dest;
        }
        /**
         * 共役四元数を生成して返す（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Qtn>} qtn - 元となるクォータニオン
         * @param {Float32Array.<Qtn>} [dest] - 結果を格納するクォータニオン
         * @return {Float32Array.<Qtn>} 結果のクォータニオン
         */

    }, {
        key: "inverse",
        value: function inverse(qtn, dest) {
            var out = dest;
            if (dest == null) {
                out = Qtn.create();
            }
            out[0] = -qtn[0];
            out[1] = -qtn[1];
            out[2] = -qtn[2];
            out[3] = qtn[3];
            return out;
        }
        /**
         * 虚部を正規化して返す（参照に注意）
         * @param {Float32Array.<Qtn>} qtn - 元となるクォータニオン
         * @return {Float32Array.<Qtn>} 結果のクォータニオン
         */

    }, {
        key: "normalize",
        value: function normalize(dest) {
            var x = dest[0],
                y = dest[1],
                z = dest[2];
            var l = Math.sqrt(x * x + y * y + z * z);
            if (l === 0) {
                dest[0] = 0;
                dest[1] = 0;
                dest[2] = 0;
            } else {
                l = 1 / l;
                dest[0] = x * l;
                dest[1] = y * l;
                dest[2] = z * l;
            }
            return dest;
        }
        /**
         * クォータニオンを乗算した結果を返す（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Qtn>} qtn0 - 乗算されるクォータニオン
         * @param {Float32Array.<Qtn>} qtn1 - 乗算するクォータニオン
         * @param {Float32Array.<Qtn>} [dest] - 結果を格納するクォータニオン
         * @return {Float32Array.<Qtn>} 結果のクォータニオン
         */

    }, {
        key: "multiply",
        value: function multiply(qtn0, qtn1, dest) {
            var out = dest;
            if (dest == null) {
                out = Qtn.create();
            }
            var ax = qtn0[0],
                ay = qtn0[1],
                az = qtn0[2],
                aw = qtn0[3];
            var bx = qtn1[0],
                by = qtn1[1],
                bz = qtn1[2],
                bw = qtn1[3];
            out[0] = ax * bw + aw * bx + ay * bz - az * by;
            out[1] = ay * bw + aw * by + az * bx - ax * bz;
            out[2] = az * bw + aw * bz + ax * by - ay * bx;
            out[3] = aw * bw - ax * bx - ay * by - az * bz;
            return out;
        }
        /**
         * クォータニオンに回転を適用し返す（参照に注意・戻り値としても結果を返す）
         * @param {number} angle - 回転する量（ラジアン）
         * @param {Array.<number>} axis - 3 つの要素を持つ軸ベクトル
         * @param {Float32Array.<Qtn>} [dest] - 結果を格納するクォータニオン
         * @return {Float32Array.<Qtn>} 結果のクォータニオン
         */

    }, {
        key: "rotate",
        value: function rotate(angle, axis, dest) {
            var out = dest;
            if (dest == null) {
                out = Qtn.create();
            }
            var a = axis[0],
                b = axis[1],
                c = axis[2];
            var sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
            if (sq !== 0) {
                var l = 1 / sq;
                a *= l;
                b *= l;
                c *= l;
            }
            var s = Math.sin(angle * 0.5);
            out[0] = a * s;
            out[1] = b * s;
            out[2] = c * s;
            out[3] = Math.cos(angle * 0.5);
            return out;
        }
        /**
         * ベクトルにクォータニオンを適用し返す（参照に注意・戻り値としても結果を返す）
         * @param {Array.<number>} vec - 3 つの要素を持つベクトル
         * @param {Float32Array.<Qtn>} qtn - クォータニオン
         * @param {Array.<number>} [dest] - 3 つの要素を持つベクトル
         * @return {Array.<number>} 結果のベクトル
         */

    }, {
        key: "toVecIII",
        value: function toVecIII(vec, qtn, dest) {
            var out = dest;
            if (dest == null) {
                out = [0.0, 0.0, 0.0];
            }
            var qp = Qtn.create();
            var qq = Qtn.create();
            var qr = Qtn.create();
            Qtn.inverse(qtn, qr);
            qp[0] = vec[0];
            qp[1] = vec[1];
            qp[2] = vec[2];
            Qtn.multiply(qr, qp, qq);
            Qtn.multiply(qq, qtn, qr);
            out[0] = qr[0];
            out[1] = qr[1];
            out[2] = qr[2];
            return out;
        }
        /**
         * 4x4 行列にクォータニオンを適用し返す（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Qtn>} qtn - クォータニオン
         * @param {Float32Array.<Mat4>} [dest] - 4x4 行列
         * @return {Float32Array.<Mat4>} 結果の行列
         */

    }, {
        key: "toMatIV",
        value: function toMatIV(qtn, dest) {
            var out = dest;
            if (dest == null) {
                out = Mat4.create();
            }
            var x = qtn[0],
                y = qtn[1],
                z = qtn[2],
                w = qtn[3];
            var x2 = x + x,
                y2 = y + y,
                z2 = z + z;
            var xx = x * x2,
                xy = x * y2,
                xz = x * z2;
            var yy = y * y2,
                yz = y * z2,
                zz = z * z2;
            var wx = w * x2,
                wy = w * y2,
                wz = w * z2;
            out[0] = 1 - (yy + zz);
            out[1] = xy - wz;
            out[2] = xz + wy;
            out[3] = 0;
            out[4] = xy + wz;
            out[5] = 1 - (xx + zz);
            out[6] = yz - wx;
            out[7] = 0;
            out[8] = xz - wy;
            out[9] = yz + wx;
            out[10] = 1 - (xx + yy);
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;
            return out;
        }
        /**
         * 2 つのクォータニオンの球面線形補間を行った結果を返す（参照に注意・戻り値としても結果を返す）
         * @param {Float32Array.<Qtn>} qtn0 - クォータニオン
         * @param {Float32Array.<Qtn>} qtn1 - クォータニオン
         * @param {number} time - 補間係数（0.0 から 1.0 で指定）
         * @param {Float32Array.<Qtn>} [dest] - 結果を格納するクォータニオン
         * @return {Float32Array.<Qtn>} 結果のクォータニオン
         */

    }, {
        key: "slerp",
        value: function slerp(qtn0, qtn1, time, dest) {
            var out = dest;
            if (dest == null) {
                out = Qtn.create();
            }
            var ht = qtn0[0] * qtn1[0] + qtn0[1] * qtn1[1] + qtn0[2] * qtn1[2] + qtn0[3] * qtn1[3];
            var hs = 1.0 - ht * ht;
            if (hs <= 0.0) {
                out[0] = qtn0[0];
                out[1] = qtn0[1];
                out[2] = qtn0[2];
                out[3] = qtn0[3];
            } else {
                hs = Math.sqrt(hs);
                if (Math.abs(hs) < 0.0001) {
                    out[0] = qtn0[0] * 0.5 + qtn1[0] * 0.5;
                    out[1] = qtn0[1] * 0.5 + qtn1[1] * 0.5;
                    out[2] = qtn0[2] * 0.5 + qtn1[2] * 0.5;
                    out[3] = qtn0[3] * 0.5 + qtn1[3] * 0.5;
                } else {
                    var ph = Math.acos(ht);
                    var pt = ph * time;
                    var t0 = Math.sin(ph - pt) / hs;
                    var t1 = Math.sin(pt) / hs;
                    out[0] = qtn0[0] * t0 + qtn1[0] * t1;
                    out[1] = qtn0[1] * t0 + qtn1[1] * t1;
                    out[2] = qtn0[2] * t0 + qtn1[2] * t1;
                    out[3] = qtn0[3] * t0 + qtn1[3] * t1;
                }
            }
            return out;
        }
    }]);

    return Qtn;
}();

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * gl3Mesh
 * @class
 */
var gl3Mesh = function () {
    function gl3Mesh() {
        _classCallCheck(this, gl3Mesh);
    }

    _createClass(gl3Mesh, null, [{
        key: "plane",

        /**
         * 板ポリゴンの頂点情報を生成する
         * @param {number} width - 板ポリゴンの一辺の幅
         * @param {number} height - 板ポリゴンの一辺の高さ
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let planeData = gl3.Mesh.plane(2.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
         */
        value: function plane(width, height, color) {
            var w = void 0,
                h = void 0;
            w = width / 2;
            h = height / 2;
            if (color) {
                tc = color;
            } else {
                tc = [1.0, 1.0, 1.0, 1.0];
            }
            var pos = [-w, h, 0.0, w, h, 0.0, -w, -h, 0.0, w, -h, 0.0];
            var nor = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0];
            var col = [color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3]];
            var st = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
            var idx = [0, 1, 2, 2, 1, 3];
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }

        /**
         * 円（XY 平面展開）の頂点情報を生成する
         * @param {number} split - 円の円周の分割数
         * @param {number} rad - 円の半径
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let circleData = gl3.Mesh.circle(64, 1.0, [1.0, 1.0, 1.0, 1.0]);
         */

    }, {
        key: "circle",
        value: function circle(split, rad, color) {
            var i = void 0,
                j = 0;
            var pos = [],
                nor = [],
                col = [],
                st = [],
                idx = [];
            pos.push(0.0, 0.0, 0.0);
            nor.push(0.0, 0.0, 1.0);
            col.push(color[0], color[1], color[2], color[3]);
            st.push(0.5, 0.5);
            for (i = 0; i < split; i++) {
                var r = Math.PI * 2.0 / split * i;
                var rx = Math.cos(r);
                var ry = Math.sin(r);
                pos.push(rx * rad, ry * rad, 0.0);
                nor.push(0.0, 0.0, 1.0);
                col.push(color[0], color[1], color[2], color[3]);
                st.push((rx + 1.0) * 0.5, 1.0 - (ry + 1.0) * 0.5);
                if (i === split - 1) {
                    idx.push(0, j + 1, 1);
                } else {
                    idx.push(0, j + 1, j + 2);
                }
                ++j;
            }
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }

        /**
         * キューブの頂点情報を生成する
         * @param {number} side - 正立方体の一辺の長さ
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線 ※キューブの中心から各頂点に向かって伸びるベクトルなので注意
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let cubeData = gl3.Mesh.cube(2.0, [1.0, 1.0, 1.0, 1.0]);
         */

    }, {
        key: "cube",
        value: function cube(side, color) {
            var hs = side * 0.5;
            var pos = [-hs, -hs, hs, hs, -hs, hs, hs, hs, hs, -hs, hs, hs, -hs, -hs, -hs, -hs, hs, -hs, hs, hs, -hs, hs, -hs, -hs, -hs, hs, -hs, -hs, hs, hs, hs, hs, hs, hs, hs, -hs, -hs, -hs, -hs, hs, -hs, -hs, hs, -hs, hs, -hs, -hs, hs, hs, -hs, -hs, hs, hs, -hs, hs, hs, hs, hs, -hs, hs, -hs, -hs, -hs, -hs, -hs, hs, -hs, hs, hs, -hs, hs, -hs];
            var v = 1.0 / Math.sqrt(3.0);
            var nor = [-v, -v, v, v, -v, v, v, v, v, -v, v, v, -v, -v, -v, -v, v, -v, v, v, -v, v, -v, -v, -v, v, -v, -v, v, v, v, v, v, v, v, -v, -v, -v, -v, v, -v, -v, v, -v, v, -v, -v, v, v, -v, -v, v, v, -v, v, v, v, v, -v, v, -v, -v, -v, -v, -v, v, -v, v, v, -v, v, -v];
            var col = [];
            for (var i = 0; i < pos.length / 3; i++) {
                col.push(color[0], color[1], color[2], color[3]);
            }
            var st = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
            var idx = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23];
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }

        /**
         * 三角錐の頂点情報を生成する
         * @param {number} split - 底面円の円周の分割数
         * @param {number} rad - 底面円の半径
         * @param {number} height - 三角錐の高さ
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let coneData = gl3.Mesh.cone(64, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
         */

    }, {
        key: "cone",
        value: function cone(split, rad, height, color) {
            var i = void 0,
                j = 0;
            var h = height / 2.0;
            var pos = [],
                nor = [],
                col = [],
                st = [],
                idx = [];
            pos.push(0.0, -h, 0.0);
            nor.push(0.0, -1.0, 0.0);
            col.push(color[0], color[1], color[2], color[3]);
            st.push(0.5, 0.5);
            for (i = 0; i <= split; i++) {
                var r = Math.PI * 2.0 / split * i;
                var rx = Math.cos(r);
                var rz = Math.sin(r);
                pos.push(rx * rad, -h, rz * rad, rx * rad, -h, rz * rad);
                nor.push(0.0, -1.0, 0.0, rx, 0.0, rz);
                col.push(color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3]);
                st.push((rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5, (rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5);
                if (i !== split) {
                    idx.push(0, j + 1, j + 3);
                    idx.push(j + 4, j + 2, split * 2 + 3);
                }
                j += 2;
            }
            pos.push(0.0, h, 0.0);
            nor.push(0.0, 1.0, 0.0);
            col.push(color[0], color[1], color[2], color[3]);
            st.push(0.5, 0.5);
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }

        /**
         * 円柱の頂点情報を生成する
         * @param {number} split - 円柱の円周の分割数
         * @param {number} topRad - 円柱の天面の半径
         * @param {number} bottomRad - 円柱の底面の半径
         * @param {number} height - 円柱の高さ
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let cylinderData = gl3.Mesh.cylinder(64, 0.5, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
         */

    }, {
        key: "cylinder",
        value: function cylinder(split, topRad, bottomRad, height, color) {
            var i = void 0,
                j = 2;
            var h = height / 2.0;
            var pos = [],
                nor = [],
                col = [],
                st = [],
                idx = [];
            pos.push(0.0, h, 0.0, 0.0, -h, 0.0);
            nor.push(0.0, 1.0, 0.0, 0.0, -1.0, 0.0);
            col.push(color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3]);
            st.push(0.5, 0.5, 0.5, 0.5);
            for (i = 0; i <= split; i++) {
                var r = Math.PI * 2.0 / split * i;
                var rx = Math.cos(r);
                var rz = Math.sin(r);
                pos.push(rx * topRad, h, rz * topRad, rx * topRad, h, rz * topRad, rx * bottomRad, -h, rz * bottomRad, rx * bottomRad, -h, rz * bottomRad);
                nor.push(0.0, 1.0, 0.0, rx, 0.0, rz, 0.0, -1.0, 0.0, rx, 0.0, rz);
                col.push(color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3]);
                st.push((rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5, 1.0 - i / split, 0.0, (rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5, 1.0 - i / split, 1.0);
                if (i !== split) {
                    idx.push(0, j + 4, j, 1, j + 2, j + 6, j + 5, j + 7, j + 1, j + 1, j + 7, j + 3);
                }
                j += 4;
            }
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }

        /**
         * 球体の頂点情報を生成する
         * @param {number} row - 球の縦方向（緯度方向）の分割数
         * @param {number} column - 球の横方向（経度方向）の分割数
         * @param {number} rad - 球の半径
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let sphereData = gl3.Mesh.sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
         */

    }, {
        key: "sphere",
        value: function sphere(row, column, rad, color) {
            var i = void 0,
                j = void 0;
            var pos = [],
                nor = [],
                col = [],
                st = [],
                idx = [];
            for (i = 0; i <= row; i++) {
                var r = Math.PI / row * i;
                var ry = Math.cos(r);
                var rr = Math.sin(r);
                for (j = 0; j <= column; j++) {
                    var tr = Math.PI * 2 / column * j;
                    var tx = rr * rad * Math.cos(tr);
                    var ty = ry * rad;
                    var tz = rr * rad * Math.sin(tr);
                    var rx = rr * Math.cos(tr);
                    var rz = rr * Math.sin(tr);
                    pos.push(tx, ty, tz);
                    nor.push(rx, ry, rz);
                    col.push(color[0], color[1], color[2], color[3]);
                    st.push(1 - 1 / column * j, 1 / row * i);
                }
            }
            for (i = 0; i < row; i++) {
                for (j = 0; j < column; j++) {
                    var _r = (column + 1) * i + j;
                    idx.push(_r, _r + 1, _r + column + 2);
                    idx.push(_r, _r + column + 2, _r + column + 1);
                }
            }
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }

        /**
         * トーラスの頂点情報を生成する
         * @param {number} row - 輪の分割数
         * @param {number} column - パイプ断面の分割数
         * @param {number} irad - パイプ断面の半径
         * @param {number} orad - パイプ全体の半径
         * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
         * @return {object}
         * @property {Array.<number>} position - 頂点座標
         * @property {Array.<number>} normal - 頂点法線
         * @property {Array.<number>} color - 頂点カラー
         * @property {Array.<number>} texCoord - テクスチャ座標
         * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
         * @example
         * let torusData = gl3.Mesh.torus(64, 64, 0.25, 0.75, [1.0, 1.0, 1.0, 1.0]);
         */

    }, {
        key: "torus",
        value: function torus(row, column, irad, orad, color) {
            var i = void 0,
                j = void 0;
            var pos = [],
                nor = [],
                col = [],
                st = [],
                idx = [];
            for (i = 0; i <= row; i++) {
                var r = Math.PI * 2 / row * i;
                var rr = Math.cos(r);
                var ry = Math.sin(r);
                for (j = 0; j <= column; j++) {
                    var tr = Math.PI * 2 / column * j;
                    var tx = (rr * irad + orad) * Math.cos(tr);
                    var ty = ry * irad;
                    var tz = (rr * irad + orad) * Math.sin(tr);
                    var rx = rr * Math.cos(tr);
                    var rz = rr * Math.sin(tr);
                    var rs = 1 / column * j;
                    var rt = 1 / row * i + 0.5;
                    if (rt > 1.0) {
                        rt -= 1.0;
                    }
                    rt = 1.0 - rt;
                    pos.push(tx, ty, tz);
                    nor.push(rx, ry, rz);
                    col.push(color[0], color[1], color[2], color[3]);
                    st.push(rs, rt);
                }
            }
            for (i = 0; i < row; i++) {
                for (j = 0; j < column; j++) {
                    var _r2 = (column + 1) * i + j;
                    idx.push(_r2, _r2 + column + 1, _r2 + 1);
                    idx.push(_r2 + column + 1, _r2 + column + 2, _r2 + 1);
                }
            }
            return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
        }
    }]);

    return gl3Mesh;
}();

exports.default = gl3Mesh;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * gl3Util
 * @class gl3Util
 */
var gl3Util = function () {
    function gl3Util() {
        _classCallCheck(this, gl3Util);
    }

    _createClass(gl3Util, null, [{
        key: "hsva",

        /**
         * HSV カラーを生成して配列で返す
         * @param {number} h - 色相
         * @param {number} s - 彩度
         * @param {number} v - 明度
         * @param {number} a - アルファ
         * @return {Array.<number>} RGBA を 0.0 から 1.0 の範囲に正規化した色の配列
         */
        value: function hsva(h, s, v, a) {
            if (s > 1 || v > 1 || a > 1) {
                return;
            }
            var th = h % 360;
            var i = Math.floor(th / 60);
            var f = th / 60 - i;
            var m = v * (1 - s);
            var n = v * (1 - s * f);
            var k = v * (1 - s * (1 - f));
            var color = new Array();
            if (!s > 0 && !s < 0) {
                color.push(v, v, v, a);
            } else {
                var r = new Array(v, n, m, m, k, v);
                var g = new Array(k, v, v, n, m, m);
                var b = new Array(m, m, k, v, v, n);
                color.push(r[i], g[i], b[i], a);
            }
            return color;
        }

        /**
         * イージング
         * @param {number} t - 0.0 から 1.0 の値
         * @return {number} イージングした結果
         */

    }, {
        key: "easeLiner",
        value: function easeLiner(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }

        /**
         * イージング
         * @param {number} t - 0.0 から 1.0 の値
         * @return {number} イージングした結果
         */

    }, {
        key: "easeOutCubic",
        value: function easeOutCubic(t) {
            return (t = t / 1 - 1) * t * t + 1;
        }

        /**
         * イージング
         * @param {number} t - 0.0 から 1.0 の値
         * @return {number} イージングした結果
         */

    }, {
        key: "easeQuintic",
        value: function easeQuintic(t) {
            var ts = (t = t / 1) * t;
            var tc = ts * t;
            return tc * ts;
        }

        /**
         * 度数法の角度から弧度法の値へ変換する
         * @param {number} deg - 度数法の角度
         * @return {number} 弧度法の値
         */

    }, {
        key: "degToRad",
        value: function degToRad(deg) {
            return deg % 360 * Math.PI / 180;
        }

        /**
         * 赤道半径（km）
         * @type {number}
         */

    }, {
        key: "lonToMer",


        /**
         * 経度を元にメルカトル座標を返す
         * @param {number} lon - 経度
         * @return {number} メルカトル座標系における X
         */
        value: function lonToMer(lon) {
            return gl3Util.EARTH_RADIUS * gl3Util.degToRad(lon);
        }

        /**
         * 緯度を元にメルカトル座標を返す
         * @param {number} lat - 緯度
         * @param {number} [flatten=0] - 扁平率
         * @return {number} メルカトル座標系における Y
         */

    }, {
        key: "latToMer",
        value: function latToMer(lat) {
            var flatten = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            var flattening = flatten;
            if (isNaN(parseFloat(flatten))) {
                flattening = 0;
            }
            var clamp = 0.0001;
            if (lat >= 90 - clamp) {
                lat = 90 - clamp;
            }
            if (lat <= -90 + clamp) {
                lat = -90 + clamp;
            }
            var temp = 1 - flattening;
            var es = 1.0 - temp * temp;
            var eccent = Math.sqrt(es);
            var phi = gl3Util.degToRad(lat);
            var sinphi = Math.sin(phi);
            var con = eccent * sinphi;
            var com = 0.5 * eccent;
            con = Math.pow((1.0 - con) / (1.0 + con), com);
            var ts = Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con;
            return gl3Util.EARTH_RADIUS * Math.log(ts);
        }

        /**
         * 緯度経度をメルカトル座標系に変換して返す
         * @param {number} lon - 経度
         * @param {number} lat - 緯度
         * @param {number} [flatten=0] - 扁平率
         * @return {obj}
         * @property {number} x - メルカトル座標系における X 座標
         * @property {number} y - メルカトル座標系における Y 座標
         */

    }, {
        key: "lonLatToMer",
        value: function lonLatToMer(lon, lat) {
            var flatten = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            return {
                x: gl3Util.lonToMer(lon),
                y: gl3Util.latToMer(lat, flattening)
            };
        }

        /**
         * メルカトル座標を緯度経度に変換して返す
         * @param {number} x - メルカトル座標系における X 座標
         * @param {number} y - メルカトル座標系における Y 座標
         * @return {obj}
         * @property {number} lon - 経度
         * @property {number} lat - 緯度
         */

    }, {
        key: "merToLonLat",
        value: function merToLonLat(x, y) {
            var lon = x / gl3Util.EARTH_HALF_CIRCUM * 180;
            var lat = y / gl3Util.EARTH_HALF_CIRCUM * 180;
            lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
            return {
                lon: lon,
                lat: lat
            };
        }

        /**
         * 経度からタイルインデックスを求めて返す
         * @param {number} lon - 経度
         * @param {number} zoom - ズームレベル
         * @return {number} 経度方向のタイルインデックス
         */

    }, {
        key: "lonToTile",
        value: function lonToTile(lon, zoom) {
            return Math.floor((lon / 180 + 1) * Math.pow(2, zoom) / 2);
        }

        /**
         * 緯度からタイルインデックスを求めて返す
         * @param {number} lat - 緯度
         * @param {number} zoom - ズームレベル
         * @return {number} 緯度方向のタイルインデックス
         */

    }, {
        key: "latToTile",
        value: function latToTile(lat, zoom) {
            return Math.floor((-Math.log(Math.tan((45 + lat / 2) * Math.PI / 180)) + Math.PI) * Math.pow(2, zoom) / (2 * Math.PI));
        }

        /**
         * 緯度経度をタイルインデックスに変換して返す
         * @param {number} lon - 経度
         * @param {number} lat - 緯度
         * @param {number} zoom - ズームレベル
         * @return {obj}
         * @property {number} lon - 経度方向のタイルインデックス
         * @property {number} lat - 緯度方向のタイルインデックス
         */

    }, {
        key: "lonLatToTile",
        value: function lonLatToTile(lon, lat, zoom) {
            return {
                lon: gl3Util.lonToTile(lon, zoom),
                lat: gl3Util.latToTile(lat, zoom)
            };
        }

        /**
         * タイルインデックスから経度を求めて返す
         * @param {number} lon - 経度方向のタイルインデックス
         * @param {number} zoom - ズームレベル
         * @return {number} 経度
         */

    }, {
        key: "tileToLon",
        value: function tileToLon(lon, zoom) {
            return lon / Math.pow(2, zoom) * 360 - 180;
        }

        /**
         * タイルインデックスから緯度を求めて返す
         * @param {number} lat - 緯度方向のタイルインデックス
         * @param {number} zoom - ズームレベル
         * @return {number} 緯度
         */

    }, {
        key: "tileToLat",
        value: function tileToLat(lat, zoom) {
            var y = lat / Math.pow(2, zoom) * 2 * Math.PI - Math.PI;
            return 2 * Math.atan(Math.pow(Math.E, -y)) * 180 / Math.PI - 90;
        }

        /**
         * タイルインデックスから緯度経度を求めて返す
         * @param {number} lon - 経度
         * @param {number} lat - 緯度
         * @param {number} zoom - ズームレベル
         * @return {obj}
         * @property {number} lon - 経度方向のタイルインデックス
         * @property {number} lat - 緯度方向のタイルインデックス
         */

    }, {
        key: "tileToLonLat",
        value: function tileToLonLat(lon, lat, zoom) {
            return {
                lon: gl3Util.tileToLon(lon, zoom),
                lat: gl3Util.tileToLat(lat, zoom)
            };
        }
    }, {
        key: "EARTH_RADIUS",
        get: function get() {
            return 6378.137;
        }

        /**
         * 赤道円周（km）
         * @type {number}
         */

    }, {
        key: "EARTH_CIRCUM",
        get: function get() {
            return gl3Util.EARTH_RADIUS * Math.PI * 2.0;
        }

        /**
         * 赤道円周の半分（km）
         * @type {number}
         */

    }, {
        key: "EARTH_HALF_CIRCUM",
        get: function get() {
            return gl3Util.EARTH_RADIUS * Math.PI;
        }

        /**
         * メルカトル座標系における最大緯度
         * @type {number}
         */

    }, {
        key: "EARTH_MAX_LAT",
        get: function get() {
            return 85.05112878;
        }
    }]);

    return gl3Util;
}();

exports.default = gl3Util;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @example
 * let wrapper = new gl3.Gui.Wrapper();
 * document.body.appendChild(wrapper.getElement());
 *
 * let slider = new gl3.Gui.Slider('test', 50, 0, 100, 1);
 * slider.add('input', (eve, self) => {console.log(self.getValue());});
 * wrapper.append(slider.getElement());
 *
 * let check = new gl3.Gui.Checkbox('hoge', false);
 * check.add('change', (eve, self) => {console.log(self.getValue());});
 * wrapper.append(check.getElement());
 *
 * let radio = new gl3.Gui.Radio('hoge', null, false);
 * radio.add('change', (eve, self) => {console.log(self.getValue());});
 * wrapper.append(radio.getElement());
 *
 * let select = new gl3.Gui.Select('fuga', ['foo', 'baa'], 0);
 * select.add('change', (eve, self) => {console.log(self.getValue());});
 * wrapper.append(select.getElement());
 *
 * let spin = new gl3.Gui.Spin('hoge', 0.0, -1.0, 1.0, 0.1);
 * spin.add('input', (eve, self) => {console.log(self.getValue());});
 * wrapper.append(spin.getElement());
 *
 * let color = new gl3.Gui.Color('fuga', '#ff0000');
 * color.add('change', (eve, self) => {console.log(self.getValue(), self.getFloatValue());});
 * wrapper.append(color.getElement());
 */

/**
 * gl3Gui
 * @class gl3Gui
 */
var gl3Gui =
/**
 * @constructor
 */
function gl3Gui() {
  _classCallCheck(this, gl3Gui);

  /**
   * GUIWrapper
   * @type {GUIWrapper}
   */
  this.Wrapper = GUIWrapper;
  /**
   * GUIElement
   * @type {GUIElement}
   */
  this.Element = GUIElement;
  /**
   * GUISlider
   * @type {GUISlider}
   */
  this.Slider = GUISlider;
  /**
   * GUICheckbox
   * @type {GUICheckbox}
   */
  this.Checkbox = GUICheckbox;
  /**
   * GUIRadio
   * @type {GUIRadio}
   */
  this.Radio = GUIRadio;
  /**
   * GUISelect
   * @type {GUISelect}
   */
  this.Select = GUISelect;
  /**
   * GUISpin
   * @type {GUISpin}
   */
  this.Spin = GUISpin;
  /**
   * GUIColor
   * @type {GUIColor}
   */
  this.Color = GUIColor;
};

/**
 * GUIWrapper
 * @class GUIWrapper
 */


exports.default = gl3Gui;

var GUIWrapper = function () {
  /**
   * @constructor
   */
  function GUIWrapper() {
    var _this = this;

    _classCallCheck(this, GUIWrapper);

    /**
     * GUI 全体を包むラッパー DOM
     * @type {HTMLDivElement}
     */
    this.element = document.createElement('div');
    this.element.style.position = 'absolute';
    this.element.style.top = '0px';
    this.element.style.right = '0px';
    this.element.style.width = '340px';
    this.element.style.height = '100%';
    this.element.style.transition = 'right 0.8s cubic-bezier(0, 0, 0, 1.0)';
    /**
     * GUI パーツを包むラッパー DOM
     * @type {HTMLDivElement}
     */
    this.wrapper = document.createElement('div');
    this.wrapper.style.backgroundColor = 'rgba(64, 64, 64, 0.5)';
    this.wrapper.style.height = '100%';
    this.wrapper.style.overflow = 'auto';
    /**
     * GUI 折りたたみトグル
     * @type {HTMLDivElement}
     */
    this.toggle = document.createElement('div');
    this.toggle.className = 'visible';
    this.toggle.textContent = '▶';
    this.toggle.style.fontSize = '18px';
    this.toggle.style.lineHeight = '32px';
    this.toggle.style.color = 'rgba(240, 240, 240, 0.5)';
    this.toggle.style.backgroundColor = 'rgba(32, 32, 32, 0.5)';
    this.toggle.style.border = '1px solid rgba(240, 240, 240, 0.2)';
    this.toggle.style.borderRadius = '25px';
    this.toggle.style.boxShadow = '0px 0px 2px 2px rgba(8, 8, 8, 0.8)';
    this.toggle.style.position = 'absolute';
    this.toggle.style.top = '20px';
    this.toggle.style.right = '360px';
    this.toggle.style.width = '32px';
    this.toggle.style.height = '32px';
    this.toggle.style.cursor = 'pointer';
    this.toggle.style.transform = 'rotate(0deg)';
    this.toggle.style.transition = 'transform 0.5s cubic-bezier(0, 0, 0, 1.0)';

    this.element.appendChild(this.toggle);
    this.element.appendChild(this.wrapper);

    this.toggle.addEventListener('click', function () {
      _this.toggle.classList.toggle('visible');
      if (_this.toggle.classList.contains('visible')) {
        _this.element.style.right = '0px';
        _this.toggle.style.transform = 'rotate(0deg)';
      } else {
        _this.element.style.right = '-340px';
        _this.toggle.style.transform = 'rotate(-180deg)';
      }
    });
  }
  /**
   * エレメントを返す
   * @return {HTMLDivElement}
   */


  _createClass(GUIWrapper, [{
    key: 'getElement',
    value: function getElement() {
      return this.element;
    }
    /**
     * 子要素をアペンドする
     * @param {HTMLElement} element - アペンドする要素
     */

  }, {
    key: 'append',
    value: function append(element) {
      this.wrapper.appendChild(element);
    }
  }]);

  return GUIWrapper;
}();

/**
 * GUIElement
 * @class GUIElement
 */


var GUIElement = function () {
  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   */
  function GUIElement() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    _classCallCheck(this, GUIElement);

    /**
     * エレメントラッパー DOM
     * @type {HTMLDivElement}
     */
    this.element = document.createElement('div');
    this.element.style.fontSize = 'small';
    this.element.style.textAlign = 'center';
    this.element.style.width = '320px';
    this.element.style.height = '30px';
    this.element.style.lineHeight = '30px';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'row';
    this.element.style.justifyContent = 'flex-start';
    /**
     * ラベル用エレメント DOM
     * @type {HTMLSpanElement}
     */
    this.label = document.createElement('span');
    this.label.textContent = text;
    this.label.style.color = '#222';
    this.label.style.textShadow = '0px 0px 5px white';
    this.label.style.display = 'inline-block';
    this.label.style.margin = 'auto 5px';
    this.label.style.width = '100px';
    this.label.style.overflow = 'hidden';
    this.element.appendChild(this.label);
    /**
     * 値表示用 DOM
     * @type {HTMLSpanElement}
     */
    this.value = document.createElement('span');
    this.value.style.backgroundColor = 'rgba(0, 0, 0, 0.25)';
    this.value.style.color = 'whitesmoke';
    this.value.style.fontSize = 'x-small';
    this.value.style.textShadow = '0px 0px 5px black';
    this.value.style.display = 'inline-block';
    this.value.style.margin = 'auto 5px';
    this.value.style.width = '50px';
    this.value.style.overflow = 'hidden';
    this.element.appendChild(this.value);
    /**
     * コントロール DOM
     * @type {HTMLElement}
     */
    this.control = null;
    /**
     * ラベルに設定するテキスト
     * @type {string}
     */
    this.text = text;
    /**
     * イベントリスナ
     * @type {object}
     */
    this.listeners = {};
  }
  /**
   * イベントリスナを登録する
   * @param {string} type - イベントタイプ
   * @param {function} func - 登録する関数
   */


  _createClass(GUIElement, [{
    key: 'add',
    value: function add(type, func) {
      if (this.control == null || type == null || func == null) {
        return;
      }
      if (Object.prototype.toString.call(type) !== '[object String]') {
        return;
      }
      if (Object.prototype.toString.call(func) !== '[object Function]') {
        return;
      }
      this.listeners[type] = func;
    }
    /**
     * イベントを発火する
     * @param {string} type - 発火するイベントタイプ
     * @param {Event} eve - Event オブジェクト
     */

  }, {
    key: 'emit',
    value: function emit(type, eve) {
      if (this.control == null || !this.listeners.hasOwnProperty(type)) {
        return;
      }
      this.listeners[type](eve, this);
    }
    /**
     * イベントリスナを登録解除する
     */

  }, {
    key: 'remove',
    value: function remove() {
      if (this.control == null || !this.listeners.hasOwnProperty(type)) {
        return;
      }
      this.listeners[type] = null;
      delete this.listeners[type];
    }
    /**
     * ラベルテキストとコントロールの値を更新する
     * @param {mixed} value - 設定する値
     */

  }, {
    key: 'setValue',
    value: function setValue(value) {
      this.value.textContent = value;
      this.control.value = value;
    }
    /**
     * コントロールに設定されている値を返す
     * @return {mixed} コントロールに設定されている値
     */

  }, {
    key: 'getValue',
    value: function getValue() {
      return this.control.value;
    }
    /**
     * コントロールエレメントを返す
     * @return {HTMLElement}
     */

  }, {
    key: 'getControl',
    value: function getControl() {
      return this.control;
    }
    /**
     * ラベルに設定されているテキストを返す
     * @return {string} ラベルに設定されている値
     */

  }, {
    key: 'getText',
    value: function getText() {
      return this.text;
    }
    /**
     * エレメントを返す
     * @return {HTMLDivElement}
     */

  }, {
    key: 'getElement',
    value: function getElement() {
      return this.element;
    }
  }]);

  return GUIElement;
}();

/**
 * GUISlider
 * @class GUISlider
 */


var GUISlider = function (_GUIElement) {
  _inherits(GUISlider, _GUIElement);

  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   * @param {number} [value=0] - コントロールに設定する値
   * @param {number} [min=0] - スライダーの最小値
   * @param {number} [max=100] - スライダーの最大値
   * @param {number} [step=1] - スライダーのステップ数
   */
  function GUISlider() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var min = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var max = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;
    var step = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

    _classCallCheck(this, GUISlider);

    /**
     * コントロールエレメント
     * @type {HTMLInputElement}
     */
    var _this2 = _possibleConstructorReturn(this, (GUISlider.__proto__ || Object.getPrototypeOf(GUISlider)).call(this, text));

    _this2.control = document.createElement('input');
    _this2.control.setAttribute('type', 'range');
    _this2.control.setAttribute('min', min);
    _this2.control.setAttribute('max', max);
    _this2.control.setAttribute('step', step);
    _this2.control.value = value;
    _this2.control.style.margin = 'auto';
    _this2.control.style.verticalAlign = 'middle';
    _this2.element.appendChild(_this2.control);

    // set
    _this2.setValue(_this2.control.value);

    // event
    _this2.control.addEventListener('input', function (eve) {
      _this2.emit('input', eve);
      _this2.setValue(_this2.control.value);
    }, false);
    return _this2;
  }
  /**
   * スライダーの最小値をセットする
   * @param {number} min - 最小値に設定する値
   */


  _createClass(GUISlider, [{
    key: 'setMin',
    value: function setMin(min) {
      this.control.setAttribute('min', min);
    }
    /**
     * スライダーの最大値をセットする
     * @param {number} max - 最大値に設定する値
     */

  }, {
    key: 'setMax',
    value: function setMax(max) {
      this.control.setAttribute('max', max);
    }
    /**
     * スライダーのステップ数をセットする
     * @param {number} step - ステップ数に設定する値
     */

  }, {
    key: 'setStep',
    value: function setStep(step) {
      this.control.setAttribute('step', step);
    }
  }]);

  return GUISlider;
}(GUIElement);

/**
 * GUICheckbox
 * @class GUICheckbox
 */


var GUICheckbox = function (_GUIElement2) {
  _inherits(GUICheckbox, _GUIElement2);

  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   * @param {boolean} [checked=false] - コントロールに設定する値
   */
  function GUICheckbox() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var checked = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    _classCallCheck(this, GUICheckbox);

    /**
     * コントロールエレメント
     * @type {HTMLInputElement}
     */
    var _this3 = _possibleConstructorReturn(this, (GUICheckbox.__proto__ || Object.getPrototypeOf(GUICheckbox)).call(this, text));

    _this3.control = document.createElement('input');
    _this3.control.setAttribute('type', 'checkbox');
    _this3.control.checked = checked;
    _this3.control.style.margin = 'auto';
    _this3.control.style.verticalAlign = 'middle';
    _this3.element.appendChild(_this3.control);

    // set
    _this3.setValue(_this3.control.checked);

    // event
    _this3.control.addEventListener('change', function (eve) {
      _this3.emit('change', eve);
      _this3.setValue(_this3.control.checked);
    }, false);
    return _this3;
  }
  /**
   * コントロールに値を設定する
   * @param {boolean} checked - コントロールに設定する値
   */


  _createClass(GUICheckbox, [{
    key: 'setValue',
    value: function setValue(checked) {
      this.value.textContent = checked;
      this.control.checked = checked;
    }
    /**
     * コントロールの値を返す
     * @return {boolean} コントロールの値
     */

  }, {
    key: 'getValue',
    value: function getValue() {
      return this.control.checked;
    }
  }]);

  return GUICheckbox;
}(GUIElement);

/**
 * GUIRadio
 * @class GUIRadio
 */


var GUIRadio = function (_GUIElement3) {
  _inherits(GUIRadio, _GUIElement3);

  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   * @param {string} [name='gl3radio'] - エレメントに設定する名前
   * @param {boolean} [checked=false] - コントロールに設定する値
   */
  function GUIRadio() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'gl3radio';
    var checked = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _classCallCheck(this, GUIRadio);

    /**
     * コントロールエレメント
     * @type {HTMLInputElement}
     */
    var _this4 = _possibleConstructorReturn(this, (GUIRadio.__proto__ || Object.getPrototypeOf(GUIRadio)).call(this, text));

    _this4.control = document.createElement('input');
    _this4.control.setAttribute('type', 'radio');
    _this4.control.setAttribute('name', name);
    _this4.control.checked = checked;
    _this4.control.style.margin = 'auto';
    _this4.control.style.verticalAlign = 'middle';
    _this4.element.appendChild(_this4.control);

    // set
    _this4.setValue(_this4.control.checked);

    // event
    _this4.control.addEventListener('change', function (eve) {
      _this4.emit('change', eve);
      _this4.setValue(_this4.control.checked);
    }, false);
    return _this4;
  }
  /**
   * コントロールに値を設定する
   * @param {boolean} checked - コントロールに設定する値
   */


  _createClass(GUIRadio, [{
    key: 'setValue',
    value: function setValue(checked) {
      this.value.textContent = '---';
      this.control.checked = checked;
    }
    /**
     * コントロールの値を返す
     * @return {boolean} コントロールの値
     */

  }, {
    key: 'getValue',
    value: function getValue() {
      return this.control.checked;
    }
  }]);

  return GUIRadio;
}(GUIElement);

/**
 * GUISelect
 * @class GUISelect
 */


var GUISelect = function (_GUIElement4) {
  _inherits(GUISelect, _GUIElement4);

  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   * @param {Array.<string>} [list=[]] - リストに登録するアイテムを指定する文字列の配列
   * @param {number} [selectedIndex=0] - コントロールで選択するインデックス
   */
  function GUISelect() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var selectedIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    _classCallCheck(this, GUISelect);

    /**
     * コントロールエレメント
     * @type {HTMLSelectElement}
     */
    var _this5 = _possibleConstructorReturn(this, (GUISelect.__proto__ || Object.getPrototypeOf(GUISelect)).call(this, text));

    _this5.control = document.createElement('select');
    list.map(function (v) {
      var opt = new Option(v, v);
      _this5.control.add(opt);
    });
    _this5.control.selectedIndex = selectedIndex;
    _this5.control.style.width = '130px';
    _this5.control.style.margin = 'auto';
    _this5.control.style.verticalAlign = 'middle';
    _this5.element.appendChild(_this5.control);

    // set
    _this5.setValue(_this5.control.value);

    // event
    _this5.control.addEventListener('change', function (eve) {
      _this5.emit('change', eve);
      _this5.setValue(_this5.control.value);
    }, false);
    return _this5;
  }
  /**
   * コントロールで選択するインデックスを指定する
   * @param {number} index - 指定するインデックス
   */


  _createClass(GUISelect, [{
    key: 'setSelectedIndex',
    value: function setSelectedIndex(index) {
      this.control.selectedIndex = index;
    }
    /**
     * コントロールが現在選択しているインデックスを返す
     * @return {number} 現在選択しているインデックス
     */

  }, {
    key: 'getSelectedIndex',
    value: function getSelectedIndex() {
      return this.control.selectedIndex;
    }
  }]);

  return GUISelect;
}(GUIElement);

/**
 * GUISpin
 * @class GUISpin
 */


var GUISpin = function (_GUIElement5) {
  _inherits(GUISpin, _GUIElement5);

  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   * @param {number} [value=0.0] - コントロールに設定する値
   * @param {number} [min=-1.0] - スピンする際の最小値
   * @param {number} [max=1.0] - スピンする際の最大値
   * @param {number} [step=0.1] - スピンするステップ数
   */
  function GUISpin() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.0;
    var min = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1.0;
    var max = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1.0;
    var step = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.1;

    _classCallCheck(this, GUISpin);

    /**
     * コントロールエレメント
     * @type {HTMLInputElement}
     */
    var _this6 = _possibleConstructorReturn(this, (GUISpin.__proto__ || Object.getPrototypeOf(GUISpin)).call(this, text));

    _this6.control = document.createElement('input');
    _this6.control.setAttribute('type', 'number');
    _this6.control.setAttribute('min', min);
    _this6.control.setAttribute('max', max);
    _this6.control.setAttribute('step', step);
    _this6.control.value = value;
    _this6.control.style.margin = 'auto';
    _this6.control.style.verticalAlign = 'middle';
    _this6.element.appendChild(_this6.control);

    // set
    _this6.setValue(_this6.control.value);

    // event
    _this6.control.addEventListener('input', function (eve) {
      _this6.emit('input', eve);
      _this6.setValue(_this6.control.value);
    }, false);
    return _this6;
  }
  /**
   * スピンの最小値を設定する
   * @param {number} min - 設定する最小値
   */


  _createClass(GUISpin, [{
    key: 'setMin',
    value: function setMin(min) {
      this.control.setAttribute('min', min);
    }
    /**
     * スピンの最大値を設定する
     * @param {number} max - 設定する最大値
     */

  }, {
    key: 'setMax',
    value: function setMax(max) {
      this.control.setAttribute('max', max);
    }
    /**
     * スピンのステップ数を設定する
     * @param {number} step - 設定するステップ数
     */

  }, {
    key: 'setStep',
    value: function setStep(step) {
      this.control.setAttribute('step', step);
    }
  }]);

  return GUISpin;
}(GUIElement);

/**
 * GUIColor
 * @class GUIColor
 */


var GUIColor = function (_GUIElement6) {
  _inherits(GUIColor, _GUIElement6);

  /**
   * @constructor
   * @param {string} [text=''] - エレメントに設定するテキスト
   * @param {string} [value='#000000'] - コントロールに設定する値
   */
  function GUIColor() {
    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '#000000';

    _classCallCheck(this, GUIColor);

    /**
     * コントロールを包むコンテナエレメント
     * @type {HTMLDivElement}
     */
    var _this7 = _possibleConstructorReturn(this, (GUIColor.__proto__ || Object.getPrototypeOf(GUIColor)).call(this, text));

    _this7.container = document.createElement('div');
    _this7.container.style.lineHeight = '0';
    _this7.container.style.margin = '2px auto';
    _this7.container.style.width = '100px';
    /**
     * 余白兼選択カラー表示エレメント
     * @type {HTMLDivElement}
     */
    _this7.label = document.createElement('div');
    _this7.label.style.margin = '0px';
    _this7.label.style.width = 'calc(100% - 2px)';
    _this7.label.style.height = '24px';
    _this7.label.style.border = '1px solid whitesmoke';
    _this7.label.style.boxShadow = '0px 0px 0px 1px #222';
    /**
     * コントロールエレメントの役割を担う canvas
     * @type {HTMLCanvasElement}
     */
    _this7.control = document.createElement('canvas');
    _this7.control.style.margin = '0px';
    _this7.control.style.display = 'none';
    _this7.control.width = 100;
    _this7.control.height = 100;

    // append
    _this7.element.appendChild(_this7.container);
    _this7.container.appendChild(_this7.label);
    _this7.container.appendChild(_this7.control);

    /**
     * コントロール用 canvas の 2d コンテキスト
     * @type {CanvasRenderingContext2D}
     */
    _this7.ctx = _this7.control.getContext('2d');
    var grad = _this7.ctx.createLinearGradient(0, 0, _this7.control.width, 0);
    var arr = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'];
    for (var i = 0, j = arr.length; i < j; ++i) {
      grad.addColorStop(i / (j - 1), arr[i]);
    }
    _this7.ctx.fillStyle = grad;
    _this7.ctx.fillRect(0, 0, _this7.control.width, _this7.control.height);
    grad = _this7.ctx.createLinearGradient(0, 0, 0, _this7.control.height);
    arr = ['rgba(255, 255, 255, 1.0)', 'rgba(255, 255, 255, 0.0)', 'rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 1.0)'];
    for (var _i = 0, _j = arr.length; _i < _j; ++_i) {
      grad.addColorStop(_i / (_j - 1), arr[_i]);
    }
    _this7.ctx.fillStyle = grad;
    _this7.ctx.fillRect(0, 0, _this7.control.width, _this7.control.height);

    /**
     * 自身に設定されている色を表す文字列の値
     * @type {string}
     */
    _this7.colorValue = value;
    /**
     * クリック時にのみ colorValue を更新するための一時キャッシュ変数
     * @type {string}
     */
    _this7.tempColorValue = null;

    // set
    _this7.setValue(value);

    // event
    _this7.container.addEventListener('mouseover', function () {
      _this7.control.style.display = 'block';
      _this7.tempColorValue = _this7.colorValue;
    });
    _this7.container.addEventListener('mouseout', function () {
      _this7.control.style.display = 'none';
      if (_this7.tempColorValue != null) {
        _this7.setValue(_this7.tempColorValue);
        _this7.tempColorValue = null;
      }
    });
    _this7.control.addEventListener('mousemove', function (eve) {
      var imageData = _this7.ctx.getImageData(eve.offsetX, eve.offsetY, 1, 1);
      var color = _this7.getColor8bitString(imageData.data);
      _this7.setValue(color);
    });

    _this7.control.addEventListener('click', function (eve) {
      var imageData = _this7.ctx.getImageData(eve.offsetX, eve.offsetY, 1, 1);
      eve.currentTarget.value = _this7.getColor8bitString(imageData.data);
      _this7.tempColorValue = null;
      _this7.control.style.display = 'none';
      _this7.emit('change', eve);
    }, false);
    return _this7;
  }
  /**
   * 自身のプロパティに色を設定する
   * @param {string} value - CSS 色表現のうち 16 進数表記のもの
   */


  _createClass(GUIColor, [{
    key: 'setValue',
    value: function setValue(value) {
      this.value.textContent = value;
      this.colorValue = value;
      this.container.style.backgroundColor = this.colorValue;
    }
    /**
     * 自身に設定されている色を表す文字列を返す
     * @return {string} 16 進数表記の色を表す文字列
     */

  }, {
    key: 'getValue',
    value: function getValue() {
      return this.colorValue;
    }
    /**
     * 自身に設定されている色を表す文字列を 0.0 から 1.0 の値に変換し配列で返す
     * @return {Array.<number>} 浮動小数で表現した色の値の配列
     */

  }, {
    key: 'getFloatValue',
    value: function getFloatValue() {
      return this.getColorFloatArray(this.colorValue);
    }
    /**
     * canvas.imageData から取得する数値の配列を元に 16 進数表記文字列を生成して返す
     * @param {Array.<number>} color - 最低でも 3 つの要素を持つ数値の配列
     * @return {string} 16 進数表記の色の値の文字列
     */

  }, {
    key: 'getColor8bitString',
    value: function getColor8bitString(color) {
      var r = this.zeroPadding(color[0].toString(16), 2);
      var g = this.zeroPadding(color[1].toString(16), 2);
      var b = this.zeroPadding(color[2].toString(16), 2);
      return '#' + r + g + b;
    }
    /**
     * 16 進数表記の色表現文字列を元に 0.0 から 1.0 の値に変換した配列を生成し返す
     * @param {string} color - 16 進数表記の色の値の文字列
     * @return {Array.<number>} RGB の 3 つの値を 0.0 から 1.0 に変換した値の配列
     */

  }, {
    key: 'getColorFloatArray',
    value: function getColorFloatArray(color) {
      if (color == null || Object.prototype.toString.call(color) !== '[object String]') {
        return null;
      }
      if (color.search(/^#+[\d|a-f|A-F]+$/) === -1) {
        return null;
      }
      var s = color.replace('#', '');
      if (s.length !== 3 && s.length !== 6) {
        return null;
      }
      var t = s.length / 3;
      return [parseInt(color.substr(1, t), 16) / 255, parseInt(color.substr(1 + t, t), 16) / 255, parseInt(color.substr(1 + t * 2, t), 16) / 255];
    }
    /**
     * 数値を指定された桁数に整形した文字列を返す
     * @param {number} number - 整形したい数値
     * @param {number} count - 整形する桁数
     * @return {string} 16 進数表記の色の値の文字列
     */

  }, {
    key: 'zeroPadding',
    value: function zeroPadding(number, count) {
      var a = new Array(count).join('0');
      return (a + number).slice(-count);
    }
  }]);

  return GUIColor;
}(GUIElement);

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.tiledPlanePoint = tiledPlanePoint;
// geometory

/* tiledPlanePoint
 * @param {number} res - resolution
 * @return {object}
 *  {vec3} position,
 *  {vec4} color,
 *  {vec2} texCoord,
 *  {vec4} type,
 *  {vec4} random
 */
function tiledPlanePoint(res) {
    var i, j, k, l, m, n;
    var x, y, z, r, g, b, a;
    var pos = []; // position.xyz
    var col = []; // horizon line alpha, cross line alpha
    var tex = []; // texCoord.st
    var typ = []; // xindex, yindex, totalindex
    var rnd = []; // random float
    var idxHorizonLine = [];
    var idxCrossLine = [];
    n = 0;
    for (i = 0; i <= res; ++i) {
        k = i / res * 2.0 - 1.0;
        m = 1.0 - i / res;
        for (j = 0; j <= res; ++j) {
            l = j / res * 2.0 - 1.0;
            pos.push(l, k, 0.0);
            tex.push(j / res, m);
            typ.push(i, j, n, 0.0);
            rnd.push(Math.random(), Math.random(), Math.random(), Math.random());
            // horizon line index(gl.LINES)
            r = 0.0;
            if (j !== 0 && j < res) {
                r = 1.0;
                idxHorizonLine.push(n, n + 1);
            } else if (j === 0) {
                r = 0.0;
                idxHorizonLine.push(n, n + 1);
            } else {
                r = 0.0;
                idxHorizonLine.push(n, n - res);
            }
            // cross line index(gl.LINES)
            g = 1.0;
            if (j === 0 && i < res) {
                // idxCrossLine.push(n, n + res + 1, n, n + res + 2, n, n + 1);
                idxCrossLine.push(n, n + res + 1, n, n + 1);
            } else if (j === res && i < res) {
                idxCrossLine.push(n, n + res + 1);
                // idxCrossLine.push(n, n + res, n, n + res + 1);
            } else if (j < res && i === res) {
                idxCrossLine.push(n, n + 1);
            } else if (j < res && i < res) {
                // idxCrossLine.push(n, n + res, n, n + res + 1, n, n + res + 2, n, n + 1);
                idxCrossLine.push(n, n + res + 1, n, n + 1);
            }
            b = 0.0;
            a = 0.0;
            col.push(r, g, b, a);
            n++;
        }
    }
    return {
        position: pos,
        color: col,
        texCoord: tex,
        type: typ,
        random: rnd,
        indexHorizon: idxHorizonLine,
        indexCross: idxCrossLine
    };
}

/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYTUzZmVhZmIyNTU2OWM5Yzk0YjAiLCJ3ZWJwYWNrOi8vLy4vc2NyaXB0LmpzIiwid2VicGFjazovLy8uL2dsM0NvcmUuanMiLCJ3ZWJwYWNrOi8vLy4vZ2wzQXVkaW8uanMiLCJ3ZWJwYWNrOi8vLy4vZ2wzTWF0aC5qcyIsIndlYnBhY2s6Ly8vLi9nbDNNZXNoLmpzIiwid2VicGFjazovLy8uL2dsM1V0aWwuanMiLCJ3ZWJwYWNrOi8vLy4vZ2wzR3VpLmpzIiwid2VicGFjazovLy8uL2dlb21ldG9yeS5qcyJdLCJuYW1lcyI6WyJnbDMiLCJnbGN1YmljIiwiY2FudmFzIiwiZ2wiLCJleHQiLCJydW4iLCJtYXQ0IiwicXRuIiwic2NlbmVQcmciLCJmaW5hbFByZyIsIm5vaXNlUHJnIiwiZ2F1c3NQcmciLCJwb3NpdGlvblByZyIsInZlbG9jaXR5UHJnIiwiZ1dlaWdodCIsIm5vd1RpbWUiLCJjYW52YXNXaWR0aCIsImNhbnZhc0hlaWdodCIsImJ1ZmZlclNpemUiLCJncGdwdUJ1ZmZlclNpemUiLCJNYXRoIiwiTWF0NCIsIlF0biIsIkRFRkFVTFRfQ0FNX1BPU0lUSU9OIiwiREVGQVVMVF9DQU1fQ0VOVEVSIiwiREVGQVVMVF9DQU1fVVAiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwiaW5pdCIsInJlYWR5IiwiY29uc29sZSIsImxvZyIsIndpZHRoIiwiaW5uZXJXaWR0aCIsImhlaWdodCIsImlubmVySGVpZ2h0IiwiZWxlbWVudEluZGV4VWludCIsImdldEV4dGVuc2lvbiIsInRleHR1cmVGbG9hdCIsImRyYXdCdWZmZXJzIiwiZXZlIiwia2V5Q29kZSIsInNoYWRlckxvYWRlciIsImNyZWF0ZVByb2dyYW1Gcm9tRmlsZSIsInNoYWRlckxvYWRDaGVjayIsInByZyIsInJlc2V0QnVmZmVyRnVuY3Rpb24iLCJnZW5lcmF0ZVNjcmVlbkJ1ZmZlciIsImdhdXNzV2VpZ2h0IiwidGlsZWRQbGFuZVBvaW50RGF0YSIsInRpbGVkUGxhbmVQb2ludFZCTyIsImNyZWF0ZVZibyIsInBvc2l0aW9uIiwiY29sb3IiLCJ0ZXhDb29yZCIsInR5cGUiLCJyYW5kb20iLCJ0aWxlZFBsYW5lSG9yaXpvbkxpbmVJQk8iLCJjcmVhdGVJYm9JbnQiLCJpbmRleEhvcml6b24iLCJ0aWxlZFBsYW5lQ3Jvc3NMaW5lSUJPIiwiaW5kZXhDcm9zcyIsInRpbGVkUGxhbmVQb2ludExlbmd0aCIsImxlbmd0aCIsInBsYW5lUG9zaXRpb24iLCJwbGFuZVRleENvb3JkIiwicGxhbmVJbmRleCIsInBsYW5lVkJPIiwicGxhbmVUZXhDb29yZFZCTyIsInBsYW5lSUJPIiwibU1hdHJpeCIsImlkZW50aXR5IiwiY3JlYXRlIiwidk1hdHJpeCIsInBNYXRyaXgiLCJ2cE1hdHJpeCIsIm12cE1hdHJpeCIsImludk1hdHJpeCIsImZyYW1lQnVmZmVyIiwiaEdhdXNzQnVmZmVyIiwidkdhdXNzQnVmZmVyIiwiYmluZEZyYW1lYnVmZmVyIiwiRlJBTUVCVUZGRVIiLCJhcnIiLCJpIiwiYWN0aXZlVGV4dHVyZSIsIlRFWFRVUkUwIiwiYmluZFRleHR1cmUiLCJURVhUVVJFXzJEIiwiZGVsZXRlVGV4dHVyZSIsInRleHR1cmUiLCJiaW5kUmVuZGVyYnVmZmVyIiwiUkVOREVSQlVGRkVSIiwiZGVsZXRlUmVuZGVyYnVmZmVyIiwiZGVwdGhSZW5kZXJidWZmZXIiLCJkZWxldGVGcmFtZWJ1ZmZlciIsImZyYW1lYnVmZmVyIiwiY3JlYXRlRnJhbWVidWZmZXIiLCJ0ZXh0dXJlcyIsIm5vaXNlQnVmZmVyIiwicG9zaXRpb25CdWZmZXIiLCJjcmVhdGVGcmFtZWJ1ZmZlckZsb2F0IiwidmVsb2NpdHlCdWZmZXIiLCJ1c2VQcm9ncmFtIiwic2V0QXR0cmlidXRlIiwic2NlbmVDbGVhciIsInNjZW5lVmlldyIsInB1c2hTaGFkZXIiLCJkcmF3RWxlbWVudHNJbnQiLCJUUklBTkdMRVMiLCJkaXNhYmxlIiwiREVQVEhfVEVTVCIsImRlcHRoRnVuYyIsIkxFUVVBTCIsIkNVTExfRkFDRSIsImN1bGxGYWNlIiwiQkFDSyIsImVuYWJsZSIsIkJMRU5EIiwiY291bnQiLCJiZWdpblRpbWUiLCJEYXRlIiwibm93IiwidGFyZ2V0QnVmZmVyTnVtIiwicmVuZGVyIiwiY2FtZXJhUG9zaXRpb24iLCJjZW50ZXJQb2ludCIsImNhbWVyYVVwRGlyZWN0aW9uIiwidnBGcm9tQ2FtZXJhUHJvcGVydHkiLCJibGVuZEZ1bmNTZXBhcmF0ZSIsIlNSQ19BTFBIQSIsIk9ORV9NSU5VU19TUkNfQUxQSEEiLCJPTkUiLCJyb3RhdGUiLCJzaW4iLCJtdWx0aXBseSIsImRyYXdBcnJheXMiLCJQT0lOVFMiLCJMSU5FUyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJlc29sdXRpb24iLCJwb3dlciIsInQiLCJ3ZWlnaHQiLCJyIiwidyIsImV4cCIsIlZFUlNJT04iLCJQSTIiLCJQSSIsIlBJSCIsIlBJSDIiLCJURVhUVVJFX1VOSVRfQ09VTlQiLCJpc1dlYkdMMiIsImlzQ29uc29sZU91dHB1dCIsIkF1ZGlvIiwiYXVkaW8iLCJNZXNoIiwibWVzaCIsIlV0aWwiLCJ1dGlsIiwiR3VpIiwiZ3VpIiwibWF0aCIsImluaXRPcHRpb25zIiwiY3ViaWNPcHRpb25zIiwib3B0IiwiSFRNTENhbnZhc0VsZW1lbnQiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJ0b1N0cmluZyIsImNhbGwiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiaGFzT3duUHJvcGVydHkiLCJ3ZWJnbDJNb2RlIiwiZ2V0Q29udGV4dCIsImNvbnNvbGVNZXNzYWdlIiwiZ2V0UGFyYW1ldGVyIiwiTUFYX0NPTUJJTkVEX1RFWFRVUkVfSU1BR0VfVU5JVFMiLCJBcnJheSIsInRleHR1cmVIYWxmRmxvYXQiLCJkZXB0aCIsInN0ZW5jaWwiLCJmbGciLCJDT0xPUl9CVUZGRVJfQklUIiwiY2xlYXJDb2xvciIsImNsZWFyRGVwdGgiLCJERVBUSF9CVUZGRVJfQklUIiwiY2xlYXJTdGVuY2lsIiwiU1RFTkNJTF9CVUZGRVJfQklUIiwiY2xlYXIiLCJ4IiwieSIsIlgiLCJZIiwiaCIsInZpZXdwb3J0IiwicHJpbWl0aXZlIiwidmVydGV4Q291bnQiLCJvZmZzZXQiLCJpbmRleExlbmd0aCIsImRyYXdFbGVtZW50cyIsIlVOU0lHTkVEX1NIT1JUIiwiVU5TSUdORURfSU5UIiwiZGF0YSIsInZibyIsImNyZWF0ZUJ1ZmZlciIsImJpbmRCdWZmZXIiLCJBUlJBWV9CVUZGRVIiLCJidWZmZXJEYXRhIiwiRmxvYXQzMkFycmF5IiwiU1RBVElDX0RSQVciLCJpYm8iLCJFTEVNRU5UX0FSUkFZX0JVRkZFUiIsIkludDE2QXJyYXkiLCJVaW50MzJBcnJheSIsInNvdXJjZSIsIm51bWJlciIsImNhbGxiYWNrIiwiaW1nIiwiSW1hZ2UiLCJvbmxvYWQiLCJsb2FkZWQiLCJ0ZXgiLCJjcmVhdGVUZXh0dXJlIiwidGV4SW1hZ2UyRCIsIlJHQkEiLCJVTlNJR05FRF9CWVRFIiwiZ2VuZXJhdGVNaXBtYXAiLCJ0ZXhQYXJhbWV0ZXJpIiwiVEVYVFVSRV9NSU5fRklMVEVSIiwiTElORUFSIiwiVEVYVFVSRV9NQUdfRklMVEVSIiwiVEVYVFVSRV9XUkFQX1MiLCJDTEFNUF9UT19FREdFIiwiVEVYVFVSRV9XUkFQX1QiLCJzcmMiLCJvYmplY3QiLCJ0YXJnZXQiLCJjSW1nIiwiaW1hZ2UiLCJpbmRleCIsImYiLCJtYXAiLCJ2IiwiVEVYVFVSRV9DVUJFX01BUCIsImoiLCJ1bml0IiwiZyIsImRlcHRoUmVuZGVyQnVmZmVyIiwiY3JlYXRlUmVuZGVyYnVmZmVyIiwicmVuZGVyYnVmZmVyU3RvcmFnZSIsIkRFUFRIX0NPTVBPTkVOVDE2IiwiZnJhbWVidWZmZXJSZW5kZXJidWZmZXIiLCJERVBUSF9BVFRBQ0hNRU5UIiwiZlRleHR1cmUiLCJmcmFtZWJ1ZmZlclRleHR1cmUyRCIsIkNPTE9SX0FUVEFDSE1FTlQwIiwiZGVwdGhTdGVuY2lsUmVuZGVyQnVmZmVyIiwiREVQVEhfU1RFTkNJTCIsIkRFUFRIX1NURU5DSUxfQVRUQUNITUVOVCIsImRlcHRoU3RlbmNpbFJlbmRlcmJ1ZmZlciIsIkZMT0FUIiwiSEFMRl9GTE9BVF9PRVMiLCJORUFSRVNUIiwidnNJZCIsImZzSWQiLCJhdHRMb2NhdGlvbiIsImF0dFN0cmlkZSIsInVuaUxvY2F0aW9uIiwidW5pVHlwZSIsIm1uZyIsIlByb2dyYW1NYW5hZ2VyIiwidnMiLCJjcmVhdGVTaGFkZXJGcm9tSWQiLCJmcyIsImNyZWF0ZVByb2dyYW0iLCJhdHRMIiwiYXR0UyIsImdldEF0dHJpYkxvY2F0aW9uIiwidW5pTCIsImdldFVuaWZvcm1Mb2NhdGlvbiIsInVuaVQiLCJsb2NhdGlvbkNoZWNrIiwiY3JlYXRlU2hhZGVyRnJvbVNvdXJjZSIsIlZFUlRFWF9TSEFERVIiLCJGUkFHTUVOVF9TSEFERVIiLCJ2c1BhdGgiLCJmc1BhdGgiLCJ0YXJnZXRVcmwiLCJ4aHIiLCJ4bWwiLCJYTUxIdHRwUmVxdWVzdCIsIm9wZW4iLCJzZXRSZXF1ZXN0SGVhZGVyIiwicmVzcG9uc2VUZXh0IiwibG9hZENoZWNrIiwic2VuZCIsImJ1ZmZlciIsImlzQnVmZmVyIiwiZGVsZXRlQnVmZmVyIiwiaXNUZXh0dXJlIiwib2JqIiwiV2ViR0xGcmFtZWJ1ZmZlciIsImlzRnJhbWVidWZmZXIiLCJXZWJHTFJlbmRlcmJ1ZmZlciIsImlzUmVuZGVyYnVmZmVyIiwiV2ViR0xUZXh0dXJlIiwic2hhZGVyIiwiaXNTaGFkZXIiLCJkZWxldGVTaGFkZXIiLCJwcm9ncmFtIiwiaXNQcm9ncmFtIiwiZGVsZXRlUHJvZ3JhbSIsImVycm9yIiwiaWQiLCJzY3JpcHRFbGVtZW50IiwiY3JlYXRlU2hhZGVyIiwidGV4dCIsInNlYXJjaCIsIndhcm4iLCJzaGFkZXJTb3VyY2UiLCJjb21waWxlU2hhZGVyIiwiZ2V0U2hhZGVyUGFyYW1ldGVyIiwiQ09NUElMRV9TVEFUVVMiLCJlcnIiLCJnZXRTaGFkZXJJbmZvTG9nIiwiYXR0YWNoU2hhZGVyIiwibGlua1Byb2dyYW0iLCJnZXRQcm9ncmFtUGFyYW1ldGVyIiwiTElOS19TVEFUVVMiLCJnZXRQcm9ncmFtSW5mb0xvZyIsImVuYWJsZVZlcnRleEF0dHJpYkFycmF5IiwidmVydGV4QXR0cmliUG9pbnRlciIsIm1peGVkIiwidW5pIiwicmVwbGFjZSIsImwiLCJnbDNBdWRpbyIsImJnbUdhaW5WYWx1ZSIsInNvdW5kR2FpblZhbHVlIiwiY3R4IiwiY29tcCIsImJnbUdhaW4iLCJzb3VuZEdhaW4iLCJBdWRpb0NvbnRleHQiLCJ3ZWJraXRBdWRpb0NvbnRleHQiLCJjcmVhdGVEeW5hbWljc0NvbXByZXNzb3IiLCJjb25uZWN0IiwiZGVzdGluYXRpb24iLCJjcmVhdGVHYWluIiwiZ2FpbiIsInNldFZhbHVlQXRUaW1lIiwiRXJyb3IiLCJwYXRoIiwibG9vcCIsImJhY2tncm91bmQiLCJyZXNwb25zZVR5cGUiLCJkZWNvZGVBdWRpb0RhdGEiLCJyZXNwb25zZSIsImJ1ZiIsIkF1ZGlvU3JjIiwiZSIsImF1ZGlvQnVmZmVyIiwiYnVmZmVyU291cmNlIiwiYWN0aXZlQnVmZmVyU291cmNlIiwiZmZ0TG9vcCIsInVwZGF0ZSIsIm5vZGUiLCJjcmVhdGVTY3JpcHRQcm9jZXNzb3IiLCJhbmFseXNlciIsImNyZWF0ZUFuYWx5c2VyIiwic21vb3RoaW5nVGltZUNvbnN0YW50IiwiZmZ0U2l6ZSIsIm9uRGF0YSIsIlVpbnQ4QXJyYXkiLCJmcmVxdWVuY3lCaW5Db3VudCIsImsiLCJzZWxmIiwicGxheW5vdyIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsInBsYXliYWNrUmF0ZSIsInZhbHVlIiwib25lbmRlZCIsInN0b3AiLCJvbmF1ZGlvcHJvY2VzcyIsIm9ucHJvY2Vzc0V2ZW50Iiwic3RhcnQiLCJnZXRCeXRlRnJlcXVlbmN5RGF0YSIsImdsM01hdGgiLCJWZWMzIiwiVmVjMiIsImRlc3QiLCJtYXQwIiwibWF0MSIsIm91dCIsImEiLCJiIiwiYyIsImQiLCJtIiwibiIsIm8iLCJwIiwiQSIsIkIiLCJDIiwiRCIsIkUiLCJGIiwiRyIsIkgiLCJJIiwiSiIsIksiLCJMIiwiTSIsIk4iLCJPIiwiUCIsIm1hdCIsInZlYyIsImFuZ2xlIiwiYXhpcyIsInNxIiwic3FydCIsImNvcyIsInEiLCJzIiwidSIsInoiLCJleWUiLCJjZW50ZXIiLCJ1cCIsImV5ZVgiLCJleWVZIiwiZXllWiIsImNlbnRlclgiLCJjZW50ZXJZIiwiY2VudGVyWiIsInVwWCIsInVwWSIsInVwWiIsIngwIiwieDEiLCJ4MiIsInkwIiwieTEiLCJ5MiIsInowIiwiejEiLCJ6MiIsImZvdnkiLCJhc3BlY3QiLCJuZWFyIiwiZmFyIiwidGFuIiwibGVmdCIsInJpZ2h0IiwidG9wIiwiYm90dG9tIiwiaXZkIiwidXBEaXJlY3Rpb24iLCJ2bWF0IiwicG1hdCIsImxvb2tBdCIsInBlcnNwZWN0aXZlIiwiaGFsZldpZHRoIiwiaGFsZkhlaWdodCIsInRvVmVjSVYiLCJOYU4iLCJ2MCIsInYxIiwibGVuIiwidjIiLCJ2ZWMxIiwidmVjMiIsIm5vcm1hbGl6ZSIsInF0bjAiLCJxdG4xIiwiYXgiLCJheSIsImF6IiwiYXciLCJieCIsImJ5IiwiYnoiLCJidyIsInFwIiwicXEiLCJxciIsImludmVyc2UiLCJ4eCIsInh5IiwieHoiLCJ5eSIsInl6IiwienoiLCJ3eCIsInd5Iiwid3oiLCJ0aW1lIiwiaHQiLCJocyIsImFicyIsInBoIiwiYWNvcyIsInB0IiwidDAiLCJ0MSIsImdsM01lc2giLCJ0YyIsInBvcyIsIm5vciIsImNvbCIsInN0IiwiaWR4Iiwibm9ybWFsIiwic3BsaXQiLCJyYWQiLCJwdXNoIiwicngiLCJyeSIsInNpZGUiLCJyeiIsInRvcFJhZCIsImJvdHRvbVJhZCIsInJvdyIsImNvbHVtbiIsInJyIiwidHIiLCJ0eCIsInR5IiwidHoiLCJpcmFkIiwib3JhZCIsInJzIiwicnQiLCJnbDNVdGlsIiwidGgiLCJmbG9vciIsInRzIiwiZGVnIiwibG9uIiwiRUFSVEhfUkFESVVTIiwiZGVnVG9SYWQiLCJsYXQiLCJmbGF0dGVuIiwiZmxhdHRlbmluZyIsImlzTmFOIiwicGFyc2VGbG9hdCIsImNsYW1wIiwidGVtcCIsImVzIiwiZWNjZW50IiwicGhpIiwic2lucGhpIiwiY29uIiwiY29tIiwicG93IiwibG9uVG9NZXIiLCJsYXRUb01lciIsIkVBUlRIX0hBTEZfQ0lSQ1VNIiwiYXRhbiIsInpvb20iLCJsb25Ub1RpbGUiLCJsYXRUb1RpbGUiLCJ0aWxlVG9Mb24iLCJ0aWxlVG9MYXQiLCJnbDNHdWkiLCJXcmFwcGVyIiwiR1VJV3JhcHBlciIsIkVsZW1lbnQiLCJHVUlFbGVtZW50IiwiU2xpZGVyIiwiR1VJU2xpZGVyIiwiQ2hlY2tib3giLCJHVUlDaGVja2JveCIsIlJhZGlvIiwiR1VJUmFkaW8iLCJTZWxlY3QiLCJHVUlTZWxlY3QiLCJTcGluIiwiR1VJU3BpbiIsIkNvbG9yIiwiR1VJQ29sb3IiLCJlbGVtZW50IiwiY3JlYXRlRWxlbWVudCIsInN0eWxlIiwidHJhbnNpdGlvbiIsIndyYXBwZXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJvdmVyZmxvdyIsInRvZ2dsZSIsImNsYXNzTmFtZSIsInRleHRDb250ZW50IiwiZm9udFNpemUiLCJsaW5lSGVpZ2h0IiwiYm9yZGVyIiwiYm9yZGVyUmFkaXVzIiwiYm94U2hhZG93IiwiY3Vyc29yIiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsInRleHRBbGlnbiIsImRpc3BsYXkiLCJmbGV4RGlyZWN0aW9uIiwianVzdGlmeUNvbnRlbnQiLCJsYWJlbCIsInRleHRTaGFkb3ciLCJtYXJnaW4iLCJjb250cm9sIiwibGlzdGVuZXJzIiwiZnVuYyIsIm1pbiIsIm1heCIsInN0ZXAiLCJ2ZXJ0aWNhbEFsaWduIiwic2V0VmFsdWUiLCJlbWl0IiwiY2hlY2tlZCIsIm5hbWUiLCJsaXN0Iiwic2VsZWN0ZWRJbmRleCIsIk9wdGlvbiIsImFkZCIsImNvbnRhaW5lciIsImdyYWQiLCJjcmVhdGVMaW5lYXJHcmFkaWVudCIsImFkZENvbG9yU3RvcCIsImZpbGxTdHlsZSIsImZpbGxSZWN0IiwiY29sb3JWYWx1ZSIsInRlbXBDb2xvclZhbHVlIiwiaW1hZ2VEYXRhIiwiZ2V0SW1hZ2VEYXRhIiwib2Zmc2V0WCIsIm9mZnNldFkiLCJnZXRDb2xvcjhiaXRTdHJpbmciLCJjdXJyZW50VGFyZ2V0IiwiZ2V0Q29sb3JGbG9hdEFycmF5IiwiemVyb1BhZGRpbmciLCJwYXJzZUludCIsInN1YnN0ciIsImpvaW4iLCJzbGljZSIsInRpbGVkUGxhbmVQb2ludCIsInJlcyIsInR5cCIsInJuZCIsImlkeEhvcml6b25MaW5lIiwiaWR4Q3Jvc3NMaW5lIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7QUM1REE7Ozs7QUFDQTs7OztBQUVBOzs7Ozs7Ozs7OztBQVdBOzs7Ozs7Ozs7QUFTQTtBQUNBLElBQUlBLE1BQU0sSUFBSUMsaUJBQUosRUFBVjtBQUNBLElBQUlDLGVBQUo7QUFBQSxJQUFZQyxXQUFaO0FBQUEsSUFBZ0JDLFlBQWhCO0FBQUEsSUFBcUJDLFlBQXJCO0FBQUEsSUFBMEJDLGFBQTFCO0FBQUEsSUFBZ0NDLFlBQWhDO0FBQ0EsSUFBSUMsaUJBQUo7QUFBQSxJQUFjQyxpQkFBZDtBQUFBLElBQXdCQyxpQkFBeEI7QUFBQSxJQUFrQ0MsaUJBQWxDO0FBQUEsSUFBNENDLG9CQUE1QztBQUFBLElBQXlEQyxvQkFBekQ7QUFDQSxJQUFJQyxnQkFBSjtBQUFBLElBQWFDLGdCQUFiO0FBQ0EsSUFBSUMsb0JBQUo7QUFBQSxJQUFpQkMscUJBQWpC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QixHQUFwQixFQUF3QjtBQUMxQkksNkJBQWFySSxJQUFiLENBQWtCdkgsQ0FBbEIsRUFBcUJBLElBQUksQ0FBekI7QUFDSCxhQUZLLE1BRUEsSUFBRzNKLElBQUltWixHQUFKLElBQVd0akIsSUFBSXNqQixHQUFsQixFQUFzQjtBQUN4QjtBQUNBSSw2QkFBYXJJLElBQWIsQ0FBa0J2SCxDQUFsQixFQUFxQkEsSUFBSXdQLEdBQUosR0FBVSxDQUEvQixFQUFrQ3hQLENBQWxDLEVBQXFDQSxJQUFJLENBQXpDO0FBQ0g7QUFDREosZ0JBQUksR0FBSjtBQUNBRCxnQkFBSSxHQUFKO0FBQ0FzSCxnQkFBSU0sSUFBSixDQUFTelgsQ0FBVCxFQUFZeUcsQ0FBWixFQUFlcUosQ0FBZixFQUFrQkQsQ0FBbEI7QUFDQUs7QUFDSDtBQUNKO0FBQ0QsV0FBTztBQUNIOVYsa0JBQVU2YyxHQURQO0FBRUg1YyxlQUFPOGMsR0FGSjtBQUdIN2Msa0JBQVUwSyxHQUhQO0FBSUh6SyxjQUFNb2xCLEdBSkg7QUFLSG5sQixnQkFBUW9sQixHQUxMO0FBTUhqbEIsc0JBQWNrbEIsY0FOWDtBQU9IaGxCLG9CQUFZaWxCO0FBUFQsS0FBUDtBQVNILEMiLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiLi9cIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCBhNTNmZWFmYjI1NTY5YzljOTRiMCIsIlxyXG5pbXBvcnQgZ2xjdWJpYyAgICAgICAgICAgZnJvbSAnLi9nbDNDb3JlLmpzJztcclxuaW1wb3J0IHt0aWxlZFBsYW5lUG9pbnR9IGZyb20gJy4vZ2VvbWV0b3J5LmpzJztcclxuXHJcbi8qIHRleHR1cmVzXHJcbiAqIDA6IGRyYXcgdGFyZ2V0IGZyYW1lYnVmZmVyXHJcbiAqIDE6IGdhdXNzIGhvcml6b25cclxuICogMjogZ2F1c3MgdmVydGljYWxcclxuICogMzogbm9pc2UgYnVmZmVyXHJcbiAqIDQ6IHBvc2l0aW9uIGJ1ZmZlclxyXG4gKiA1OiBwb3NpdGlvbiBzd2FwIGJ1ZmZlclxyXG4gKiA2OiB2ZWxvY2l0eSBidWZmZXJcclxuICogNzogdmVsb2NpdHkgc3dhcCBidWZmZXJcclxuICovXHJcblxyXG4vKiBzaGFkZXJzXHJcbiAqIHNjZW5lUHJnICAgOiBiYXNlIHNjZW5lIHByb2dyYW1cclxuICogZmluYWxQcmcgICA6IGZpbmFsIHNjZW5lIHByb2dyYW1cclxuICogbm9pc2VQcmcgICA6IG5vaXNlIHByb2dyYW1cclxuICogZ2F1c3NQcmcgICA6IGdhdXNzIGJsdXIgcHJvZ3JhbVxyXG4gKiBwb3NpdGlvblByZzogZ3BncHUgcG9zaXRpb24gdXBkYXRlIHByb2dyYW1cclxuICogdmVsb2NpdHlQcmc6IGdwZ3B1IHZlbG9jaXR5IHVwZGF0ZSBwcm9ncmFtXHJcbiAqL1xyXG5cclxuLy8gdmFyaWFibGUgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbmxldCBnbDMgPSBuZXcgZ2xjdWJpYygpO1xyXG5sZXQgY2FudmFzLCBnbCwgZXh0LCBydW4sIG1hdDQsIHF0bjtcclxubGV0IHNjZW5lUHJnLCBmaW5hbFByZywgbm9pc2VQcmcsIGdhdXNzUHJnLCBwb3NpdGlvblByZywgdmVsb2NpdHlQcmc7XHJcbmxldCBnV2VpZ2h0LCBub3dUaW1lO1xyXG5sZXQgY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCwgYnVmZmVyU2l6ZSwgZ3BncHVCdWZmZXJTaXplO1xyXG5cclxuLy8gdmFyaWFibGUgaW5pdGlhbGl6ZSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbnJ1biA9IHRydWU7XHJcbm1hdDQgPSBnbDMuTWF0aC5NYXQ0O1xyXG5xdG4gPSBnbDMuTWF0aC5RdG47XHJcbmJ1ZmZlclNpemUgPSAxMDI0O1xyXG5ncGdwdUJ1ZmZlclNpemUgPSA2NDtcclxuXHJcbi8vIGNvbnN0IHZhcmlhYmxlID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5jb25zdCBERUZBVUxUX0NBTV9QT1NJVElPTiA9IFswLjAsIDAuMCwgMy4wXTtcclxuY29uc3QgREVGQVVMVF9DQU1fQ0VOVEVSICAgPSBbMC4wLCAwLjAsIDAuMF07XHJcbmNvbnN0IERFRkFVTFRfQ0FNX1VQICAgICAgID0gWzAuMCwgMS4wLCAwLjBdO1xyXG5cclxuLy8gb25sb2FkID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xyXG4gICAgLy8gZ2wzIGluaXRpYWxpemVcclxuICAgIGdsMy5pbml0KCdjYW52YXMnKTtcclxuICAgIGlmKCFnbDMucmVhZHkpe2NvbnNvbGUubG9nKCdpbml0aWFsaXplIGVycm9yJyk7IHJldHVybjt9XHJcbiAgICBjYW52YXMgPSBnbDMuY2FudmFzOyBnbCA9IGdsMy5nbDtcclxuICAgIGNhbnZhcy53aWR0aCAgPSBjYW52YXNXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgY2FudmFzLmhlaWdodCA9IGNhbnZhc0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHJcbiAgICAvLyBleHRlbnNpb25cclxuICAgIGV4dCA9IHt9O1xyXG4gICAgZXh0LmVsZW1lbnRJbmRleFVpbnQgPSBnbC5nZXRFeHRlbnNpb24oJ09FU19lbGVtZW50X2luZGV4X3VpbnQnKTtcclxuICAgIGV4dC50ZXh0dXJlRmxvYXQgPSBnbC5nZXRFeHRlbnNpb24oJ09FU190ZXh0dXJlX2Zsb2F0Jyk7XHJcbiAgICBleHQuZHJhd0J1ZmZlcnMgPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2RyYXdfYnVmZmVycycpO1xyXG5cclxuICAgIC8vIGV2ZW50XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmUpID0+IHtcclxuICAgICAgICBydW4gPSAoZXZlLmtleUNvZGUgIT09IDI3KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhub3dUaW1lKTtcclxuICAgIH0sIHRydWUpO1xyXG5cclxuICAgIHNoYWRlckxvYWRlcigpO1xyXG59LCBmYWxzZSk7XHJcblxyXG5mdW5jdGlvbiBzaGFkZXJMb2FkZXIoKXtcclxuICAgIC8vIHByb2dyYW1zXHJcbiAgICBzY2VuZVByZyA9IGdsMy5jcmVhdGVQcm9ncmFtRnJvbUZpbGUoXHJcbiAgICAgICAgJ3NoYWRlci9wbGFuZVBvaW50LnZlcnQnLFxyXG4gICAgICAgICdzaGFkZXIvcGxhbmVQb2ludC5mcmFnJyxcclxuICAgICAgICBbJ3Bvc2l0aW9uJywgJ2NvbG9yJywgJ3RleENvb3JkJywgJ3R5cGUnLCAncmFuZG9tJ10sXHJcbiAgICAgICAgWzMsIDQsIDIsIDQsIDRdLFxyXG4gICAgICAgIFsnbXZwTWF0cml4JywgJ3Bvc2l0aW9uVGV4dHVyZScsICd0aW1lJywgJ2dsb2JhbENvbG9yJ10sXHJcbiAgICAgICAgWydtYXRyaXg0ZnYnLCAnMWknLCAnMWYnLCAnNGZ2J10sXHJcbiAgICAgICAgc2hhZGVyTG9hZENoZWNrXHJcbiAgICApO1xyXG5cclxuICAgIC8vIGZpbmFsIHByb2dyYW1cclxuICAgIGZpbmFsUHJnID0gZ2wzLmNyZWF0ZVByb2dyYW1Gcm9tRmlsZShcclxuICAgICAgICAnc2hhZGVyL2ZpbmFsLnZlcnQnLFxyXG4gICAgICAgICdzaGFkZXIvZmluYWwuZnJhZycsXHJcbiAgICAgICAgWydwb3NpdGlvbiddLFxyXG4gICAgICAgIFszXSxcclxuICAgICAgICBbJ2dsb2JhbENvbG9yJywgJ3RleHR1cmUnLCAndGltZScsICdyZXNvbHV0aW9uJ10sXHJcbiAgICAgICAgWyc0ZnYnLCAnMWknLCAnMWYnLCAnMmZ2J10sXHJcbiAgICAgICAgc2hhZGVyTG9hZENoZWNrXHJcbiAgICApO1xyXG5cclxuICAgIC8vIG5vaXNlIHByb2dyYW1cclxuICAgIG5vaXNlUHJnID0gZ2wzLmNyZWF0ZVByb2dyYW1Gcm9tRmlsZShcclxuICAgICAgICAnc2hhZGVyL25vaXNlLnZlcnQnLFxyXG4gICAgICAgICdzaGFkZXIvbm9pc2UuZnJhZycsXHJcbiAgICAgICAgWydwb3NpdGlvbiddLFxyXG4gICAgICAgIFszXSxcclxuICAgICAgICBbJ3Jlc29sdXRpb24nXSxcclxuICAgICAgICBbJzJmdiddLFxyXG4gICAgICAgIHNoYWRlckxvYWRDaGVja1xyXG4gICAgKTtcclxuXHJcbiAgICAvLyBnYXVzcyBwcm9ncmFtXHJcbiAgICBnYXVzc1ByZyA9IGdsMy5jcmVhdGVQcm9ncmFtRnJvbUZpbGUoXHJcbiAgICAgICAgJ3NoYWRlci9nYXVzc2lhbi52ZXJ0JyxcclxuICAgICAgICAnc2hhZGVyL2dhdXNzaWFuLmZyYWcnLFxyXG4gICAgICAgIFsncG9zaXRpb24nXSxcclxuICAgICAgICBbM10sXHJcbiAgICAgICAgWydyZXNvbHV0aW9uJywgJ2hvcml6b250YWwnLCAnd2VpZ2h0JywgJ3RleHR1cmUnXSxcclxuICAgICAgICBbJzJmdicsICcxaScsICcxZnYnLCAnMWknXSxcclxuICAgICAgICBzaGFkZXJMb2FkQ2hlY2tcclxuICAgICk7XHJcblxyXG4gICAgLy8gZ3BncHUgcG9zaXRpb24gcHJvZ3JhbVxyXG4gICAgcG9zaXRpb25QcmcgPSBnbDMuY3JlYXRlUHJvZ3JhbUZyb21GaWxlKFxyXG4gICAgICAgICdzaGFkZXIvZ3BncHVQb3NpdGlvbi52ZXJ0JyxcclxuICAgICAgICAnc2hhZGVyL2dwZ3B1UG9zaXRpb24uZnJhZycsXHJcbiAgICAgICAgWydwb3NpdGlvbicsICd0ZXhDb29yZCddLFxyXG4gICAgICAgIFszLCAyXSxcclxuICAgICAgICBbJ3RpbWUnLCAnbm9pc2VUZXh0dXJlJywgJ3ByZXZpb3VzVGV4dHVyZScsICd2ZWxvY2l0eVRleHR1cmUnXSxcclxuICAgICAgICBbJzFmJywgJzFpJywgJzFpJywgJzFpJ10sXHJcbiAgICAgICAgc2hhZGVyTG9hZENoZWNrXHJcbiAgICApO1xyXG5cclxuICAgIC8vIGdwZ3B1IHZlbG9jaXR5IHByb2dyYW1cclxuICAgIHZlbG9jaXR5UHJnID0gZ2wzLmNyZWF0ZVByb2dyYW1Gcm9tRmlsZShcclxuICAgICAgICAnc2hhZGVyL2dwZ3B1VmVsb2NpdHkudmVydCcsXHJcbiAgICAgICAgJ3NoYWRlci9ncGdwdVZlbG9jaXR5LmZyYWcnLFxyXG4gICAgICAgIFsncG9zaXRpb24nLCAndGV4Q29vcmQnXSxcclxuICAgICAgICBbMywgMl0sXHJcbiAgICAgICAgWyd0aW1lJywgJ25vaXNlVGV4dHVyZScsICdwcmV2aW91c1RleHR1cmUnXSxcclxuICAgICAgICBbJzFmJywgJzFpJywgJzFpJ10sXHJcbiAgICAgICAgc2hhZGVyTG9hZENoZWNrXHJcbiAgICApO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNoYWRlckxvYWRDaGVjaygpe1xyXG4gICAgICAgIGlmKHNjZW5lUHJnLnByZyAgICAhPSBudWxsICYmXHJcbiAgICAgICAgICAgZmluYWxQcmcucHJnICAgICE9IG51bGwgJiZcclxuICAgICAgICAgICBub2lzZVByZy5wcmcgICAgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgIGdhdXNzUHJnLnByZyAgICAhPSBudWxsICYmXHJcbiAgICAgICAgICAgcG9zaXRpb25QcmcucHJnICE9IG51bGwgJiZcclxuICAgICAgICAgICB2ZWxvY2l0eVByZy5wcmcgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgIHRydWVcclxuICAgICAgICApe2luaXQoKTt9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXQoKXtcclxuICAgIGxldCByZXNldEJ1ZmZlckZ1bmN0aW9uID0gbnVsbDtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XHJcbiAgICAgICAgcmVzZXRCdWZmZXJGdW5jdGlvbiA9IGdlbmVyYXRlU2NyZWVuQnVmZmVyO1xyXG4gICAgICAgIHJ1biA9IGZhbHNlO1xyXG4gICAgfSwgZmFsc2UpO1xyXG5cclxuICAgIC8vIGFwcGxpY2F0aW9uIHNldHRpbmdcclxuICAgIGNhbnZhc1dpZHRoICAgPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGNhbnZhc0hlaWdodCAgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICBjYW52YXMud2lkdGggID0gY2FudmFzV2lkdGg7XHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xyXG4gICAgZ1dlaWdodCA9IGdhdXNzV2VpZ2h0KDIwLCAxMDAuMCk7XHJcblxyXG4gICAgLy8gdGlsZWQgcGxhbmUgcG9pbnQgbWVzaFxyXG4gICAgbGV0IHRpbGVkUGxhbmVQb2ludERhdGEgPSB0aWxlZFBsYW5lUG9pbnQoZ3BncHVCdWZmZXJTaXplKTtcclxuICAgIGxldCB0aWxlZFBsYW5lUG9pbnRWQk8gPSBbXHJcbiAgICAgICAgZ2wzLmNyZWF0ZVZibyh0aWxlZFBsYW5lUG9pbnREYXRhLnBvc2l0aW9uKSxcclxuICAgICAgICBnbDMuY3JlYXRlVmJvKHRpbGVkUGxhbmVQb2ludERhdGEuY29sb3IpLFxyXG4gICAgICAgIGdsMy5jcmVhdGVWYm8odGlsZWRQbGFuZVBvaW50RGF0YS50ZXhDb29yZCksXHJcbiAgICAgICAgZ2wzLmNyZWF0ZVZibyh0aWxlZFBsYW5lUG9pbnREYXRhLnR5cGUpLFxyXG4gICAgICAgIGdsMy5jcmVhdGVWYm8odGlsZWRQbGFuZVBvaW50RGF0YS5yYW5kb20pXHJcbiAgICBdO1xyXG4gICAgbGV0IHRpbGVkUGxhbmVIb3Jpem9uTGluZUlCTyA9IGdsMy5jcmVhdGVJYm9JbnQodGlsZWRQbGFuZVBvaW50RGF0YS5pbmRleEhvcml6b24pO1xyXG4gICAgbGV0IHRpbGVkUGxhbmVDcm9zc0xpbmVJQk8gPSBnbDMuY3JlYXRlSWJvSW50KHRpbGVkUGxhbmVQb2ludERhdGEuaW5kZXhDcm9zcyk7XHJcbiAgICBsZXQgdGlsZWRQbGFuZVBvaW50TGVuZ3RoID0gdGlsZWRQbGFuZVBvaW50RGF0YS5wb3NpdGlvbi5sZW5ndGggLyAzO1xyXG5cclxuICAgIC8vIHBsYW5lIG1lc2hcclxuICAgIGxldCBwbGFuZVBvc2l0aW9uID0gW1xyXG4gICAgICAgIC0xLjAsICAxLjAsICAwLjAsXHJcbiAgICAgICAgIDEuMCwgIDEuMCwgIDAuMCxcclxuICAgICAgICAtMS4wLCAtMS4wLCAgMC4wLFxyXG4gICAgICAgICAxLjAsIC0xLjAsICAwLjBcclxuICAgIF07XHJcbiAgICBsZXQgcGxhbmVUZXhDb29yZCA9IFtcclxuICAgICAgICAwLjAsIDAuMCxcclxuICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAwLjAsIDEuMCxcclxuICAgICAgICAxLjAsIDEuMFxyXG4gICAgXTtcclxuICAgIGxldCBwbGFuZUluZGV4ID0gW1xyXG4gICAgICAgIDAsIDIsIDEsIDEsIDIsIDNcclxuICAgIF07XHJcbiAgICBsZXQgcGxhbmVWQk8gPSBbZ2wzLmNyZWF0ZVZibyhwbGFuZVBvc2l0aW9uKV07XHJcbiAgICBsZXQgcGxhbmVUZXhDb29yZFZCTyA9IFtcclxuICAgICAgICBnbDMuY3JlYXRlVmJvKHBsYW5lUG9zaXRpb24pLFxyXG4gICAgICAgIGdsMy5jcmVhdGVWYm8ocGxhbmVUZXhDb29yZClcclxuICAgIF07XHJcbiAgICBsZXQgcGxhbmVJQk8gPSBnbDMuY3JlYXRlSWJvSW50KHBsYW5lSW5kZXgpO1xyXG5cclxuICAgIC8vIG1hdHJpeFxyXG4gICAgbGV0IG1NYXRyaXggPSBtYXQ0LmlkZW50aXR5KG1hdDQuY3JlYXRlKCkpO1xyXG4gICAgbGV0IHZNYXRyaXggPSBtYXQ0LmlkZW50aXR5KG1hdDQuY3JlYXRlKCkpO1xyXG4gICAgbGV0IHBNYXRyaXggPSBtYXQ0LmlkZW50aXR5KG1hdDQuY3JlYXRlKCkpO1xyXG4gICAgbGV0IHZwTWF0cml4ID0gbWF0NC5pZGVudGl0eShtYXQ0LmNyZWF0ZSgpKTtcclxuICAgIGxldCBtdnBNYXRyaXggPSBtYXQ0LmlkZW50aXR5KG1hdDQuY3JlYXRlKCkpO1xyXG4gICAgbGV0IGludk1hdHJpeCA9IG1hdDQuaWRlbnRpdHkobWF0NC5jcmVhdGUoKSk7XHJcblxyXG4gICAgLy8gZnJhbWUgYnVmZmVyXHJcbiAgICBsZXQgZnJhbWVCdWZmZXIsIGhHYXVzc0J1ZmZlciwgdkdhdXNzQnVmZmVyO1xyXG4gICAgZ2VuZXJhdGVTY3JlZW5CdWZmZXIoKTtcclxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlU2NyZWVuQnVmZmVyKCl7XHJcbiAgICAgICAgaWYoZnJhbWVCdWZmZXIgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbiAgICAgICAgICAgIGxldCBhcnIgPSBbZnJhbWVCdWZmZXIsIGhHYXVzc0J1ZmZlciwgdkdhdXNzQnVmZmVyXTtcclxuICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IDM7ICsraSl7XHJcbiAgICAgICAgICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaSk7XHJcbiAgICAgICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICAgICAgICAgIGdsLmRlbGV0ZVRleHR1cmUoYXJyW2ldLnRleHR1cmUpO1xyXG4gICAgICAgICAgICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKGFycltpXS5kZXB0aFJlbmRlcmJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlcihhcnJbaV0uZnJhbWVidWZmZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZyYW1lQnVmZmVyICA9IGdsMy5jcmVhdGVGcmFtZWJ1ZmZlcihjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0LCAwKTtcclxuICAgICAgICBoR2F1c3NCdWZmZXIgPSBnbDMuY3JlYXRlRnJhbWVidWZmZXIoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCwgMSk7XHJcbiAgICAgICAgdkdhdXNzQnVmZmVyID0gZ2wzLmNyZWF0ZUZyYW1lYnVmZmVyKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQsIDIpO1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCAzOyArK2kpe1xyXG4gICAgICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaSk7XHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGdsMy50ZXh0dXJlc1tpXS50ZXh0dXJlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBsZXQgbm9pc2VCdWZmZXIgPSBnbDMuY3JlYXRlRnJhbWVidWZmZXIoYnVmZmVyU2l6ZSwgYnVmZmVyU2l6ZSwgMyk7XHJcbiAgICBsZXQgcG9zaXRpb25CdWZmZXIgPSBbXTtcclxuICAgIHBvc2l0aW9uQnVmZmVyWzBdID0gZ2wzLmNyZWF0ZUZyYW1lYnVmZmVyRmxvYXQoZ3BncHVCdWZmZXJTaXplLCBncGdwdUJ1ZmZlclNpemUsIDQpO1xyXG4gICAgcG9zaXRpb25CdWZmZXJbMV0gPSBnbDMuY3JlYXRlRnJhbWVidWZmZXJGbG9hdChncGdwdUJ1ZmZlclNpemUsIGdwZ3B1QnVmZmVyU2l6ZSwgNSk7XHJcbiAgICBsZXQgdmVsb2NpdHlCdWZmZXIgPSBbXTtcclxuICAgIHZlbG9jaXR5QnVmZmVyWzBdID0gZ2wzLmNyZWF0ZUZyYW1lYnVmZmVyRmxvYXQoZ3BncHVCdWZmZXJTaXplLCBncGdwdUJ1ZmZlclNpemUsIDYpO1xyXG4gICAgdmVsb2NpdHlCdWZmZXJbMV0gPSBnbDMuY3JlYXRlRnJhbWVidWZmZXJGbG9hdChncGdwdUJ1ZmZlclNpemUsIGdwZ3B1QnVmZmVyU2l6ZSwgNyk7XHJcblxyXG4gICAgLy8gdGV4dHVyZSBzZXR0aW5nXHJcbiAgICAoKCkgPT4ge1xyXG4gICAgICAgIGxldCBpO1xyXG4gICAgICAgIGZvcihpID0gMDsgaSA8IDg7ICsraSl7XHJcbiAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpKTtcclxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgZ2wzLnRleHR1cmVzW2ldLnRleHR1cmUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pKCk7XHJcblxyXG4gICAgLy8gbm9pc2UgdGV4dHVyZVxyXG4gICAgbm9pc2VQcmcudXNlUHJvZ3JhbSgpO1xyXG4gICAgbm9pc2VQcmcuc2V0QXR0cmlidXRlKHBsYW5lVkJPLCBwbGFuZUlCTyk7XHJcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG5vaXNlQnVmZmVyLmZyYW1lYnVmZmVyKTtcclxuICAgIGdsMy5zY2VuZUNsZWFyKFswLjAsIDAuMCwgMC4wLCAxLjBdKTtcclxuICAgIGdsMy5zY2VuZVZpZXcoMCwgMCwgYnVmZmVyU2l6ZSwgYnVmZmVyU2l6ZSk7XHJcbiAgICBub2lzZVByZy5wdXNoU2hhZGVyKFtbYnVmZmVyU2l6ZSwgYnVmZmVyU2l6ZV1dKTtcclxuICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcblxyXG4gICAgLy8gZ2wgZmxhZ3NcclxuICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XHJcbiAgICBnbC5kZXB0aEZ1bmMoZ2wuTEVRVUFMKTtcclxuICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcclxuICAgIGdsLmN1bGxGYWNlKGdsLkJBQ0spO1xyXG4gICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcclxuXHJcbiAgICAvLyByZW5kZXJpbmdcclxuICAgIGxldCBjb3VudCA9IDA7XHJcbiAgICBsZXQgYmVnaW5UaW1lID0gRGF0ZS5ub3coKTtcclxuICAgIGxldCB0YXJnZXRCdWZmZXJOdW0gPSAwO1xyXG4gICAgcmVuZGVyKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gcmVuZGVyKCl7XHJcbiAgICAgICAgbGV0IGk7XHJcbiAgICAgICAgbm93VGltZSA9IERhdGUubm93KCkgLSBiZWdpblRpbWU7XHJcbiAgICAgICAgbm93VGltZSAvPSAxMDAwO1xyXG4gICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgdGFyZ2V0QnVmZmVyTnVtID0gY291bnQgJSAyO1xyXG5cclxuICAgICAgICAvLyBjYW52YXNcclxuICAgICAgICBjYW52YXNXaWR0aCAgID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICAgICAgY2FudmFzSGVpZ2h0ICA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgICAgICBjYW52YXMud2lkdGggID0gY2FudmFzV2lkdGg7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhc0hlaWdodDtcclxuXHJcbiAgICAgICAgLy8gcGVyc3BlY3RpdmUgcHJvamVjdGlvblxyXG4gICAgICAgIGxldCBjYW1lcmFQb3NpdGlvbiAgICA9IERFRkFVTFRfQ0FNX1BPU0lUSU9OO1xyXG4gICAgICAgIGxldCBjZW50ZXJQb2ludCAgICAgICA9IERFRkFVTFRfQ0FNX0NFTlRFUjtcclxuICAgICAgICBsZXQgY2FtZXJhVXBEaXJlY3Rpb24gPSBERUZBVUxUX0NBTV9VUDtcclxuICAgICAgICBtYXQ0LnZwRnJvbUNhbWVyYVByb3BlcnR5KFxyXG4gICAgICAgICAgICBjYW1lcmFQb3NpdGlvbixcclxuICAgICAgICAgICAgY2VudGVyUG9pbnQsXHJcbiAgICAgICAgICAgIGNhbWVyYVVwRGlyZWN0aW9uLFxyXG4gICAgICAgICAgICA0NSwgY2FudmFzV2lkdGggLyBjYW52YXNIZWlnaHQsXHJcbiAgICAgICAgICAgIDAuMSxcclxuICAgICAgICAgICAgMTAuMCxcclxuICAgICAgICAgICAgdk1hdHJpeCwgcE1hdHJpeCwgdnBNYXRyaXhcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBncGdwdSB1cGRhdGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgZ2wuYmxlbmRGdW5jU2VwYXJhdGUoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBLCBnbC5PTkUsIGdsLk9ORSk7XHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB2ZWxvY2l0eUJ1ZmZlclt0YXJnZXRCdWZmZXJOdW1dLmZyYW1lYnVmZmVyKTtcclxuICAgICAgICBnbDMuc2NlbmVWaWV3KDAsIDAsIGdwZ3B1QnVmZmVyU2l6ZSwgZ3BncHVCdWZmZXJTaXplKTtcclxuICAgICAgICB2ZWxvY2l0eVByZy51c2VQcm9ncmFtKCk7XHJcbiAgICAgICAgdmVsb2NpdHlQcmcuc2V0QXR0cmlidXRlKHBsYW5lVGV4Q29vcmRWQk8sIHBsYW5lSUJPKTtcclxuICAgICAgICB2ZWxvY2l0eVByZy5wdXNoU2hhZGVyKFtub3dUaW1lLCAzLCA2ICsgMSAtIHRhcmdldEJ1ZmZlck51bV0pO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBwb3NpdGlvbkJ1ZmZlclt0YXJnZXRCdWZmZXJOdW1dLmZyYW1lYnVmZmVyKTtcclxuICAgICAgICBnbDMuc2NlbmVWaWV3KDAsIDAsIGdwZ3B1QnVmZmVyU2l6ZSwgZ3BncHVCdWZmZXJTaXplKTtcclxuICAgICAgICBwb3NpdGlvblByZy51c2VQcm9ncmFtKCk7XHJcbiAgICAgICAgcG9zaXRpb25Qcmcuc2V0QXR0cmlidXRlKHBsYW5lVGV4Q29vcmRWQk8sIHBsYW5lSUJPKTtcclxuICAgICAgICBwb3NpdGlvblByZy5wdXNoU2hhZGVyKFtub3dUaW1lLCAzLCA0ICsgMSAtIHRhcmdldEJ1ZmZlck51bSwgNiArIHRhcmdldEJ1ZmZlck51bV0pO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcblxyXG4gICAgICAgIC8vIHJlbmRlciB0byBmcmFtZSBidWZmZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZyYW1lQnVmZmVyLmZyYW1lYnVmZmVyKTtcclxuICAgICAgICBnbDMuc2NlbmVDbGVhcihbMC4wLCAwLjAsIDAuMSwgMS4wXSwgMS4wKTtcclxuICAgICAgICBnbDMuc2NlbmVWaWV3KDAsIDAsIGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpO1xyXG5cclxuICAgICAgICAvLyB0ZW1wIHBsYW5lIHBvaW50IGRyYXdcclxuICAgICAgICBzY2VuZVByZy51c2VQcm9ncmFtKCk7XHJcbiAgICAgICAgLy8gc2NlbmVQcmcuc2V0QXR0cmlidXRlKHRpbGVkUGxhbmVQb2ludFZCTywgbnVsbCk7XHJcbiAgICAgICAgc2NlbmVQcmcuc2V0QXR0cmlidXRlKHRpbGVkUGxhbmVQb2ludFZCTywgdGlsZWRQbGFuZUNyb3NzTGluZUlCTyk7XHJcbiAgICAgICAgbWF0NC5pZGVudGl0eShtTWF0cml4KTtcclxuICAgICAgICBtYXQ0LnJvdGF0ZShtTWF0cml4LCBNYXRoLnNpbihub3dUaW1lKSwgWzEsIDEsIDBdLCBtTWF0cml4KTtcclxuICAgICAgICBtYXQ0Lm11bHRpcGx5KHZwTWF0cml4LCBtTWF0cml4LCBtdnBNYXRyaXgpO1xyXG4gICAgICAgIHNjZW5lUHJnLnB1c2hTaGFkZXIoW212cE1hdHJpeCwgNCArIHRhcmdldEJ1ZmZlck51bSwgbm93VGltZSwgWzAuOCwgMC43NSwgMS4wLCAwLjVdXSk7XHJcbiAgICAgICAgZ2wzLmRyYXdBcnJheXMoZ2wuUE9JTlRTLCB0aWxlZFBsYW5lUG9pbnRMZW5ndGgpO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuTElORVMsIHRpbGVkUGxhbmVQb2ludERhdGEuaW5kZXhDcm9zcy5sZW5ndGgpO1xyXG5cclxuICAgICAgICAvLyBob3Jpem9uIGdhdXNzIHJlbmRlciB0byBmQnVmZmVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgZ2F1c3NQcmcudXNlUHJvZ3JhbSgpO1xyXG4gICAgICAgIGdhdXNzUHJnLnNldEF0dHJpYnV0ZShwbGFuZVZCTywgcGxhbmVJQk8pO1xyXG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgaEdhdXNzQnVmZmVyLmZyYW1lYnVmZmVyKTtcclxuICAgICAgICBnbDMuc2NlbmVDbGVhcihbMC4wLCAwLjAsIDAuMCwgMS4wXSwgMS4wKTtcclxuICAgICAgICBnbDMuc2NlbmVWaWV3KDAsIDAsIGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpO1xyXG4gICAgICAgIGdhdXNzUHJnLnB1c2hTaGFkZXIoW1tjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0XSwgdHJ1ZSwgZ1dlaWdodCwgMF0pO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcblxyXG4gICAgICAgIC8vIHZlcnRpY2FsIGdhdXNzIHJlbmRlciB0byBmQnVmZmVyXHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB2R2F1c3NCdWZmZXIuZnJhbWVidWZmZXIpO1xyXG4gICAgICAgIGdsMy5zY2VuZUNsZWFyKFswLjAsIDAuMCwgMC4wLCAxLjBdLCAxLjApO1xyXG4gICAgICAgIGdsMy5zY2VuZVZpZXcoMCwgMCwgY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCk7XHJcbiAgICAgICAgZ2F1c3NQcmcucHVzaFNoYWRlcihbW2NhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHRdLCBmYWxzZSwgZ1dlaWdodCwgMV0pO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcblxyXG4gICAgICAgIC8vIGZpbmFsIHNjZW5lIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5TUkNfQUxQSEEsIGdsLk9ORSwgZ2wuT05FLCBnbC5PTkUpO1xyXG4gICAgICAgIGZpbmFsUHJnLnVzZVByb2dyYW0oKTtcclxuICAgICAgICBmaW5hbFByZy5zZXRBdHRyaWJ1dGUocGxhbmVWQk8sIHBsYW5lSUJPKTtcclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgICAgIGdsMy5zY2VuZUNsZWFyKFswLjAxLCAwLjAyLCAwLjA4LCAxLjBdLCAxLjApO1xyXG4gICAgICAgIGdsMy5zY2VuZVZpZXcoMCwgMCwgY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCk7XHJcbiAgICAgICAgZmluYWxQcmcucHVzaFNoYWRlcihbWzEuMCwgMS4wLCAxLjAsIDEuMF0sIDAsIG5vd1RpbWUsIFtjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0XV0pO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcbiAgICAgICAgZmluYWxQcmcucHVzaFNoYWRlcihbWzEuMCwgMS4wLCAxLjAsIDEuMF0sIDIsIG5vd1RpbWUsIFtjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0XV0pO1xyXG4gICAgICAgIGdsMy5kcmF3RWxlbWVudHNJbnQoZ2wuVFJJQU5HTEVTLCBwbGFuZUluZGV4Lmxlbmd0aCk7XHJcblxyXG4gICAgICAgIGlmKHJ1bil7XHJcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZXNldEJ1ZmZlckZ1bmN0aW9uICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgcmVzZXRCdWZmZXJGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgcmVzZXRCdWZmZXJGdW5jdGlvbiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBydW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdhdXNzV2VpZ2h0KHJlc29sdXRpb24sIHBvd2VyKXtcclxuICAgIGxldCBpO1xyXG4gICAgbGV0IHQgPSAwLjA7XHJcbiAgICBsZXQgd2VpZ2h0ID0gW107XHJcbiAgICBmb3IoaSA9IDA7IGkgPCByZXNvbHV0aW9uOyBpKyspe1xyXG4gICAgICAgIGxldCByID0gMS4wICsgMi4wICogaTtcclxuICAgICAgICBsZXQgdyA9IE1hdGguZXhwKC0wLjUgKiAociAqIHIpIC8gcG93ZXIpO1xyXG4gICAgICAgIHdlaWdodFtpXSA9IHc7XHJcbiAgICAgICAgaWYoaSA+IDApe3cgKj0gMi4wO31cclxuICAgICAgICB0ICs9IHc7XHJcbiAgICB9XHJcbiAgICBmb3IoaSA9IDA7IGkgPCB3ZWlnaHQubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgIHdlaWdodFtpXSAvPSB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHdlaWdodDtcclxufVxyXG5cclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc2NyaXB0LmpzIiwiXHJcbmltcG9ydCBhdWRpbyBmcm9tICcuL2dsM0F1ZGlvLmpzJztcclxuaW1wb3J0IG1hdGggIGZyb20gJy4vZ2wzTWF0aC5qcyc7XHJcbmltcG9ydCBtZXNoICBmcm9tICcuL2dsM01lc2guanMnO1xyXG5pbXBvcnQgdXRpbCAgZnJvbSAnLi9nbDNVdGlsLmpzJztcclxuaW1wb3J0IGd1aSAgIGZyb20gJy4vZ2wzR3VpLmpzJztcclxuXHJcbi8qKlxyXG4gKiBnbGN1YmljXHJcbiAqIEBjbGFzcyBnbDNcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGdsMyB7XHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIHZlcnNpb25cclxuICAgICAgICAgKiBAY29uc3RcclxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuVkVSU0lPTiA9ICcwLjIuMic7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogcGkgKiAyXHJcbiAgICAgICAgICogQGNvbnN0XHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLlBJMiA9IDYuMjgzMTg1MzA3MTc5NTg2NDc2OTI1Mjg2NzY2NTU5MDA1NzY7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogcGlcclxuICAgICAgICAgKiBAY29uc3RcclxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuUEkgPSAzLjE0MTU5MjY1MzU4OTc5MzIzODQ2MjY0MzM4MzI3OTUwMjg4O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIHBpIC8gMlxyXG4gICAgICAgICAqIEBjb25zdFxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5QSUggPSAxLjU3MDc5NjMyNjc5NDg5NjYxOTIzMTMyMTY5MTYzOTc1MTQ0O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIHBpIC8gNFxyXG4gICAgICAgICAqIEBjb25zdFxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5QSUgyID0gMC43ODUzOTgxNjMzOTc0NDgzMDk2MTU2NjA4NDU4MTk4NzU3MjtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBnbC5NQVhfQ09NQklORURfVEVYVFVSRV9JTUFHRV9VTklUUyDjgpLliKnnlKjjgZfjgablvpfjgonjgozjgovjg4bjgq/jgrnjg4Hjg6Pjg6bjg4vjg4Pjg4jjga7mnIDlpKfliKnnlKjlj6/og73mlbBcclxuICAgICAgICAgKiBAY29uc3RcclxuICAgICAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuVEVYVFVSRV9VTklUX0NPVU5UID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogZ2xjdWJpYyDjgYzmraPjgZfjgY/liJ3mnJ/ljJbjgZXjgozjgZ/jganjgYbjgYvjga7jg5Xjg6njgrBcclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJlYWR5ID0gZmFsc2U7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogZ2xjdWJpYyDjgajntJDku5jjgYTjgabjgYTjgosgY2FudmFzIGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTENhbnZhc0VsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGdsY3ViaWMg44Go57SQ5LuY44GE44Gm44GE44KLIGNhbnZhcyDjgYvjgonlj5blvpfjgZfjgZ8gV2ViR0wgUmVuZGVyaW5nIENvbnRleHRcclxuICAgICAgICAgKiBAdHlwZSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZ2wgPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQg44Go44GX44Gm5Yid5pyf5YyW44GX44Gf44GL44Gp44GG44GL44KS6KGo44GZ55yf5YG95YCkXHJcbiAgICAgICAgICogQHR5cGUge2Jvb2x9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5pc1dlYkdMMiA9IGZhbHNlO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGN1YmljIOOBqOOBl+OBpuOBruODreOCsOWHuuWKm+OCkuOBmeOCi+OBi+OBqeOBhuOBi1xyXG4gICAgICAgICAqIEB0eXBlIHtib29sfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuaXNDb25zb2xlT3V0cHV0ID0gdHJ1ZTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBnbGN1YmljIOOBjOWGhemDqOeahOOBq+aMgeOBo+OBpuOBhOOCi+ODhuOCr+OCueODgeODo+agvOe0jeeUqOOBrumFjeWIl1xyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48V2ViR0xUZXh0dXJlPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRleHR1cmVzID0gbnVsbDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXZWJHTCDjga7mi6HlvLXmqZ/og73jgpLmoLzntI3jgZnjgovjgqrjg5bjgrjjgqfjgq/jg4hcclxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZXh0ID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogZ2wzQXVkaW8g44Kv44Op44K544Gu44Kk44Oz44K544K/44Oz44K5XHJcbiAgICAgICAgICogQHR5cGUge2dsM0F1ZGlvfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuQXVkaW8gPSBhdWRpbztcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBnbDNNZXNoIOOCr+ODqeOCueOBruOCpOODs+OCueOCv+ODs+OCuVxyXG4gICAgICAgICAqIEB0eXBlIHtnbDNNZXNofVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuTWVzaCA9IG1lc2g7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogZ2wzVXRpbCDjgq/jg6njgrnjga7jgqTjg7Pjgrnjgr/jg7PjgrlcclxuICAgICAgICAgKiBAdHlwZSB7Z2wzVXRpbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLlV0aWwgPSB1dGlsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGdsM0d1aSDjgq/jg6njgrnjga7jgqTjg7Pjgrnjgr/jg7PjgrlcclxuICAgICAgICAgKiBAdHlwZSB7Z2wzR3VpfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuR3VpID0gbmV3IGd1aSgpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGdsM01hdGgg44Kv44Op44K544Gu44Kk44Oz44K544K/44Oz44K5XHJcbiAgICAgICAgICogQHR5cGUge2dsM01hdGh9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5NYXRoID0gbmV3IG1hdGgoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdsY3ViaWMg44KS5Yid5pyf5YyW44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fHN0cmluZ30gY2FudmFzIC0gY2FudmFzIGVsZW1lbnQg44GLIGNhbnZhcyDjgavku5jkuI7jgZXjgozjgabjgYTjgosgSUQg5paH5a2X5YiXXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5pdE9wdGlvbnMgLSBjYW52YXMuZ2V0Q29udGV4dCDjgafnrKzkuozlvJXmlbDjgavmuKHjgZnliJ3mnJ/ljJbmmYLjgqrjg5fjgrfjg6fjg7NcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjdWJpY09wdGlvbnNcclxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbH0gd2ViZ2wyTW9kZSAtIHdlYmdsMiDjgpLmnInlirnljJbjgZnjgovloLTlkIggdHJ1ZVxyXG4gICAgICogQHByb3BlcnR5IHtib29sfSBjb25zb2xlTWVzc2FnZSAtIGNvbnNvbGUg44GrIGN1YmljIOOBruODreOCsOOCkuWHuuWKm+OBmeOCi+OBi+OBqeOBhuOBi1xyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0g5Yid5pyf5YyW44GM5q2j44GX44GP6KGM44KP44KM44Gf44GL44Gp44GG44GL44KS6KGo44GZ55yf5YG95YCkXHJcbiAgICAgKi9cclxuICAgIGluaXQoY2FudmFzLCBpbml0T3B0aW9ucywgY3ViaWNPcHRpb25zKXtcclxuICAgICAgICBsZXQgb3B0ID0gaW5pdE9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5yZWFkeSA9IGZhbHNlO1xyXG4gICAgICAgIGlmKGNhbnZhcyA9PSBudWxsKXtyZXR1cm4gZmFsc2U7fVxyXG4gICAgICAgIGlmKGNhbnZhcyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KXtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgfWVsc2UgaWYoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGNhbnZhcykgPT09ICdbb2JqZWN0IFN0cmluZ10nKXtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGlzLmNhbnZhcyA9PSBudWxsKXtyZXR1cm4gZmFsc2U7fVxyXG4gICAgICAgIGlmKGN1YmljT3B0aW9ucyAhPSBudWxsKXtcclxuICAgICAgICAgICAgaWYoY3ViaWNPcHRpb25zLmhhc093blByb3BlcnR5KCd3ZWJnbDJNb2RlJykgPT09IHRydWUgJiYgY3ViaWNPcHRpb25zLndlYmdsMk1vZGUgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJ3dlYmdsMicsIG9wdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzV2ViR0wyID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihjdWJpY09wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2NvbnNvbGVNZXNzYWdlJykgPT09IHRydWUgJiYgY3ViaWNPcHRpb25zLmNvbnNvbGVNZXNzYWdlICE9PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNDb25zb2xlT3V0cHV0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5nbCA9PSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5nbCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgb3B0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5nbCAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5yZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuVEVYVFVSRV9VTklUX0NPVU5UID0gdGhpcy5nbC5nZXRQYXJhbWV0ZXIodGhpcy5nbC5NQVhfQ09NQklORURfVEVYVFVSRV9JTUFHRV9VTklUUyk7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZXMgPSBuZXcgQXJyYXkodGhpcy5URVhUVVJFX1VOSVRfQ09VTlQpO1xyXG4gICAgICAgICAgICB0aGlzLmV4dCA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRJbmRleFVpbnQ6IHRoaXMuZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfZWxlbWVudF9pbmRleF91aW50JyksXHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlRmxvYXQ6IHRoaXMuZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpLFxyXG4gICAgICAgICAgICAgICAgdGV4dHVyZUhhbGZGbG9hdDogdGhpcy5nbC5nZXRFeHRlbnNpb24oJ09FU190ZXh0dXJlX2hhbGZfZmxvYXQnKSxcclxuICAgICAgICAgICAgICAgIGRyYXdCdWZmZXJzOiB0aGlzLmdsLmdldEV4dGVuc2lvbignV0VCR0xfZHJhd19idWZmZXJzJylcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYodGhpcy5pc0NvbnNvbGVPdXRwdXQgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyVj4peGJWMgZ2xjdWJpYy5qcyAlY+KXhiVjIDogdmVyc2lvbiAlYycgKyB0aGlzLlZFUlNJT04sICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGNyaW1zb24nLCAnJywgJ2NvbG9yOiByb3lhbGJsdWUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5yZWFkeTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODleODrOODvOODoOODkOODg+ODleOCoeOCkuOCr+ODquOCouOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY29sb3IgLSDjgq/jg6rjgqLjgZnjgovoibLvvIgwLjAgfiAxLjDvvIlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVwdGhdIC0g44Kv44Oq44Ki44GZ44KL5rex5bqmXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3N0ZW5jaWxdIC0g44Kv44Oq44Ki44GZ44KL44K544OG44Oz44K344Or5YCkXHJcbiAgICAgKi9cclxuICAgIHNjZW5lQ2xlYXIoY29sb3IsIGRlcHRoLCBzdGVuY2lsKXtcclxuICAgICAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIGxldCBmbGcgPSBnbC5DT0xPUl9CVUZGRVJfQklUO1xyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10pO1xyXG4gICAgICAgIGlmKGRlcHRoICE9IG51bGwpe1xyXG4gICAgICAgICAgICBnbC5jbGVhckRlcHRoKGRlcHRoKTtcclxuICAgICAgICAgICAgZmxnID0gZmxnIHwgZ2wuREVQVEhfQlVGRkVSX0JJVDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoc3RlbmNpbCAhPSBudWxsKXtcclxuICAgICAgICAgICAgZ2wuY2xlYXJTdGVuY2lsKHN0ZW5jaWwpO1xyXG4gICAgICAgICAgICBmbGcgPSBmbGcgfCBnbC5TVEVOQ0lMX0JVRkZFUl9CSVQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdsLmNsZWFyKGZsZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5Pjg6Xjg7zjg53jg7zjg4jjgpLoqK3lrprjgZnjgotcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeF0gLSB477yI5bem56uv5Y6f54K577yJXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIC0gee+8iOS4i+err+WOn+eCue+8iVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt3aWR0aF0gLSDmqKrjga7luYVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaGVpZ2h0XSAtIOe4puOBrumrmOOBlVxyXG4gICAgICovXHJcbiAgICBzY2VuZVZpZXcoeCwgeSwgd2lkdGgsIGhlaWdodCl7XHJcbiAgICAgICAgbGV0IFggPSB4IHx8IDA7XHJcbiAgICAgICAgbGV0IFkgPSB5IHx8IDA7XHJcbiAgICAgICAgbGV0IHcgPSB3aWR0aCAgfHwgd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICAgICAgbGV0IGggPSBoZWlnaHQgfHwgd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuZ2wudmlld3BvcnQoWCwgWSwgdywgaCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnbC5kcmF3QXJyYXlzIOOCkuOCs+ODvOODq+OBmeOCi+ODqeODg+ODkeODvFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHByaW1pdGl2ZSAtIOODl+ODquODn+ODhuOCo+ODluOCv+OCpOODl1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHZlcnRleENvdW50IC0g5o+P55S744GZ44KL6aCC54K544Gu5YCL5pWwXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29mZnNldD0wXSAtIOaPj+eUu+OBmeOCi+mggueCueOBrumWi+Wni+OCquODleOCu+ODg+ODiFxyXG4gICAgICovXHJcbiAgICBkcmF3QXJyYXlzKHByaW1pdGl2ZSwgdmVydGV4Q291bnQsIG9mZnNldCA9IDApe1xyXG4gICAgICAgIHRoaXMuZ2wuZHJhd0FycmF5cyhwcmltaXRpdmUsIG9mZnNldCwgdmVydGV4Q291bnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2wuZHJhd0VsZW1lbnRzIOOCkuOCs+ODvOODq+OBmeOCi+ODqeODg+ODkeODvFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHByaW1pdGl2ZSAtIOODl+ODquODn+ODhuOCo+ODluOCv+OCpOODl1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4TGVuZ3RoIC0g5o+P55S744GZ44KL44Kk44Oz44OH44OD44Kv44K544Gu5YCL5pWwXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29mZnNldD0wXSAtIOaPj+eUu+OBmeOCi+OCpOODs+ODh+ODg+OCr+OCueOBrumWi+Wni+OCquODleOCu+ODg+ODiFxyXG4gICAgICovXHJcbiAgICBkcmF3RWxlbWVudHMocHJpbWl0aXZlLCBpbmRleExlbmd0aCwgb2Zmc2V0ID0gMCl7XHJcbiAgICAgICAgdGhpcy5nbC5kcmF3RWxlbWVudHMocHJpbWl0aXZlLCBpbmRleExlbmd0aCwgdGhpcy5nbC5VTlNJR05FRF9TSE9SVCwgb2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdsLmRyYXdFbGVtZW50cyDjgpLjgrPjg7zjg6vjgZnjgovjg6njg4Pjg5Hjg7zvvIhnbC5VTlNJR05FRF9JTlTvvIkg4oC76KaB5ouh5by15qmf6IO977yIV2ViR0wgMS4w77yJXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcHJpbWl0aXZlIC0g44OX44Oq44Of44OG44Kj44OW44K/44Kk44OXXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhMZW5ndGggLSDmj4/nlLvjgZnjgovjgqTjg7Pjg4fjg4Pjgq/jgrnjga7lgIvmlbBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb2Zmc2V0PTBdIC0g5o+P55S744GZ44KL44Kk44Oz44OH44OD44Kv44K544Gu6ZaL5aeL44Kq44OV44K744OD44OIXHJcbiAgICAgKi9cclxuICAgIGRyYXdFbGVtZW50c0ludChwcmltaXRpdmUsIGluZGV4TGVuZ3RoLCBvZmZzZXQgPSAwKXtcclxuICAgICAgICB0aGlzLmdsLmRyYXdFbGVtZW50cyhwcmltaXRpdmUsIGluZGV4TGVuZ3RoLCB0aGlzLmdsLlVOU0lHTkVEX0lOVCwgb2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZCT++8iFZlcnRleCBCdWZmZXIgT2JqZWN077yJ44KS55Sf5oiQ44GX44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBkYXRhIC0g6aCC54K55oOF5aCx44KS5qC857SN44GX44Gf6YWN5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtXZWJHTEJ1ZmZlcn0g55Sf5oiQ44GX44Gf6aCC54K544OQ44OD44OV44KhXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVZibyhkYXRhKXtcclxuICAgICAgICBpZihkYXRhID09IG51bGwpe3JldHVybjt9XHJcbiAgICAgICAgbGV0IHZibyA9IHRoaXMuZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB2Ym8pO1xyXG4gICAgICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShkYXRhKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgICAgICByZXR1cm4gdmJvO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSUJP77yISW5kZXggQnVmZmVyIE9iamVjdO+8ieOCkueUn+aIkOOBl+OBpui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gZGF0YSAtIOOCpOODs+ODh+ODg+OCr+OCueaDheWgseOCkuagvOe0jeOBl+OBn+mFjeWIl1xyXG4gICAgICogQHJldHVybiB7V2ViR0xCdWZmZXJ9IOeUn+aIkOOBl+OBn+OCpOODs+ODh+ODg+OCr+OCueODkOODg+ODleOCoVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVJYm8oZGF0YSl7XHJcbiAgICAgICAgaWYoZGF0YSA9PSBudWxsKXtyZXR1cm47fVxyXG4gICAgICAgIGxldCBpYm8gPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xyXG4gICAgICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgSW50MTZBcnJheShkYXRhKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgICAgIHJldHVybiBpYm87XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJQk/vvIhJbmRleCBCdWZmZXIgT2JqZWN077yJ44KS55Sf5oiQ44GX44Gm6L+U44GZ77yIZ2wuVU5TSUdORURfSU5U77yJIOKAu+imgeaLoeW8teapn+iDve+8iFdlYkdMIDEuMO+8iVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gZGF0YSAtIOOCpOODs+ODh+ODg+OCr+OCueaDheWgseOCkuagvOe0jeOBl+OBn+mFjeWIl1xyXG4gICAgICogQHJldHVybiB7V2ViR0xCdWZmZXJ9IOeUn+aIkOOBl+OBn+OCpOODs+ODh+ODg+OCr+OCueODkOODg+ODleOCoVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVJYm9JbnQoZGF0YSl7XHJcbiAgICAgICAgaWYoZGF0YSA9PSBudWxsKXtyZXR1cm47fVxyXG4gICAgICAgIGxldCBpYm8gPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpYm8pO1xyXG4gICAgICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDMyQXJyYXkoZGF0YSksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcclxuICAgICAgICByZXR1cm4gaWJvO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44OV44Kh44Kk44Or44KS5YWD44Gr44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GX44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc291cmNlIC0g44OV44Kh44Kk44Or44OR44K5XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gZ2xjdWJpYyDjgYzlhoXpg6jnmoTjgavmjIHjgaTphY3liJfjga7jgqTjg7Pjg4fjg4Pjgq/jgrkg4oC76Z2e44OG44Kv44K544OB44Oj44Om44OL44OD44OIXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIOeUu+WDj+OBruODreODvOODieOBjOWujOS6huOBl+ODhuOCr+OCueODgeODo+OCkueUn+aIkOOBl+OBn+W+jOOBq+WRvOOBsOOCjOOCi+OCs+ODvOODq+ODkOODg+OCr1xyXG4gICAgICovXHJcbiAgICBjcmVhdGVUZXh0dXJlRnJvbUZpbGUoc291cmNlLCBudW1iZXIsIGNhbGxiYWNrKXtcclxuICAgICAgICBpZihzb3VyY2UgPT0gbnVsbCB8fCBudW1iZXIgPT0gbnVsbCl7cmV0dXJuO31cclxuICAgICAgICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgbGV0IGdsID0gdGhpcy5nbDtcclxuICAgICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0gPSB7dGV4dHVyZTogbnVsbCwgdHlwZTogbnVsbCwgbG9hZGVkOiBmYWxzZX07XHJcbiAgICAgICAgICAgIGxldCB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBudW1iZXIpO1xyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXgpO1xyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGltZyk7XHJcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdLnRleHR1cmUgPSB0ZXg7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50eXBlID0gZ2wuVEVYVFVSRV8yRDtcclxuICAgICAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdLmxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuaXNDb25zb2xlT3V0cHV0ID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KXhiVjIHRleHR1cmUgbnVtYmVyOiAlYycgKyBudW1iZXIgKyAnJWMsIGZpbGUgbG9hZGVkOiAlYycgKyBzb3VyY2UsICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGJsdWUnLCAnJywgJ2NvbG9yOiBnb2xkZW5yb2QnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcclxuICAgICAgICAgICAgaWYoY2FsbGJhY2sgIT0gbnVsbCl7Y2FsbGJhY2sobnVtYmVyKTt9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpbWcuc3JjID0gc291cmNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44Kq44OW44K444Kn44Kv44OI44KS5YWD44Gr44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GX44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0IC0g44Ot44O844OJ5riI44G/44GuIEltYWdlIOOCquODluOCuOOCp+OCr+ODiOOChCBDYW52YXMg44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gZ2xjdWJpYyDjgYzlhoXpg6jnmoTjgavmjIHjgaTphY3liJfjga7jgqTjg7Pjg4fjg4Pjgq/jgrkg4oC76Z2e44OG44Kv44K544OB44Oj44Om44OL44OD44OIXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVRleHR1cmVGcm9tT2JqZWN0KG9iamVjdCwgbnVtYmVyKXtcclxuICAgICAgICBpZihvYmplY3QgPT0gbnVsbCB8fCBudW1iZXIgPT0gbnVsbCl7cmV0dXJuO31cclxuICAgICAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIGxldCB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdID0ge3RleHR1cmU6IG51bGwsIHR5cGU6IG51bGwsIGxvYWRlZDogZmFsc2V9O1xyXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBudW1iZXIpO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleCk7XHJcbiAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBvYmplY3QpO1xyXG4gICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50ZXh0dXJlID0gdGV4O1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50eXBlID0gZ2wuVEVYVFVSRV8yRDtcclxuICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0ubG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBpZih0aGlzLmlzQ29uc29sZU91dHB1dCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KXhiVjIHRleHR1cmUgbnVtYmVyOiAlYycgKyBudW1iZXIgKyAnJWMsIG9iamVjdCBhdHRhY2hlZCcsICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGJsdWUnLCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog55S75YOP44KS5YWD44Gr44Kt44Ol44O844OW44Oe44OD44OX44OG44Kv44K544OB44Oj44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBzb3VyY2UgLSDjg5XjgqHjgqTjg6vjg5HjgrnjgpLmoLzntI3jgZfjgZ/phY3liJdcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IHRhcmdldCAtIOOCreODpeODvOODluODnuODg+ODl+ODhuOCr+OCueODgeODo+OBq+ioreWumuOBmeOCi+OCv+ODvOOCsuODg+ODiOOBrumFjeWIl1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciAtIGdsY3ViaWMg44GM5YaF6YOo55qE44Gr5oyB44Gk6YWN5YiX44Gu44Kk44Oz44OH44OD44Kv44K5IOKAu+mdnuODhuOCr+OCueODgeODo+ODpuODi+ODg+ODiFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSDnlLvlg4/jga7jg63jg7zjg4njgYzlrozkuobjgZfjg4bjgq/jgrnjg4Hjg6PjgpLnlJ/miJDjgZfjgZ/lvozjgavlkbzjgbDjgozjgovjgrPjg7zjg6vjg5Djg4Pjgq9cclxuICAgICAqL1xyXG4gICAgY3JlYXRlVGV4dHVyZUN1YmVGcm9tRmlsZShzb3VyY2UsIHRhcmdldCwgbnVtYmVyLCBjYWxsYmFjayl7XHJcbiAgICAgICAgaWYoc291cmNlID09IG51bGwgfHwgdGFyZ2V0ID09IG51bGwgfHwgbnVtYmVyID09IG51bGwpe3JldHVybjt9XHJcbiAgICAgICAgbGV0IGNJbWcgPSBbXTtcclxuICAgICAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXSA9IHt0ZXh0dXJlOiBudWxsLCB0eXBlOiBudWxsLCBsb2FkZWQ6IGZhbHNlfTtcclxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgc291cmNlLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgY0ltZ1tpXSA9IHtpbWFnZTogbmV3IEltYWdlKCksIGxvYWRlZDogZmFsc2V9O1xyXG4gICAgICAgICAgICBjSW1nW2ldLmltYWdlLm9ubG9hZCA9ICgoaW5kZXgpID0+IHtyZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY0ltZ1tpbmRleF0ubG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGlmKGNJbWcubGVuZ3RoID09PSA2KXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgY0ltZy5tYXAoKHYpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZiA9IGYgJiYgdi5sb2FkZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZiA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXggPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBudW1iZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0ZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IGogPSAwOyBqIDwgc291cmNlLmxlbmd0aDsgaisrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsLnRleEltYWdlMkQodGFyZ2V0W2pdLCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBjSW1nW2pdLmltYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFX0NVQkVfTUFQKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50ZXh0dXJlID0gdGV4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0udHlwZSA9IGdsLlRFWFRVUkVfQ1VCRV9NQVA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmlzQ29uc29sZU91dHB1dCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnJWPil4YlYyB0ZXh0dXJlIG51bWJlcjogJWMnICsgbnVtYmVyICsgJyVjLCBmaWxlIGxvYWRlZDogJWMnICsgc291cmNlWzBdICsgJy4uLicsICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGJsdWUnLCAnJywgJ2NvbG9yOiBnb2xkZW5yb2QnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2sgIT0gbnVsbCl7Y2FsbGJhY2sobnVtYmVyKTt9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O30pKGkpO1xyXG4gICAgICAgICAgICBjSW1nW2ldLmltYWdlLnNyYyA9IHNvdXJjZVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnbGN1YmljIOOBjOaMgeOBpOmFjeWIl+OBruOCpOODs+ODh+ODg+OCr+OCueOBqOODhuOCr+OCueODgeODo+ODpuODi+ODg+ODiOOCkuaMh+WumuOBl+OBpuODhuOCr+OCueODgeODo+OCkuODkOOCpOODs+ODieOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHVuaXQgLSDjg4bjgq/jgrnjg4Hjg6Pjg6bjg4vjg4Pjg4hcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgLSBnbGN1YmljIOOBjOaMgeOBpOmFjeWIl+OBruOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgICovXHJcbiAgICBiaW5kVGV4dHVyZSh1bml0LCBudW1iZXIpe1xyXG4gICAgICAgIGlmKHRoaXMudGV4dHVyZXNbbnVtYmVyXSA9PSBudWxsKXtyZXR1cm47fVxyXG4gICAgICAgIHRoaXMuZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkUwICsgdW5pdCk7XHJcbiAgICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLnRleHR1cmVzW251bWJlcl0udHlwZSwgdGhpcy50ZXh0dXJlc1tudW1iZXJdLnRleHR1cmUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2xjdWJpYyDjgYzmjIHjgaTphY3liJflhoXjga7jg4bjgq/jgrnjg4Hjg6PnlKjnlLvlg4/jgYzlhajjgabjg63jg7zjg4nmuIjjgb/jgYvjganjgYbjgYvnorroqo3jgZnjgotcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IOODreODvOODieOBjOWujOS6huOBl+OBpuOBhOOCi+OBi+OBqeOBhuOBi+OBruODleODqeOCsFxyXG4gICAgICovXHJcbiAgICBpc1RleHR1cmVMb2FkZWQoKXtcclxuICAgICAgICBsZXQgaSwgaiwgZiwgZztcclxuICAgICAgICBmID0gdHJ1ZTsgZyA9IGZhbHNlO1xyXG4gICAgICAgIGZvcihpID0gMCwgaiA9IHRoaXMudGV4dHVyZXMubGVuZ3RoOyBpIDwgajsgaSsrKXtcclxuICAgICAgICAgICAgaWYodGhpcy50ZXh0dXJlc1tpXSAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZiA9IGYgJiYgdGhpcy50ZXh0dXJlc1tpXS5sb2FkZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZyl7cmV0dXJuIGY7fWVsc2V7cmV0dXJuIGZhbHNlO31cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODleODrOODvOODoOODkOODg+ODleOCoeOCkueUn+aIkOOBl+OCq+ODqeODvOODkOODg+ODleOCoeOBq+ODhuOCr+OCueODgeODo+OCkuioreWumuOBl+OBpuOCquODluOCuOOCp+OCr+ODiOOBqOOBl+OBpui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu5qiq5bmFXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu6auY44GVXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gZ2xjdWJpYyDjgYzlhoXpg6jnmoTjgavmjIHjgaTphY3liJfjga7jgqTjg7Pjg4fjg4Pjgq/jgrkg4oC76Z2e44OG44Kv44K544OB44Oj44Om44OL44OD44OIXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IOeUn+aIkOOBl+OBn+WQhOeoruOCquODluOCuOOCp+OCr+ODiOOBr+ODqeODg+ODl+OBl+OBpui/lOWNtOOBmeOCi1xyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTEZyYW1lYnVmZmVyfSBmcmFtZWJ1ZmZlciAtIOODleODrOODvOODoOODkOODg+ODleOCoVxyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTFJlbmRlcmJ1ZmZlcn0gZGVwdGhSZW5kZXJCdWZmZXIgLSDmt7Hluqbjg5Djg4Pjg5XjgqHjgajjgZfjgaboqK3lrprjgZfjgZ/jg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqFcclxuICAgICAqIEBwcm9wZXJ0eSB7V2ViR0xUZXh0dXJlfSB0ZXh0dXJlIC0g44Kr44Op44O844OQ44OD44OV44Kh44Go44GX44Gm6Kit5a6a44GX44Gf44OG44Kv44K544OB44OjXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUZyYW1lYnVmZmVyKHdpZHRoLCBoZWlnaHQsIG51bWJlcil7XHJcbiAgICAgICAgaWYod2lkdGggPT0gbnVsbCB8fCBoZWlnaHQgPT0gbnVsbCB8fCBudW1iZXIgPT0gbnVsbCl7cmV0dXJuO31cclxuICAgICAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXSA9IHt0ZXh0dXJlOiBudWxsLCB0eXBlOiBudWxsLCBsb2FkZWQ6IGZhbHNlfTtcclxuICAgICAgICBsZXQgZnJhbWVCdWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZnJhbWVCdWZmZXIpO1xyXG4gICAgICAgIGxldCBkZXB0aFJlbmRlckJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLkRFUFRIX0NPTVBPTkVOVDE2LCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCwgZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICAgICAgbGV0IGZUZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBudW1iZXIpO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGZUZXh0dXJlKTtcclxuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIHdpZHRoLCBoZWlnaHQsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUsIDApO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50ZXh0dXJlID0gZlRleHR1cmU7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdLnR5cGUgPSBnbC5URVhUVVJFXzJEO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmKHRoaXMuaXNDb25zb2xlT3V0cHV0ID09PSB0cnVlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVj4peGJWMgdGV4dHVyZSBudW1iZXI6ICVjJyArIG51bWJlciArICclYywgZnJhbWVidWZmZXIgY3JlYXRlZCcsICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGJsdWUnLCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7ZnJhbWVidWZmZXI6IGZyYW1lQnVmZmVyLCBkZXB0aFJlbmRlcmJ1ZmZlcjogZGVwdGhSZW5kZXJCdWZmZXIsIHRleHR1cmU6IGZUZXh0dXJlfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODleODrOODvOODoOODkOODg+ODleOCoeOCkueUn+aIkOOBl+OCq+ODqeODvOODkOODg+ODleOCoeOBq+ODhuOCr+OCueODgeODo+OCkuioreWumuOAgeOCueODhuODs+OCt+ODq+acieWKueOBp+OCquODluOCuOOCp+OCr+ODiOOBqOOBl+OBpui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu5qiq5bmFXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0g44OV44Os44O844Og44OQ44OD44OV44Kh44Gu6auY44GVXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gZ2xjdWJpYyDjgYzlhoXpg6jnmoTjgavmjIHjgaTphY3liJfjga7jgqTjg7Pjg4fjg4Pjgq/jgrkg4oC76Z2e44OG44Kv44K544OB44Oj44Om44OL44OD44OIXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IOeUn+aIkOOBl+OBn+WQhOeoruOCquODluOCuOOCp+OCr+ODiOOBr+ODqeODg+ODl+OBl+OBpui/lOWNtOOBmeOCi1xyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTEZyYW1lYnVmZmVyfSBmcmFtZWJ1ZmZlciAtIOODleODrOODvOODoOODkOODg+ODleOCoVxyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTFJlbmRlcmJ1ZmZlcn0gZGVwdGhTdGVuY2lsUmVuZGVyYnVmZmVyIC0g5rex5bqm44OQ44OD44OV44Kh5YW844K544OG44Oz44K344Or44OQ44OD44OV44Kh44Go44GX44Gm6Kit5a6a44GX44Gf44Os44Oz44OA44O844OQ44OD44OV44KhXHJcbiAgICAgKiBAcHJvcGVydHkge1dlYkdMVGV4dHVyZX0gdGV4dHVyZSAtIOOCq+ODqeODvOODkOODg+ODleOCoeOBqOOBl+OBpuioreWumuOBl+OBn+ODhuOCr+OCueODgeODo1xyXG4gICAgICovXHJcbiAgICBjcmVhdGVGcmFtZWJ1ZmZlclN0ZW5jaWwod2lkdGgsIGhlaWdodCwgbnVtYmVyKXtcclxuICAgICAgICBpZih3aWR0aCA9PSBudWxsIHx8IGhlaWdodCA9PSBudWxsIHx8IG51bWJlciA9PSBudWxsKXtyZXR1cm47fVxyXG4gICAgICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdID0ge3RleHR1cmU6IG51bGwsIHR5cGU6IG51bGwsIGxvYWRlZDogZmFsc2V9O1xyXG4gICAgICAgIGxldCBmcmFtZUJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmcmFtZUJ1ZmZlcik7XHJcbiAgICAgICAgbGV0IGRlcHRoU3RlbmNpbFJlbmRlckJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFN0ZW5jaWxSZW5kZXJCdWZmZXIpO1xyXG4gICAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9TVEVOQ0lMLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIGRlcHRoU3RlbmNpbFJlbmRlckJ1ZmZlcik7XHJcbiAgICAgICAgbGV0IGZUZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBudW1iZXIpO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGZUZXh0dXJlKTtcclxuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIHdpZHRoLCBoZWlnaHQsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUsIDApO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50ZXh0dXJlID0gZlRleHR1cmU7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdLnR5cGUgPSBnbC5URVhUVVJFXzJEO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmKHRoaXMuaXNDb25zb2xlT3V0cHV0ID09PSB0cnVlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVj4peGJWMgdGV4dHVyZSBudW1iZXI6ICVjJyArIG51bWJlciArICclYywgZnJhbWVidWZmZXIgY3JlYXRlZCAoZW5hYmxlIHN0ZW5jaWwpJywgJ2NvbG9yOiBjcmltc29uJywgJycsICdjb2xvcjogYmx1ZScsICcnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtmcmFtZWJ1ZmZlcjogZnJhbWVCdWZmZXIsIGRlcHRoU3RlbmNpbFJlbmRlcmJ1ZmZlcjogZGVwdGhTdGVuY2lsUmVuZGVyQnVmZmVyLCB0ZXh0dXJlOiBmVGV4dHVyZX07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLnlJ/miJDjgZfjgqvjg6njg7zjg5Djg4Pjg5XjgqHjgavmta7li5XlsI/mlbDngrnjg4bjgq/jgrnjg4Hjg6PjgpLoqK3lrprjgZfjgabjgqrjg5bjgrjjgqfjgq/jg4jjgajjgZfjgabov5TjgZkg4oC76KaB5ouh5by15qmf6IO977yIV2ViR0wgMS4w77yJXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjga7mqKrluYVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjga7pq5jjgZVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgLSBnbGN1YmljIOOBjOWGhemDqOeahOOBq+aMgeOBpOmFjeWIl+OBruOCpOODs+ODh+ODg+OCr+OCuSDigLvpnZ7jg4bjgq/jgrnjg4Hjg6Pjg6bjg4vjg4Pjg4hcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0g55Sf5oiQ44GX44Gf5ZCE56iu44Kq44OW44K444Kn44Kv44OI44Gv44Op44OD44OX44GX44Gm6L+U5Y2044GZ44KLXHJcbiAgICAgKiBAcHJvcGVydHkge1dlYkdMRnJhbWVidWZmZXJ9IGZyYW1lYnVmZmVyIC0g44OV44Os44O844Og44OQ44OD44OV44KhXHJcbiAgICAgKiBAcHJvcGVydHkge1dlYkdMUmVuZGVyYnVmZmVyfSBkZXB0aFJlbmRlckJ1ZmZlciAtIOa3seW6puODkOODg+ODleOCoeOBqOOBl+OBpuioreWumuOBl+OBn+ODrOODs+ODgOODvOODkOODg+ODleOCoVxyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTFRleHR1cmV9IHRleHR1cmUgLSDjgqvjg6njg7zjg5Djg4Pjg5XjgqHjgajjgZfjgaboqK3lrprjgZfjgZ/jg4bjgq/jgrnjg4Hjg6NcclxuICAgICAqL1xyXG4gICAgY3JlYXRlRnJhbWVidWZmZXJGbG9hdCh3aWR0aCwgaGVpZ2h0LCBudW1iZXIpe1xyXG4gICAgICAgIGlmKHdpZHRoID09IG51bGwgfHwgaGVpZ2h0ID09IG51bGwgfHwgbnVtYmVyID09IG51bGwpe3JldHVybjt9XHJcbiAgICAgICAgaWYodGhpcy5leHQgPT0gbnVsbCB8fCAodGhpcy5leHQudGV4dHVyZUZsb2F0ID09IG51bGwgJiYgdGhpcy5leHQudGV4dHVyZUhhbGZGbG9hdCA9PSBudWxsKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmbG9hdCB0ZXh0dXJlIG5vdCBzdXBwb3J0Jyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGdsID0gdGhpcy5nbDtcclxuICAgICAgICBsZXQgZmxnID0gKHRoaXMuZXh0LnRleHR1cmVGbG9hdCAhPSBudWxsKSA/IGdsLkZMT0FUIDogdGhpcy5leHQudGV4dHVyZUhhbGZGbG9hdC5IQUxGX0ZMT0FUX09FUztcclxuICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0gPSB7dGV4dHVyZTogbnVsbCwgdHlwZTogbnVsbCwgbG9hZGVkOiBmYWxzZX07XHJcbiAgICAgICAgbGV0IGZyYW1lQnVmZmVyID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZyYW1lQnVmZmVyKTtcclxuICAgICAgICBsZXQgZlRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIG51bWJlcik7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUpO1xyXG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgd2lkdGgsIGhlaWdodCwgMCwgZ2wuUkdCQSwgZmxnLCBudWxsKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgZlRleHR1cmUsIDApO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xyXG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdLnRleHR1cmUgPSBmVGV4dHVyZTtcclxuICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0udHlwZSA9IGdsLlRFWFRVUkVfMkQ7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1tudW1iZXJdLmxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgaWYodGhpcy5pc0NvbnNvbGVPdXRwdXQgPT09IHRydWUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWPil4YlYyB0ZXh0dXJlIG51bWJlcjogJWMnICsgbnVtYmVyICsgJyVjLCBmcmFtZWJ1ZmZlciBjcmVhdGVkIChlbmFibGUgZmxvYXQpJywgJ2NvbG9yOiBjcmltc29uJywgJycsICdjb2xvcjogYmx1ZScsICcnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtmcmFtZWJ1ZmZlcjogZnJhbWVCdWZmZXIsIGRlcHRoUmVuZGVyYnVmZmVyOiBudWxsLCB0ZXh0dXJlOiBmVGV4dHVyZX07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5Xjg6zjg7zjg6Djg5Djg4Pjg5XjgqHjgpLnlJ/miJDjgZfjgqvjg6njg7zjg5Djg4Pjg5XjgqHjgavjgq3jg6Xjg7zjg5bjg4bjgq/jgrnjg4Hjg6PjgpLoqK3lrprjgZfjgabjgqrjg5bjgrjjgqfjgq/jg4jjgajjgZfjgabov5TjgZlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIOODleODrOODvOODoOODkOODg+ODleOCoeOBruaoquW5hVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIOODleODrOODvOODoOODkOODg+ODleOCoeOBrumrmOOBlVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gdGFyZ2V0IC0g44Kt44Ol44O844OW44Oe44OD44OX44OG44Kv44K544OB44Oj44Gr6Kit5a6a44GZ44KL44K/44O844Ky44OD44OI44Gu6YWN5YiXXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyIC0gZ2xjdWJpYyDjgYzlhoXpg6jnmoTjgavmjIHjgaTphY3liJfjga7jgqTjg7Pjg4fjg4Pjgq/jgrkg4oC76Z2e44OG44Kv44K544OB44Oj44Om44OL44OD44OIXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IOeUn+aIkOOBl+OBn+WQhOeoruOCquODluOCuOOCp+OCr+ODiOOBr+ODqeODg+ODl+OBl+OBpui/lOWNtOOBmeOCi1xyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTEZyYW1lYnVmZmVyfSBmcmFtZWJ1ZmZlciAtIOODleODrOODvOODoOODkOODg+ODleOCoVxyXG4gICAgICogQHByb3BlcnR5IHtXZWJHTFJlbmRlcmJ1ZmZlcn0gZGVwdGhSZW5kZXJCdWZmZXIgLSDmt7Hluqbjg5Djg4Pjg5XjgqHjgajjgZfjgaboqK3lrprjgZfjgZ/jg6zjg7Pjg4Djg7zjg5Djg4Pjg5XjgqFcclxuICAgICAqIEBwcm9wZXJ0eSB7V2ViR0xUZXh0dXJlfSB0ZXh0dXJlIC0g44Kr44Op44O844OQ44OD44OV44Kh44Go44GX44Gm6Kit5a6a44GX44Gf44OG44Kv44K544OB44OjXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUZyYW1lYnVmZmVyQ3ViZSh3aWR0aCwgaGVpZ2h0LCB0YXJnZXQsIG51bWJlcil7XHJcbiAgICAgICAgaWYod2lkdGggPT0gbnVsbCB8fCBoZWlnaHQgPT0gbnVsbCB8fCB0YXJnZXQgPT0gbnVsbCB8fCBudW1iZXIgPT0gbnVsbCl7cmV0dXJuO31cclxuICAgICAgICBsZXQgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXSA9IHt0ZXh0dXJlOiBudWxsLCB0eXBlOiBudWxsLCBsb2FkZWQ6IGZhbHNlfTtcclxuICAgICAgICBsZXQgZnJhbWVCdWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZnJhbWVCdWZmZXIpO1xyXG4gICAgICAgIGxldCBkZXB0aFJlbmRlckJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xyXG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLkRFUFRIX0NPTVBPTkVOVDE2LCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCwgZ2wuUkVOREVSQlVGRkVSLCBkZXB0aFJlbmRlckJ1ZmZlcik7XHJcbiAgICAgICAgbGV0IGZUZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBudW1iZXIpO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGZUZXh0dXJlKTtcclxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRCh0YXJnZXRbaV0sIDAsIGdsLlJHQkEsIHdpZHRoLCBoZWlnaHQsIDAsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcclxuICAgICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcclxuICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0udGV4dHVyZSA9IGZUZXh0dXJlO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbbnVtYmVyXS50eXBlID0gZ2wuVEVYVFVSRV9DVUJFX01BUDtcclxuICAgICAgICB0aGlzLnRleHR1cmVzW251bWJlcl0ubG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBpZih0aGlzLmlzQ29uc29sZU91dHB1dCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KXhiVjIHRleHR1cmUgbnVtYmVyOiAlYycgKyBudW1iZXIgKyAnJWMsIGZyYW1lYnVmZmVyIGN1YmUgY3JlYXRlZCcsICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGJsdWUnLCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7ZnJhbWVidWZmZXI6IGZyYW1lQnVmZmVyLCBkZXB0aFJlbmRlcmJ1ZmZlcjogZGVwdGhSZW5kZXJCdWZmZXIsIHRleHR1cmU6IGZUZXh0dXJlfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhUTUwg5YaF44Gr5a2Y5Zyo44GZ44KLIElEIOaWh+Wtl+WIl+OBi+OCiSBzY3JpcHQg44K/44Kw44KS5Y+C54Wn44GX44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdnNJZCAtIOmggueCueOCt+OCp+ODvOODgOOBruOCveODvOOCueOBjOiomOi/sOOBleOCjOOBnyBzY3JpcHQg44K/44Kw44GuIElEIOaWh+Wtl+WIl1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZzSWQgLSDjg5Xjg6njgrDjg6Hjg7Pjg4jjgrfjgqfjg7zjg4Djga7jgr3jg7zjgrnjgYzoqJjov7DjgZXjgozjgZ8gc2NyaXB0IOOCv+OCsOOBriBJRCDmloflrZfliJdcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGF0dExvY2F0aW9uIC0gYXR0cmlidXRlIOWkieaVsOWQjeOBrumFjeWIl1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gYXR0U3RyaWRlIC0gYXR0cmlidXRlIOWkieaVsOOBruOCueODiOODqeOCpOODieOBrumFjeWIl1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gdW5pTG9jYXRpb24gLSB1bmlmb3JtIOWkieaVsOWQjeOBrumFjeWIl1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gdW5pVHlwZSAtIHVuaWZvcm0g5aSJ5pWw5pu05paw44Oh44K944OD44OJ44Gu5ZCN5YmN44KS56S644GZ5paH5a2X5YiXIOKAu+S+i++8midtYXRyaXg0ZnYnXHJcbiAgICAgKiBAcmV0dXJuIHtQcm9ncmFtTWFuYWdlcn0g44OX44Ot44Kw44Op44Og44Oe44ON44O844K444Oj44O844Kv44Op44K544Gu44Kk44Oz44K544K/44Oz44K5XHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVByb2dyYW1Gcm9tSWQodnNJZCwgZnNJZCwgYXR0TG9jYXRpb24sIGF0dFN0cmlkZSwgdW5pTG9jYXRpb24sIHVuaVR5cGUpe1xyXG4gICAgICAgIGlmKHRoaXMuZ2wgPT0gbnVsbCl7cmV0dXJuIG51bGw7fVxyXG4gICAgICAgIGxldCBpO1xyXG4gICAgICAgIGxldCBtbmcgPSBuZXcgUHJvZ3JhbU1hbmFnZXIodGhpcy5nbCwgdGhpcy5pc1dlYkdMMik7XHJcbiAgICAgICAgbW5nLnZzID0gbW5nLmNyZWF0ZVNoYWRlckZyb21JZCh2c0lkKTtcclxuICAgICAgICBtbmcuZnMgPSBtbmcuY3JlYXRlU2hhZGVyRnJvbUlkKGZzSWQpO1xyXG4gICAgICAgIG1uZy5wcmcgPSBtbmcuY3JlYXRlUHJvZ3JhbShtbmcudnMsIG1uZy5mcyk7XHJcbiAgICAgICAgaWYobW5nLnByZyA9PSBudWxsKXtyZXR1cm4gbW5nO31cclxuICAgICAgICBtbmcuYXR0TCA9IG5ldyBBcnJheShhdHRMb2NhdGlvbi5sZW5ndGgpO1xyXG4gICAgICAgIG1uZy5hdHRTID0gbmV3IEFycmF5KGF0dExvY2F0aW9uLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXR0TG9jYXRpb24ubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBtbmcuYXR0TFtpXSA9IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24obW5nLnByZywgYXR0TG9jYXRpb25baV0pO1xyXG4gICAgICAgICAgICBtbmcuYXR0U1tpXSA9IGF0dFN0cmlkZVtpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbW5nLnVuaUwgPSBuZXcgQXJyYXkodW5pTG9jYXRpb24ubGVuZ3RoKTtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCB1bmlMb2NhdGlvbi5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIG1uZy51bmlMW2ldID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24obW5nLnByZywgdW5pTG9jYXRpb25baV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtbmcudW5pVCA9IHVuaVR5cGU7XHJcbiAgICAgICAgbW5nLmxvY2F0aW9uQ2hlY2soYXR0TG9jYXRpb24sIHVuaUxvY2F0aW9uKTtcclxuICAgICAgICByZXR1cm4gbW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K344Kn44O844OA44Gu44K944O844K544Kz44O844OJ5paH5a2X5YiX44GL44KJ44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdnMgLSDpoILngrnjgrfjgqfjg7zjg4Djga7jgr3jg7zjgrlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmcyAtIOODleODqeOCsOODoeODs+ODiOOCt+OCp+ODvOODgOOBruOCveODvOOCuVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gYXR0TG9jYXRpb24gLSBhdHRyaWJ1dGUg5aSJ5pWw5ZCN44Gu6YWN5YiXXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBhdHRTdHJpZGUgLSBhdHRyaWJ1dGUg5aSJ5pWw44Gu44K544OI44Op44Kk44OJ44Gu6YWN5YiXXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSB1bmlMb2NhdGlvbiAtIHVuaWZvcm0g5aSJ5pWw5ZCN44Gu6YWN5YiXXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSB1bmlUeXBlIC0gdW5pZm9ybSDlpInmlbDmm7TmlrDjg6Hjgr3jg4Pjg4njga7lkI3liY3jgpLnpLrjgZnmloflrZfliJcg4oC75L6L77yaJ21hdHJpeDRmdidcclxuICAgICAqIEByZXR1cm4ge1Byb2dyYW1NYW5hZ2VyfSDjg5fjg63jgrDjg6njg6Djg57jg43jg7zjgrjjg6Pjg7zjgq/jg6njgrnjga7jgqTjg7Pjgrnjgr/jg7PjgrlcclxuICAgICAqL1xyXG4gICAgY3JlYXRlUHJvZ3JhbUZyb21Tb3VyY2UodnMsIGZzLCBhdHRMb2NhdGlvbiwgYXR0U3RyaWRlLCB1bmlMb2NhdGlvbiwgdW5pVHlwZSl7XHJcbiAgICAgICAgaWYodGhpcy5nbCA9PSBudWxsKXtyZXR1cm4gbnVsbDt9XHJcbiAgICAgICAgbGV0IGk7XHJcbiAgICAgICAgbGV0IG1uZyA9IG5ldyBQcm9ncmFtTWFuYWdlcih0aGlzLmdsLCB0aGlzLmlzV2ViR0wyKTtcclxuICAgICAgICBtbmcudnMgPSBtbmcuY3JlYXRlU2hhZGVyRnJvbVNvdXJjZSh2cywgdGhpcy5nbC5WRVJURVhfU0hBREVSKTtcclxuICAgICAgICBtbmcuZnMgPSBtbmcuY3JlYXRlU2hhZGVyRnJvbVNvdXJjZShmcywgdGhpcy5nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgIG1uZy5wcmcgPSBtbmcuY3JlYXRlUHJvZ3JhbShtbmcudnMsIG1uZy5mcyk7XHJcbiAgICAgICAgaWYobW5nLnByZyA9PSBudWxsKXtyZXR1cm4gbW5nO31cclxuICAgICAgICBtbmcuYXR0TCA9IG5ldyBBcnJheShhdHRMb2NhdGlvbi5sZW5ndGgpO1xyXG4gICAgICAgIG1uZy5hdHRTID0gbmV3IEFycmF5KGF0dExvY2F0aW9uLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgYXR0TG9jYXRpb24ubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBtbmcuYXR0TFtpXSA9IHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24obW5nLnByZywgYXR0TG9jYXRpb25baV0pO1xyXG4gICAgICAgICAgICBtbmcuYXR0U1tpXSA9IGF0dFN0cmlkZVtpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbW5nLnVuaUwgPSBuZXcgQXJyYXkodW5pTG9jYXRpb24ubGVuZ3RoKTtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCB1bmlMb2NhdGlvbi5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIG1uZy51bmlMW2ldID0gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24obW5nLnByZywgdW5pTG9jYXRpb25baV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtbmcudW5pVCA9IHVuaVR5cGU7XHJcbiAgICAgICAgbW5nLmxvY2F0aW9uQ2hlY2soYXR0TG9jYXRpb24sIHVuaUxvY2F0aW9uKTtcclxuICAgICAgICByZXR1cm4gbW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44OV44Kh44Kk44Or44GL44KJ44K344Kn44O844OA44Gu44K944O844K544Kz44O844OJ44KS5Y+W5b6X44GX44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdnNQYXRoIC0g6aCC54K544K344Kn44O844OA44Gu44K944O844K544GM6KiY6L+w44GV44KM44Gf44OV44Kh44Kk44Or44Gu44OR44K5XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZnNQYXRoIC0g44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu44K944O844K544GM6KiY6L+w44GV44KM44Gf44OV44Kh44Kk44Or44Gu44OR44K5XHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBhdHRMb2NhdGlvbiAtIGF0dHJpYnV0ZSDlpInmlbDlkI3jga7phY3liJdcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGF0dFN0cmlkZSAtIGF0dHJpYnV0ZSDlpInmlbDjga7jgrnjg4jjg6njgqTjg4njga7phY3liJdcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHVuaUxvY2F0aW9uIC0gdW5pZm9ybSDlpInmlbDlkI3jga7phY3liJdcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHVuaVR5cGUgLSB1bmlmb3JtIOWkieaVsOabtOaWsOODoeOCveODg+ODieOBruWQjeWJjeOCkuekuuOBmeaWh+Wtl+WIlyDigLvkvovvvJonbWF0cml4NGZ2J1xyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSDjgr3jg7zjgrnjgrPjg7zjg4njga7jg63jg7zjg4njgYzlrozkuobjgZfjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgpLnlJ/miJDjgZfjgZ/lvozjgavlkbzjgbDjgozjgovjgrPjg7zjg6vjg5Djg4Pjgq9cclxuICAgICAqIEByZXR1cm4ge1Byb2dyYW1NYW5hZ2VyfSDjg5fjg63jgrDjg6njg6Djg57jg43jg7zjgrjjg6Pjg7zjgq/jg6njgrnjga7jgqTjg7Pjgrnjgr/jg7Pjgrkg4oC744Ot44O844OJ5YmN44Gr44Kk44Oz44K544K/44Oz44K544Gv5oi744KK5YCk44Go44GX44Gm6L+U5Y2044GV44KM44KLXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVByb2dyYW1Gcm9tRmlsZSh2c1BhdGgsIGZzUGF0aCwgYXR0TG9jYXRpb24sIGF0dFN0cmlkZSwgdW5pTG9jYXRpb24sIHVuaVR5cGUsIGNhbGxiYWNrKXtcclxuICAgICAgICBpZih0aGlzLmdsID09IG51bGwpe3JldHVybiBudWxsO31cclxuICAgICAgICBsZXQgbW5nID0gbmV3IFByb2dyYW1NYW5hZ2VyKHRoaXMuZ2wsIHRoaXMuaXNXZWJHTDIpO1xyXG4gICAgICAgIGxldCBzcmMgPSB7XHJcbiAgICAgICAgICAgIHZzOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXRVcmw6IHZzUGF0aCxcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbnVsbFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmczoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0VXJsOiBmc1BhdGgsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG51bGxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgeGhyKHRoaXMuZ2wsIHNyYy52cyk7XHJcbiAgICAgICAgeGhyKHRoaXMuZ2wsIHNyYy5mcyk7XHJcbiAgICAgICAgZnVuY3Rpb24geGhyKGdsLCB0YXJnZXQpe1xyXG4gICAgICAgICAgICBsZXQgeG1sID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgICAgIHhtbC5vcGVuKCdHRVQnLCB0YXJnZXQudGFyZ2V0VXJsLCB0cnVlKTtcclxuICAgICAgICAgICAgeG1sLnNldFJlcXVlc3RIZWFkZXIoJ1ByYWdtYScsICduby1jYWNoZScpO1xyXG4gICAgICAgICAgICB4bWwuc2V0UmVxdWVzdEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICduby1jYWNoZScpO1xyXG4gICAgICAgICAgICB4bWwub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuaXNDb25zb2xlT3V0cHV0ID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnJWPil4YlYyBzaGFkZXIgZmlsZSBsb2FkZWQ6ICVjJyArIHRhcmdldC50YXJnZXRVcmwsICdjb2xvcjogY3JpbXNvbicsICcnLCAnY29sb3I6IGdvbGRlbnJvZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LnNvdXJjZSA9IHhtbC5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgICAgICAgICBsb2FkQ2hlY2soZ2wpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB4bWwuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBsb2FkQ2hlY2soZ2wpe1xyXG4gICAgICAgICAgICBpZihzcmMudnMuc291cmNlID09IG51bGwgfHwgc3JjLmZzLnNvdXJjZSA9PSBudWxsKXtyZXR1cm47fVxyXG4gICAgICAgICAgICBsZXQgaTtcclxuICAgICAgICAgICAgbW5nLnZzID0gbW5nLmNyZWF0ZVNoYWRlckZyb21Tb3VyY2Uoc3JjLnZzLnNvdXJjZSwgZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgICAgIG1uZy5mcyA9IG1uZy5jcmVhdGVTaGFkZXJGcm9tU291cmNlKHNyYy5mcy5zb3VyY2UsIGdsLkZSQUdNRU5UX1NIQURFUik7XHJcbiAgICAgICAgICAgIG1uZy5wcmcgPSBtbmcuY3JlYXRlUHJvZ3JhbShtbmcudnMsIG1uZy5mcyk7XHJcbiAgICAgICAgICAgIGlmKG1uZy5wcmcgPT0gbnVsbCl7cmV0dXJuIG1uZzt9XHJcbiAgICAgICAgICAgIG1uZy5hdHRMID0gbmV3IEFycmF5KGF0dExvY2F0aW9uLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIG1uZy5hdHRTID0gbmV3IEFycmF5KGF0dExvY2F0aW9uLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IGF0dExvY2F0aW9uLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgICAgIG1uZy5hdHRMW2ldID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24obW5nLnByZywgYXR0TG9jYXRpb25baV0pO1xyXG4gICAgICAgICAgICAgICAgbW5nLmF0dFNbaV0gPSBhdHRTdHJpZGVbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbW5nLnVuaUwgPSBuZXcgQXJyYXkodW5pTG9jYXRpb24ubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yKGkgPSAwOyBpIDwgdW5pTG9jYXRpb24ubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICAgICAgbW5nLnVuaUxbaV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24obW5nLnByZywgdW5pTG9jYXRpb25baV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1uZy51bmlUID0gdW5pVHlwZTtcclxuICAgICAgICAgICAgbW5nLmxvY2F0aW9uQ2hlY2soYXR0TG9jYXRpb24sIHVuaUxvY2F0aW9uKTtcclxuICAgICAgICAgICAgY2FsbGJhY2sobW5nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1uZztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODkOODg+ODleOCoeOCquODluOCuOOCp+OCr+ODiOOCkuWJiumZpOOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtXZWJHTEJ1ZmZlcn0gYnVmZmVyIC0g5YmK6Zmk44GZ44KL44OQ44OD44OV44Kh44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKi9cclxuICAgIGRlbGV0ZUJ1ZmZlcihidWZmZXIpe1xyXG4gICAgICAgIGlmKHRoaXMuZ2wuaXNCdWZmZXIoYnVmZmVyKSAhPT0gdHJ1ZSl7cmV0dXJuO31cclxuICAgICAgICB0aGlzLmdsLmRlbGV0ZUJ1ZmZlcihidWZmZXIpO1xyXG4gICAgICAgIGJ1ZmZlciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg4bjgq/jgrnjg4Hjg6Pjgqrjg5bjgrjjgqfjgq/jg4jjgpLliYrpmaTjgZnjgotcclxuICAgICAqIEBwYXJhbSB7V2ViR0xUZXh0dXJlfSB0ZXh0dXJlIC0g5YmK6Zmk44GZ44KL44OG44Kv44K544OB44Oj44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKi9cclxuICAgIGRlbGV0ZVRleHR1cmUodGV4dHVyZSl7XHJcbiAgICAgICAgaWYodGhpcy5nbC5pc1RleHR1cmUodGV4dHVyZSkgIT09IHRydWUpe3JldHVybjt9XHJcbiAgICAgICAgdGhpcy5nbC5kZWxldGVUZXh0dXJlKHRleHR1cmUpO1xyXG4gICAgICAgIHRleHR1cmUgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44OV44Os44O844Og44OQ44OD44OV44Kh44KE44Os44Oz44OA44O844OQ44OD44OV44Kh44KS5YmK6Zmk44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqIC0g44OV44Os44O844Og44OQ44OD44OV44Kh55Sf5oiQ44Oh44K944OD44OJ44GM6L+U44GZ44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKi9cclxuICAgIGRlbGV0ZUZyYW1lYnVmZmVyKG9iail7XHJcbiAgICAgICAgaWYob2JqID09IG51bGwpe3JldHVybjt9XHJcbiAgICAgICAgZm9yKGxldCB2IGluIG9iail7XHJcbiAgICAgICAgICAgIGlmKG9ialt2XSBpbnN0YW5jZW9mIFdlYkdMRnJhbWVidWZmZXIgJiYgdGhpcy5nbC5pc0ZyYW1lYnVmZmVyKG9ialt2XSkgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5kZWxldGVGcmFtZWJ1ZmZlcihvYmpbdl0pO1xyXG4gICAgICAgICAgICAgICAgb2JqW3ZdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKG9ialt2XSBpbnN0YW5jZW9mIFdlYkdMUmVuZGVyYnVmZmVyICYmIHRoaXMuZ2wuaXNSZW5kZXJidWZmZXIob2JqW3ZdKSA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcihvYmpbdl0pO1xyXG4gICAgICAgICAgICAgICAgb2JqW3ZdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKG9ialt2XSBpbnN0YW5jZW9mIFdlYkdMVGV4dHVyZSAmJiB0aGlzLmdsLmlzVGV4dHVyZShvYmpbdl0pID09PSB0cnVlKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wuZGVsZXRlVGV4dHVyZShvYmpbdl0pO1xyXG4gICAgICAgICAgICAgICAgb2JqW3ZdID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBvYmogPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K344Kn44O844OA44Kq44OW44K444Kn44Kv44OI44KS5YmK6Zmk44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMU2hhZGVyfSBzaGFkZXIgLSDjgrfjgqfjg7zjg4Djgqrjg5bjgrjjgqfjgq/jg4hcclxuICAgICAqL1xyXG4gICAgZGVsZXRlU2hhZGVyKHNoYWRlcil7XHJcbiAgICAgICAgaWYodGhpcy5nbC5pc1NoYWRlcihzaGFkZXIpICE9PSB0cnVlKXtyZXR1cm47fVxyXG4gICAgICAgIHRoaXMuZ2wuZGVsZXRlU2hhZGVyKHNoYWRlcik7XHJcbiAgICAgICAgc2hhZGVyID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkuWJiumZpOOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtXZWJHTFByb2dyYW19IHByb2dyYW0gLSDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4hcclxuICAgICAqL1xyXG4gICAgZGVsZXRlUHJvZ3JhbShwcm9ncmFtKXtcclxuICAgICAgICBpZih0aGlzLmdsLmlzUHJvZ3JhbShwcm9ncmFtKSAhPT0gdHJ1ZSl7cmV0dXJuO31cclxuICAgICAgICB0aGlzLmdsLmRlbGV0ZVByb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgcHJvZ3JhbSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm9ncmFtTWFuYWdlciDjgq/jg6njgrnjgpLlhoXpg6jjg5fjg63jg5Hjg4bjgqPjgZTjgajliYrpmaTjgZnjgotcclxuICAgICAqIEBwYXJhbSB7UHJvZ3JhbU1hbmFnZXJ9IHByZyAtIFByb2dyYW1NYW5hZ2VyIOOCr+ODqeOCueOBruOCpOODs+OCueOCv+ODs+OCuVxyXG4gICAgICovXHJcbiAgICBkZWxldGVQcm9ncmFtTWFuYWdlcihwcmcpe1xyXG4gICAgICAgIGlmKHByZyA9PSBudWxsIHx8ICEocHJnIGluc3RhbmNlb2YgUHJvZ3JhbU1hbmFnZXIpKXtyZXR1cm47fVxyXG4gICAgICAgIHRoaXMuZGVsZXRlU2hhZGVyKHByZy52cyk7XHJcbiAgICAgICAgdGhpcy5kZWxldGVTaGFkZXIocHJnLmZzKTtcclxuICAgICAgICB0aGlzLmRlbGV0ZVByb2dyYW0ocHJnLnByZyk7XHJcbiAgICAgICAgcHJnLmF0dEwgPSBudWxsO1xyXG4gICAgICAgIHByZy5hdHRTID0gbnVsbDtcclxuICAgICAgICBwcmcudW5pTCA9IG51bGw7XHJcbiAgICAgICAgcHJnLnVuaVQgPSBudWxsO1xyXG4gICAgICAgIHByZyA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiDjg5fjg63jgrDjg6njg6Djgqrjg5bjgrjjgqfjgq/jg4jjgoTjgrfjgqfjg7zjg4DjgpLnrqHnkIbjgZnjgovjg57jg43jg7zjgrjjg6NcclxuICogQGNsYXNzIFByb2dyYW1NYW5hZ2VyXHJcbiAqL1xyXG5jbGFzcyBQcm9ncmFtTWFuYWdlciB7XHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0g6Ieq6Lqr44GM5bGe44GZ44KLIFdlYkdMIFJlbmRlcmluZyBDb250ZXh0XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2x9IFt3ZWJnbDJNb2RlPWZhbHNlXSAtIHdlYmdsMiDjgpLmnInlirnljJbjgZfjgZ/jgYvjganjgYbjgYtcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZ2wsIHdlYmdsMk1vZGUgPSBmYWxzZSl7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog6Ieq6Lqr44GM5bGe44GZ44KLIFdlYkdMIFJlbmRlcmluZyBDb250ZXh0XHJcbiAgICAgICAgICogQHR5cGUge1dlYkdMUmVuZGVyaW5nQ29udGV4dH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV2ViR0wyUmVuZGVyaW5nQ29udGV4dCDjgajjgZfjgabliJ3mnJ/ljJbjgZfjgZ/jgYvjganjgYbjgYvjgpLooajjgZnnnJ/lgb3lgKRcclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmlzV2ViR0wyID0gd2ViZ2wyTW9kZTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDpoILngrnjgrfjgqfjg7zjg4Djga7jgrfjgqfjg7zjg4Djgqrjg5bjgrjjgqfjgq/jg4hcclxuICAgICAgICAgKiBAdHlwZSB7V2ViR0xTaGFkZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy52cyA9IG51bGw7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44OV44Op44Kw44Oh44Oz44OI44K344Kn44O844OA44Gu44K344Kn44O844OA44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgICAgICogQHR5cGUge1dlYkdMU2hhZGVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZnMgPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiFxyXG4gICAgICAgICAqIEB0eXBlIHtXZWJHTFByb2dyYW19XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5wcmcgPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCouODiOODquODk+ODpeODvOODiOODreOCseODvOOCt+ODp+ODs+OBrumFjeWIl1xyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmF0dEwgPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCouODiOODquODk+ODpeODvOODiOWkieaVsOOBruOCueODiOODqeOCpOODieOBrumFjeWIl1xyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48bnVtYmVyPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmF0dFMgPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOODpuODi+ODleOCqeODvOODoOODreOCseODvOOCt+ODp+ODs+OBrumFjeWIl1xyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48V2ViR0xVbmlmb3JtTG9jYXRpb24+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudW5pTCA9IG51bGw7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Om44OL44OV44Kp44O844Og5aSJ5pWw44Gu44K/44Kk44OX44Gu6YWN5YiXXHJcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxzdHJpbmc+fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudW5pVCA9IG51bGw7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Ko44Op44O86Zai6YCj5oOF5aCx44KS5qC857SN44GZ44KLXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gdnMgLSDpoILngrnjgrfjgqfjg7zjg4Djga7jgrPjg7Pjg5HjgqTjg6vjgqjjg6njg7xcclxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gZnMgLSDjg5Xjg6njgrDjg6Hjg7Pjg4jjgrfjgqfjg7zjg4Djga7jgrPjg7Pjg5HjgqTjg6vjgqjjg6njg7xcclxuICAgICAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gcHJnIC0g44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44Gu44Oq44Oz44Kv44Ko44Op44O8XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5lcnJvciA9IHt2czogbnVsbCwgZnM6IG51bGwsIHByZzogbnVsbH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzY3JpcHQg44K/44Kw44GuIElEIOOCkuWFg+OBq+OCveODvOOCueOCs+ODvOODieOCkuWPluW+l+OBl+OCt+OCp+ODvOODgOOCquODluOCuOOCp+OCr+ODiOOCkueUn+aIkOOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gc2NyaXB0IOOCv+OCsOOBq+S7mOWKoOOBleOCjOOBnyBJRCDmloflrZfliJdcclxuICAgICAqIEByZXR1cm4ge1dlYkdMU2hhZGVyfSDnlJ/miJDjgZfjgZ/jgrfjgqfjg7zjg4Djgqrjg5bjgrjjgqfjgq/jg4hcclxuICAgICAqL1xyXG4gICAgY3JlYXRlU2hhZGVyRnJvbUlkKGlkKXtcclxuICAgICAgICBsZXQgc2hhZGVyO1xyXG4gICAgICAgIGxldCBzY3JpcHRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGlmKCFzY3JpcHRFbGVtZW50KXtyZXR1cm47fVxyXG4gICAgICAgIHN3aXRjaChzY3JpcHRFbGVtZW50LnR5cGUpe1xyXG4gICAgICAgICAgICBjYXNlICd4LXNoYWRlci94LXZlcnRleCc6XHJcbiAgICAgICAgICAgICAgICBzaGFkZXIgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcih0aGlzLmdsLlZFUlRFWF9TSEFERVIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOlxyXG4gICAgICAgICAgICAgICAgc2hhZGVyID0gdGhpcy5nbC5jcmVhdGVTaGFkZXIodGhpcy5nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgc291cmNlID0gc2NyaXB0RWxlbWVudC50ZXh0O1xyXG4gICAgICAgIGlmKHRoaXMuaXNXZWJHTDIgIT09IHRydWUpe1xyXG4gICAgICAgICAgICBpZihzb3VyY2Uuc2VhcmNoKC9eI3ZlcnNpb24gMzAwIGVzLykgPiAtMSl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+KXhiBjYW4gbm90IHVzZSBnbHNsIGVzIDMuMCcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuICAgICAgICBpZih0aGlzLmdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIHRoaXMuZ2wuQ09NUElMRV9TVEFUVVMpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHNoYWRlcjtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgbGV0IGVyciA9IHRoaXMuZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xyXG4gICAgICAgICAgICBpZihzY3JpcHRFbGVtZW50LnR5cGUgPT09ICd4LXNoYWRlci94LXZlcnRleCcpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvci52cyA9IGVycjtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yLmZzID0gZXJyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign4peGIGNvbXBpbGUgZmFpbGVkIG9mIHNoYWRlcjogJyArIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K344Kn44O844OA44Gu44K944O844K544Kz44O844OJ44KS5paH5a2X5YiX44Gn5byV5pWw44GL44KJ5Y+W5b6X44GX44K344Kn44O844OA44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc291cmNlIC0g44K344Kn44O844OA44Gu44K944O844K544Kz44O844OJXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdHlwZSAtIGdsLlZFUlRFWF9TSEFERVIgb3IgZ2wuRlJBR01FTlRfU0hBREVSXHJcbiAgICAgKiBAcmV0dXJuIHtXZWJHTFNoYWRlcn0g55Sf5oiQ44GX44Gf44K344Kn44O844OA44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVNoYWRlckZyb21Tb3VyY2Uoc291cmNlLCB0eXBlKXtcclxuICAgICAgICBsZXQgc2hhZGVyO1xyXG4gICAgICAgIHN3aXRjaCh0eXBlKXtcclxuICAgICAgICAgICAgY2FzZSB0aGlzLmdsLlZFUlRFWF9TSEFERVI6XHJcbiAgICAgICAgICAgICAgICBzaGFkZXIgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcih0aGlzLmdsLlZFUlRFWF9TSEFERVIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgdGhpcy5nbC5GUkFHTUVOVF9TSEFERVI6XHJcbiAgICAgICAgICAgICAgICBzaGFkZXIgPSB0aGlzLmdsLmNyZWF0ZVNoYWRlcih0aGlzLmdsLkZSQUdNRU5UX1NIQURFUik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoaXMuaXNXZWJHTDIgIT09IHRydWUpe1xyXG4gICAgICAgICAgICBpZihzb3VyY2Uuc2VhcmNoKC9eI3ZlcnNpb24gMzAwIGVzLykgPiAtMSl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+KXhiBjYW4gbm90IHVzZSBnbHNsIGVzIDMuMCcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICB0aGlzLmdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuICAgICAgICBpZih0aGlzLmdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIHRoaXMuZ2wuQ09NUElMRV9TVEFUVVMpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHNoYWRlcjtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgbGV0IGVyciA9IHRoaXMuZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xyXG4gICAgICAgICAgICBpZih0eXBlID09PSB0aGlzLmdsLlZFUlRFWF9TSEFERVIpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvci52cyA9IGVycjtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yLmZzID0gZXJyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign4peGIGNvbXBpbGUgZmFpbGVkIG9mIHNoYWRlcjogJyArIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K344Kn44O844OA44Kq44OW44K444Kn44Kv44OI44KS5byV5pWw44GL44KJ5Y+W5b6X44GX44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OI44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMU2hhZGVyfSB2cyAtIOmggueCueOCt+OCp+ODvOODgOOBruOCt+OCp+ODvOODgOOCquODluOCuOOCp+OCr+ODiFxyXG4gICAgICogQHBhcmFtIHtXZWJHTFNoYWRlcn0gZnMgLSDjg5Xjg6njgrDjg6Hjg7Pjg4jjgrfjgqfjg7zjg4Djga7jgrfjgqfjg7zjg4Djgqrjg5bjgrjjgqfjgq/jg4hcclxuICAgICAqIEByZXR1cm4ge1dlYkdMUHJvZ3JhbX0g55Sf5oiQ44GX44Gf44OX44Ot44Kw44Op44Og44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVByb2dyYW0odnMsIGZzKXtcclxuICAgICAgICBpZih2cyA9PSBudWxsIHx8IGZzID09IG51bGwpe3JldHVybiBudWxsO31cclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IHRoaXMuZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKTtcclxuICAgICAgICB0aGlzLmdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcyk7XHJcbiAgICAgICAgdGhpcy5nbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICBpZih0aGlzLmdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgdGhpcy5nbC5MSU5LX1NUQVRVUykpe1xyXG4gICAgICAgICAgICB0aGlzLmdsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgICAgIHJldHVybiBwcm9ncmFtO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBsZXQgZXJyID0gdGhpcy5nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKTtcclxuICAgICAgICAgICAgdGhpcy5lcnJvci5wcmcgPSBlcnI7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybign4peGIGxpbmsgcHJvZ3JhbSBmYWlsZWQ6ICcgKyBlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOiHqui6q+OBruWGhemDqOODl+ODreODkeODhuOCo+OBqOOBl+OBpuWtmOWcqOOBmeOCi+ODl+ODreOCsOODqeODoOOCquODluOCuOOCp+OCr+ODiOOCkuioreWumuOBmeOCi1xyXG4gICAgICovXHJcbiAgICB1c2VQcm9ncmFtKCl7XHJcbiAgICAgICAgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJnKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZCTyDjgaggSUJPIOOCkuODkOOCpOODs+ODieOBl+OBpuacieWKueWMluOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48V2ViR0xCdWZmZXI+fSB2Ym8gLSBWQk8g44KS5qC857SN44GX44Gf6YWN5YiXXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMQnVmZmVyfSBbaWJvXSAtIElCT1xyXG4gICAgICovXHJcbiAgICBzZXRBdHRyaWJ1dGUodmJvLCBpYm8pe1xyXG4gICAgICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgZm9yKGxldCBpIGluIHZibyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYXR0TFtpXSA+PSAwKXtcclxuICAgICAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2Ym9baV0pO1xyXG4gICAgICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5hdHRMW2ldKTtcclxuICAgICAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5hdHRMW2ldLCB0aGlzLmF0dFNbaV0sIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoaWJvICE9IG51bGwpe2dsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGlibyk7fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K344Kn44O844OA44Gr44Om44OL44OV44Kp44O844Og5aSJ5pWw44Gr6Kit5a6a44GZ44KL5YCk44KS44OX44OD44K344Ol44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxtaXhlZD59IG1peGVkIC0g44Om44OL44OV44Kp44O844Og5aSJ5pWw44Gr6Kit5a6a44GZ44KL5YCk44KS5qC857SN44GX44Gf6YWN5YiXXHJcbiAgICAgKi9cclxuICAgIHB1c2hTaGFkZXIobWl4ZWQpe1xyXG4gICAgICAgIGxldCBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgZm9yKGxldCBpID0gMCwgaiA9IHRoaXMudW5pVC5sZW5ndGg7IGkgPCBqOyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgdW5pID0gJ3VuaWZvcm0nICsgdGhpcy51bmlUW2ldLnJlcGxhY2UoL21hdHJpeC9pLCAnTWF0cml4Jyk7XHJcbiAgICAgICAgICAgIGlmKGdsW3VuaV0gIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICBpZih1bmkuc2VhcmNoKC9NYXRyaXgvKSAhPT0gLTEpe1xyXG4gICAgICAgICAgICAgICAgICAgIGdsW3VuaV0odGhpcy51bmlMW2ldLCBmYWxzZSwgbWl4ZWRbaV0pO1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2xbdW5pXSh0aGlzLnVuaUxbaV0sIG1peGVkW2ldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+KXhiBub3Qgc3VwcG9ydCB1bmlmb3JtIHR5cGU6ICcgKyB0aGlzLnVuaVRbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44Ki44OI44Oq44OT44Ol44O844OI44Ot44Kx44O844K344On44Oz44Go44Om44OL44OV44Kp44O844Og44Ot44Kx44O844K344On44Oz44GM5q2j44GX44GP5Y+W5b6X44Gn44GN44Gf44GL44OB44Kn44OD44Kv44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBhdHRMb2NhdGlvbiAtIOWPluW+l+OBl+OBn+OCouODiOODquODk+ODpeODvOODiOODreOCseODvOOCt+ODp+ODs+OBrumFjeWIl1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48V2ViR0xVbmlmb3JtTG9jYXRpb24+fSB1bmlMb2NhdGlvbiAtIOWPluW+l+OBl+OBn+ODpuODi+ODleOCqeODvOODoOODreOCseODvOOCt+ODp+ODs+OBrumFjeWIl1xyXG4gICAgICovXHJcbiAgICBsb2NhdGlvbkNoZWNrKGF0dExvY2F0aW9uLCB1bmlMb2NhdGlvbil7XHJcbiAgICAgICAgbGV0IGksIGw7XHJcbiAgICAgICAgZm9yKGkgPSAwLCBsID0gYXR0TG9jYXRpb24ubGVuZ3RoOyBpIDwgbDsgaSsrKXtcclxuICAgICAgICAgICAgaWYodGhpcy5hdHRMW2ldID09IG51bGwgfHwgdGhpcy5hdHRMW2ldIDwgMCl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+KXhiBpbnZhbGlkIGF0dHJpYnV0ZSBsb2NhdGlvbjogJWNcIicgKyBhdHRMb2NhdGlvbltpXSArICdcIicsICdjb2xvcjogY3JpbXNvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihpID0gMCwgbCA9IHVuaUxvY2F0aW9uLmxlbmd0aDsgaSA8IGw7IGkrKyl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMudW5pTFtpXSA9PSBudWxsIHx8IHRoaXMudW5pTFtpXSA8IDApe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCfil4YgaW52YWxpZCB1bmlmb3JtIGxvY2F0aW9uOiAlY1wiJyArIHVuaUxvY2F0aW9uW2ldICsgJ1wiJywgJ2NvbG9yOiBjcmltc29uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5nbDMgPSB3aW5kb3cuZ2wzIHx8IG5ldyBnbDMoKTtcclxuXHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2dsM0NvcmUuanMiLCJcclxuLyoqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHN0ZXAgMTogbGV0IGEgPSBuZXcgZ2wzQXVkaW8oYmdtR2FpblZhbHVlLCBzb3VuZEdhaW5WYWx1ZSkgPC0gZmxvYXQoMC4wIHRvIDEuMClcclxuICogc3RlcCAyOiBhLmxvYWQodXJsLCBpbmRleCwgbG9vcCwgYmFja2dyb3VuZCkgPC0gc3RyaW5nLCBpbnQsIGJvb2xlYW4sIGJvb2xlYW5cclxuICogc3RlcCAzOiBhLnNyY1tpbmRleF0ubG9hZGVkIHRoZW4gYS5zcmNbaW5kZXhdLnBsYXkoKVxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBnbDNBdWRpb1xyXG4gKiBAY2xhc3MgZ2wzQXVkaW9cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGdsM0F1ZGlvIHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYmdtR2FpblZhbHVlIC0gQkdNIOOBruWGjeeUn+mfs+mHj1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNvdW5kR2FpblZhbHVlIC0g5Yq55p6c6Z+z44Gu5YaN55Sf6Z+z6YePXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGJnbUdhaW5WYWx1ZSwgc291bmRHYWluVmFsdWUpe1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCquODvOODh+OCo+OCquOCs+ODs+ODhuOCreOCueODiFxyXG4gICAgICAgICAqIEB0eXBlIHtBdWRpb0NvbnRleHR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jdHggPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOODgOOCpOODiuODn+ODg+OCr+OCs+ODs+ODl+ODrOODg+OCteODvOODjuODvOODiVxyXG4gICAgICAgICAqIEB0eXBlIHtEeW5hbWljc0NvbXByZXNzb3JOb2RlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY29tcCA9IG51bGw7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQkdNIOeUqOOBruOCsuOCpOODs+ODjuODvOODiVxyXG4gICAgICAgICAqIEB0eXBlIHtHYWluTm9kZX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmJnbUdhaW4gPSBudWxsO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOWKueaenOmfs+eUqOOBruOCsuOCpOODs+ODjuODvOODiVxyXG4gICAgICAgICAqIEB0eXBlIHtHYWluTm9kZX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnNvdW5kR2FpbiA9IG51bGw7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Kq44O844OH44Kj44Kq44K944O844K544KS44Op44OD44OX44GX44Gf44Kv44Op44K544Gu6YWN5YiXXHJcbiAgICAgICAgICogQHR5cGUge0FycmF5LjxBdWRpb1NyYz59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zcmMgPSBudWxsO1xyXG4gICAgICAgIGlmKFxyXG4gICAgICAgICAgICB0eXBlb2YgQXVkaW9Db250ZXh0ICE9ICd1bmRlZmluZWQnIHx8XHJcbiAgICAgICAgICAgIHR5cGVvZiB3ZWJraXRBdWRpb0NvbnRleHQgIT0gJ3VuZGVmaW5lZCdcclxuICAgICAgICApe1xyXG4gICAgICAgICAgICBpZih0eXBlb2YgQXVkaW9Db250ZXh0ICE9ICd1bmRlZmluZWQnKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4ID0gbmV3IHdlYmtpdEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY29tcCA9IHRoaXMuY3R4LmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXAuY29ubmVjdCh0aGlzLmN0eC5kZXN0aW5hdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuYmdtR2FpbiA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcclxuICAgICAgICAgICAgdGhpcy5iZ21HYWluLmNvbm5lY3QodGhpcy5jb21wKTtcclxuICAgICAgICAgICAgdGhpcy5iZ21HYWluLmdhaW4uc2V0VmFsdWVBdFRpbWUoYmdtR2FpblZhbHVlLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5zb3VuZEdhaW4gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc291bmRHYWluLmNvbm5lY3QodGhpcy5jb21wKTtcclxuICAgICAgICAgICAgdGhpcy5zb3VuZEdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZShzb3VuZEdhaW5WYWx1ZSwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3JjID0gW107XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGZvdW5kIEF1ZGlvQ29udGV4dCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODleOCoeOCpOODq+OCkuODreODvOODieOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSDjgqrjg7zjg4fjgqPjgqrjg5XjgqHjgqTjg6vjga7jg5HjgrlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIOWGhemDqOODl+ODreODkeODhuOCo+OBrumFjeWIl+OBq+agvOe0jeOBmeOCi+OCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBsb29wIC0g44Or44O844OX5YaN55Sf44KS6Kit5a6a44GZ44KL44GL44Gp44GG44GLXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGJhY2tncm91bmQgLSBCR00g44Go44GX44Gm6Kit5a6a44GZ44KL44GL44Gp44GG44GLXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIOiqreOBv+i+vOOBv+OBqOWIneacn+WMluOBjOWujOS6huOBl+OBn+OBguOBqOWRvOOBsOOCjOOCi+OCs+ODvOODq+ODkOODg+OCr1xyXG4gICAgICovXHJcbiAgICBsb2FkKHBhdGgsIGluZGV4LCBsb29wLCBiYWNrZ3JvdW5kLCBjYWxsYmFjayl7XHJcbiAgICAgICAgbGV0IGN0eCA9IHRoaXMuY3R4O1xyXG4gICAgICAgIGxldCBnYWluID0gYmFja2dyb3VuZCA/IHRoaXMuYmdtR2FpbiA6IHRoaXMuc291bmRHYWluO1xyXG4gICAgICAgIGxldCBzcmMgPSB0aGlzLnNyYztcclxuICAgICAgICBzcmNbaW5kZXhdID0gbnVsbDtcclxuICAgICAgICBsZXQgeG1sID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgeG1sLm9wZW4oJ0dFVCcsIHBhdGgsIHRydWUpO1xyXG4gICAgICAgIHhtbC5zZXRSZXF1ZXN0SGVhZGVyKCdQcmFnbWEnLCAnbm8tY2FjaGUnKTtcclxuICAgICAgICB4bWwuc2V0UmVxdWVzdEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICduby1jYWNoZScpO1xyXG4gICAgICAgIHhtbC5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xyXG4gICAgICAgIHhtbC5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGN0eC5kZWNvZGVBdWRpb0RhdGEoeG1sLnJlc3BvbnNlLCAoYnVmKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzcmNbaW5kZXhdID0gbmV3IEF1ZGlvU3JjKGN0eCwgZ2FpbiwgYnVmLCBsb29wLCBiYWNrZ3JvdW5kKTtcclxuICAgICAgICAgICAgICAgIHNyY1tpbmRleF0ubG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KXhiVjIGF1ZGlvIG51bWJlcjogJWMnICsgaW5kZXggKyAnJWMsIGF1ZGlvIGxvYWRlZDogJWMnICsgcGF0aCwgJ2NvbG9yOiBjcmltc29uJywgJycsICdjb2xvcjogYmx1ZScsICcnLCAnY29sb3I6IGdvbGRlbnJvZCcpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSwgKGUpID0+IHtjb25zb2xlLmxvZyhlKTt9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHhtbC5zZW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg63jg7zjg4njga7lrozkuobjgpLjg4Hjgqfjg4Pjgq/jgZnjgotcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IOODreODvOODieOBjOWujOS6huOBl+OBpuOBhOOCi+OBi+OBqeOBhuOBi1xyXG4gICAgICovXHJcbiAgICBsb2FkQ29tcGxldGUoKXtcclxuICAgICAgICBsZXQgaSwgZjtcclxuICAgICAgICBmID0gdHJ1ZTtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCB0aGlzLnNyYy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGYgPSBmICYmICh0aGlzLnNyY1tpXSAhPSBudWxsKSAmJiB0aGlzLnNyY1tpXS5sb2FkZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICog44Kq44O844OH44Kj44Kq44KE44K944O844K544OV44Kh44Kk44Or44KS566h55CG44GZ44KL44Gf44KB44Gu44Kv44Op44K5XHJcbiAqIEBjbGFzcyBBdWRpb1NyY1xyXG4gKi9cclxuY2xhc3MgQXVkaW9TcmMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqIEBwYXJhbSB7QXVkaW9Db250ZXh0fSBjdHggLSDlr77osaHjgajjgarjgovjgqrjg7zjg4fjgqPjgqrjgrPjg7Pjg4bjgq3jgrnjg4hcclxuICAgICAqIEBwYXJhbSB7R2Fpbk5vZGV9IGdhaW4gLSDlr77osaHjgajjgarjgovjgrLjgqTjg7Pjg47jg7zjg4lcclxuICAgICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGF1ZGlvQnVmZmVyIC0g44OQ44Kk44OK44Oq44Gu44Kq44O844OH44Kj44Kq44K944O844K5XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGJvb2wgLSDjg6vjg7zjg5flho3nlJ/jgpLoqK3lrprjgZnjgovjgYvjganjgYbjgYtcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gYmFja2dyb3VuZCAtIEJHTSDjgajjgZfjgaboqK3lrprjgZnjgovjgYvjganjgYbjgYtcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY3R4LCBnYWluLCBhdWRpb0J1ZmZlciwgbG9vcCwgYmFja2dyb3VuZCl7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5a++6LGh44Go44Gq44KL44Kq44O844OH44Kj44Kq44Kz44Oz44OG44Kt44K544OIXHJcbiAgICAgICAgICogQHR5cGUge0F1ZGlvQ29udGV4dH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmN0eCA9IGN0eDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlr77osaHjgajjgarjgovjgrLjgqTjg7Pjg47jg7zjg4lcclxuICAgICAgICAgKiBAdHlwZSB7R2Fpbk5vZGV9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5nYWluID0gZ2FpbjtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDjgr3jg7zjgrnjg5XjgqHjgqTjg6vjga7jg5DjgqTjg4rjg6rjg4fjg7zjgr9cclxuICAgICAgICAgKiBAdHlwZSB7QXJyYXlCdWZmZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5hdWRpb0J1ZmZlciA9IGF1ZGlvQnVmZmVyO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCquODvOODh+OCo+OCquODkOODg+ODleOCoeOCveODvOOCueODjuODvOODieOCkuagvOe0jeOBmeOCi+mFjeWIl1xyXG4gICAgICAgICAqIEB0eXBlIHtBcnJheS48QXVkaW9CdWZmZXJTb3VyY2VOb2RlPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZSA9IFtdO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCouOCr+ODhuOCo+ODluOBquODkOODg+ODleOCoeOCveODvOOCueOBruOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5hY3RpdmVCdWZmZXJTb3VyY2UgPSAwO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOODq+ODvOODl+OBmeOCi+OBi+OBqeOBhuOBi+OBruODleODqeOCsFxyXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubG9vcCA9IGxvb3A7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Ot44O844OJ5riI44G/44GL44Gp44GG44GL44KS56S644GZ44OV44Op44KwXHJcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGRlQg44K144Kk44K6XHJcbiAgICAgICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZmdExvb3AgPSAxNjtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDjgZPjga7jg5Xjg6njgrDjgYznq4vjgaPjgabjgYTjgovloLTlkIjlho3nlJ/kuK3jga7jg4fjg7zjgr/jgpLkuIDluqblj5blvpfjgZnjgotcclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnVwZGF0ZSA9IGZhbHNlO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEJHTSDjgYvjganjgYbjgYvjgpLnpLrjgZnjg5Xjg6njgrBcclxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBiYWNrZ3JvdW5kO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCueOCr+ODquODl+ODiOODl+ODreOCu+ODg+OCteODvOODjuODvOODiVxyXG4gICAgICAgICAqIEB0eXBlIHtTY3JpcHRQcm9jZXNzb3JOb2RlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubm9kZSA9IHRoaXMuY3R4LmNyZWF0ZVNjcmlwdFByb2Nlc3NvcigyMDQ4LCAxLCAxKTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDjgqLjg4rjg6njgqTjgrbjg47jg7zjg4lcclxuICAgICAgICAgKiBAdHlwZSB7QW5hbHlzZXJOb2RlfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuYW5hbHlzZXIgPSB0aGlzLmN0eC5jcmVhdGVBbmFseXNlcigpO1xyXG4gICAgICAgIHRoaXMuYW5hbHlzZXIuc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMC44O1xyXG4gICAgICAgIHRoaXMuYW5hbHlzZXIuZmZ0U2l6ZSA9IHRoaXMuZmZ0TG9vcCAqIDI7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44OH44O844K/44KS5Y+W5b6X44GZ44KL6Zqb44Gr5Yip55So44GZ44KL5Z6L5LuY44GN6YWN5YiXXHJcbiAgICAgICAgICogQHR5cGUge1VpbnQ4QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5vbkRhdGEgPSBuZXcgVWludDhBcnJheSh0aGlzLmFuYWx5c2VyLmZyZXF1ZW5jeUJpbkNvdW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOOCquODvOODh+OCo+OCquOCkuWGjeeUn+OBmeOCi1xyXG4gICAgICovXHJcbiAgICBwbGF5KCl7XHJcbiAgICAgICAgbGV0IGksIGosIGs7XHJcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGkgPSB0aGlzLmJ1ZmZlclNvdXJjZS5sZW5ndGg7XHJcbiAgICAgICAgayA9IC0xO1xyXG4gICAgICAgIGlmKGkgPiAwKXtcclxuICAgICAgICAgICAgZm9yKGogPSAwOyBqIDwgaTsgaisrKXtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLmJ1ZmZlclNvdXJjZVtqXS5wbGF5bm93KXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZVtqXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5idWZmZXJTb3VyY2Vbal0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBrID0gajtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihrIDwgMCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZVt0aGlzLmJ1ZmZlclNvdXJjZS5sZW5ndGhdID0gdGhpcy5jdHguY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgICAgICAgICAgICAgICBrID0gdGhpcy5idWZmZXJTb3VyY2UubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZVswXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgICAgICAgICBrID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmVCdWZmZXJTb3VyY2UgPSBrO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlW2tdLmJ1ZmZlciA9IHRoaXMuYXVkaW9CdWZmZXI7XHJcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2Vba10ubG9vcCA9IHRoaXMubG9vcDtcclxuICAgICAgICB0aGlzLmJ1ZmZlclNvdXJjZVtrXS5wbGF5YmFja1JhdGUudmFsdWUgPSAxLjA7XHJcbiAgICAgICAgaWYoIXRoaXMubG9vcCl7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyU291cmNlW2tdLm9uZW5kZWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlub3cgPSBmYWxzZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5iYWNrZ3JvdW5kKXtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJTb3VyY2Vba10uY29ubmVjdCh0aGlzLmFuYWx5c2VyKTtcclxuICAgICAgICAgICAgdGhpcy5hbmFseXNlci5jb25uZWN0KHRoaXMubm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMubm9kZS5jb25uZWN0KHRoaXMuY3R4LmRlc3RpbmF0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5ub2RlLm9uYXVkaW9wcm9jZXNzID0gKGV2ZSkgPT4ge29ucHJvY2Vzc0V2ZW50KGV2ZSk7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idWZmZXJTb3VyY2Vba10uY29ubmVjdCh0aGlzLmdhaW4pO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlW2tdLnN0YXJ0KDApO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlW2tdLnBsYXlub3cgPSB0cnVlO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBvbnByb2Nlc3NFdmVudChldmUpe1xyXG4gICAgICAgICAgICBpZihzZWxmLnVwZGF0ZSl7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hbmFseXNlci5nZXRCeXRlRnJlcXVlbmN5RGF0YShzZWxmLm9uRGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjgqrjg7zjg4fjgqPjgqrjga7lho3nlJ/jgpLmraLjgoHjgotcclxuICAgICAqL1xyXG4gICAgc3RvcCgpe1xyXG4gICAgICAgIHRoaXMuYnVmZmVyU291cmNlW3RoaXMuYWN0aXZlQnVmZmVyU291cmNlXS5zdG9wKDApO1xyXG4gICAgICAgIHRoaXMucGxheW5vdyA9IGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9nbDNBdWRpby5qcyIsIlxyXG4vKipcclxuICogZ2wzTWF0aFxyXG4gKiBAY2xhc3MgZ2wzTWF0aFxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZ2wzTWF0aCB7XHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE1hdDRcclxuICAgICAgICAgKiBAdHlwZSB7TWF0NH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLk1hdDQgPSBNYXQ0O1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFZlYzNcclxuICAgICAgICAgKiBAdHlwZSB7VmVjM31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLlZlYzMgPSBWZWMzO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFZlYzJcclxuICAgICAgICAgKiBAdHlwZSB7VmVjMn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLlZlYzIgPSBWZWMyO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFF0blxyXG4gICAgICAgICAqIEB0eXBlIHtRdG59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5RdG4gID0gUXRuO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogTWF0NFxyXG4gKiBAY2xhc3MgTWF0NFxyXG4gKi9cclxuY2xhc3MgTWF0NCB7XHJcbiAgICAvKipcclxuICAgICAqIDR4NCDjga7mraPmlrnooYzliJfjgpLnlJ/miJDjgZnjgotcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0g6KGM5YiX5qC857SN55So44Gu6YWN5YiXXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcmVhdGUoKXtcclxuICAgICAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheSgxNik7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOihjOWIl+OCkuWNmOS9jeWMluOBmeOCi++8iOWPgueFp+OBq+azqOaEj++8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBkZXN0IC0g5Y2Y5L2N5YyW44GZ44KL6KGM5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSDljZjkvY3ljJbjgZfjgZ/ooYzliJdcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGlkZW50aXR5KGRlc3Qpe1xyXG4gICAgICAgIGRlc3RbMF0gID0gMTsgZGVzdFsxXSAgPSAwOyBkZXN0WzJdICA9IDA7IGRlc3RbM10gID0gMDtcclxuICAgICAgICBkZXN0WzRdICA9IDA7IGRlc3RbNV0gID0gMTsgZGVzdFs2XSAgPSAwOyBkZXN0WzddICA9IDA7XHJcbiAgICAgICAgZGVzdFs4XSAgPSAwOyBkZXN0WzldICA9IDA7IGRlc3RbMTBdID0gMTsgZGVzdFsxMV0gPSAwO1xyXG4gICAgICAgIGRlc3RbMTJdID0gMDsgZGVzdFsxM10gPSAwOyBkZXN0WzE0XSA9IDA7IGRlc3RbMTVdID0gMTtcclxuICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6KGM5YiX44KS5LmX566X44GZ44KL77yI5Y+C54Wn44Gr5rOo5oSP44O75oi744KK5YCk44Go44GX44Gm44KC57WQ5p6c44KS6L+U44GZ77yJXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IG1hdDAgLSDkuZfnrpfjgZXjgozjgovooYzliJdcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gbWF0MSAtIOS5l+eul+OBmeOCi+ihjOWIl1xyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBbZGVzdF0gLSDkuZfnrpfntZDmnpzjgpLmoLzntI3jgZnjgovooYzliJdcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheS48TWF0ND59IOS5l+eul+e1kOaenOOBruihjOWIl1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbXVsdGlwbHkobWF0MCwgbWF0MSwgZGVzdCl7XHJcbiAgICAgICAgbGV0IG91dCA9IGRlc3Q7XHJcbiAgICAgICAgaWYoZGVzdCA9PSBudWxsKXtvdXQgPSBNYXQ0LmNyZWF0ZSgpfVxyXG4gICAgICAgIGxldCBhID0gbWF0MFswXSwgIGIgPSBtYXQwWzFdLCAgYyA9IG1hdDBbMl0sICBkID0gbWF0MFszXSxcclxuICAgICAgICAgICAgZSA9IG1hdDBbNF0sICBmID0gbWF0MFs1XSwgIGcgPSBtYXQwWzZdLCAgaCA9IG1hdDBbN10sXHJcbiAgICAgICAgICAgIGkgPSBtYXQwWzhdLCAgaiA9IG1hdDBbOV0sICBrID0gbWF0MFsxMF0sIGwgPSBtYXQwWzExXSxcclxuICAgICAgICAgICAgbSA9IG1hdDBbMTJdLCBuID0gbWF0MFsxM10sIG8gPSBtYXQwWzE0XSwgcCA9IG1hdDBbMTVdLFxyXG4gICAgICAgICAgICBBID0gbWF0MVswXSwgIEIgPSBtYXQxWzFdLCAgQyA9IG1hdDFbMl0sICBEID0gbWF0MVszXSxcclxuICAgICAgICAgICAgRSA9IG1hdDFbNF0sICBGID0gbWF0MVs1XSwgIEcgPSBtYXQxWzZdLCAgSCA9IG1hdDFbN10sXHJcbiAgICAgICAgICAgIEkgPSBtYXQxWzhdLCAgSiA9IG1hdDFbOV0sICBLID0gbWF0MVsxMF0sIEwgPSBtYXQxWzExXSxcclxuICAgICAgICAgICAgTSA9IG1hdDFbMTJdLCBOID0gbWF0MVsxM10sIE8gPSBtYXQxWzE0XSwgUCA9IG1hdDFbMTVdO1xyXG4gICAgICAgIG91dFswXSAgPSBBICogYSArIEIgKiBlICsgQyAqIGkgKyBEICogbTtcclxuICAgICAgICBvdXRbMV0gID0gQSAqIGIgKyBCICogZiArIEMgKiBqICsgRCAqIG47XHJcbiAgICAgICAgb3V0WzJdICA9IEEgKiBjICsgQiAqIGcgKyBDICogayArIEQgKiBvO1xyXG4gICAgICAgIG91dFszXSAgPSBBICogZCArIEIgKiBoICsgQyAqIGwgKyBEICogcDtcclxuICAgICAgICBvdXRbNF0gID0gRSAqIGEgKyBGICogZSArIEcgKiBpICsgSCAqIG07XHJcbiAgICAgICAgb3V0WzVdICA9IEUgKiBiICsgRiAqIGYgKyBHICogaiArIEggKiBuO1xyXG4gICAgICAgIG91dFs2XSAgPSBFICogYyArIEYgKiBnICsgRyAqIGsgKyBIICogbztcclxuICAgICAgICBvdXRbN10gID0gRSAqIGQgKyBGICogaCArIEcgKiBsICsgSCAqIHA7XHJcbiAgICAgICAgb3V0WzhdICA9IEkgKiBhICsgSiAqIGUgKyBLICogaSArIEwgKiBtO1xyXG4gICAgICAgIG91dFs5XSAgPSBJICogYiArIEogKiBmICsgSyAqIGogKyBMICogbjtcclxuICAgICAgICBvdXRbMTBdID0gSSAqIGMgKyBKICogZyArIEsgKiBrICsgTCAqIG87XHJcbiAgICAgICAgb3V0WzExXSA9IEkgKiBkICsgSiAqIGggKyBLICogbCArIEwgKiBwO1xyXG4gICAgICAgIG91dFsxMl0gPSBNICogYSArIE4gKiBlICsgTyAqIGkgKyBQICogbTtcclxuICAgICAgICBvdXRbMTNdID0gTSAqIGIgKyBOICogZiArIE8gKiBqICsgUCAqIG47XHJcbiAgICAgICAgb3V0WzE0XSA9IE0gKiBjICsgTiAqIGcgKyBPICogayArIFAgKiBvO1xyXG4gICAgICAgIG91dFsxNV0gPSBNICogZCArIE4gKiBoICsgTyAqIGwgKyBQICogcDtcclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDooYzliJfjgavmi6HlpKfnuK7lsI/jgpLpgannlKjjgZnjgovvvIjlj4Lnhafjgavms6jmhI/jg7vmiLvjgorlgKTjgajjgZfjgabjgoLntZDmnpzjgpLov5TjgZnvvIlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gbWF0IC0g6YGp55So44KS5Y+X44GR44KL6KGM5YiXXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IHZlYyAtIFhZWiDjga7lkITou7jjgavlr77jgZfjgabmi6HnuK7jgpLpgannlKjjgZnjgovlgKTjga7ooYzliJdcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gW2Rlc3RdIC0g57WQ5p6c44KS5qC857SN44GZ44KL6KGM5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSDntZDmnpzjga7ooYzliJdcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHNjYWxlKG1hdCwgdmVjLCBkZXN0KXtcclxuICAgICAgICBsZXQgb3V0ID0gZGVzdDtcclxuICAgICAgICBpZihkZXN0ID09IG51bGwpe291dCA9IE1hdDQuY3JlYXRlKCl9XHJcbiAgICAgICAgb3V0WzBdICA9IG1hdFswXSAgKiB2ZWNbMF07XHJcbiAgICAgICAgb3V0WzFdICA9IG1hdFsxXSAgKiB2ZWNbMF07XHJcbiAgICAgICAgb3V0WzJdICA9IG1hdFsyXSAgKiB2ZWNbMF07XHJcbiAgICAgICAgb3V0WzNdICA9IG1hdFszXSAgKiB2ZWNbMF07XHJcbiAgICAgICAgb3V0WzRdICA9IG1hdFs0XSAgKiB2ZWNbMV07XHJcbiAgICAgICAgb3V0WzVdICA9IG1hdFs1XSAgKiB2ZWNbMV07XHJcbiAgICAgICAgb3V0WzZdICA9IG1hdFs2XSAgKiB2ZWNbMV07XHJcbiAgICAgICAgb3V0WzddICA9IG1hdFs3XSAgKiB2ZWNbMV07XHJcbiAgICAgICAgb3V0WzhdICA9IG1hdFs4XSAgKiB2ZWNbMl07XHJcbiAgICAgICAgb3V0WzldICA9IG1hdFs5XSAgKiB2ZWNbMl07XHJcbiAgICAgICAgb3V0WzEwXSA9IG1hdFsxMF0gKiB2ZWNbMl07XHJcbiAgICAgICAgb3V0WzExXSA9IG1hdFsxMV0gKiB2ZWNbMl07XHJcbiAgICAgICAgb3V0WzEyXSA9IG1hdFsxMl07XHJcbiAgICAgICAgb3V0WzEzXSA9IG1hdFsxM107XHJcbiAgICAgICAgb3V0WzE0XSA9IG1hdFsxNF07XHJcbiAgICAgICAgb3V0WzE1XSA9IG1hdFsxNV07XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6KGM5YiX44Gr5bmz6KGM56e75YuV44KS6YGp55So44GZ44KL77yI5Y+C54Wn44Gr5rOo5oSP44O75oi744KK5YCk44Go44GX44Gm44KC57WQ5p6c44KS6L+U44GZ77yJXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IG1hdCAtIOmBqeeUqOOCkuWPl+OBkeOCi+ihjOWIl1xyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSB2ZWMgLSBYWVog44Gu5ZCE6Lu444Gr5a++44GX44Gm5bmz6KGM56e75YuV44KS6YGp55So44GZ44KL5YCk44Gu6KGM5YiXXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IFtkZXN0XSAtIOe1kOaenOOCkuagvOe0jeOBmeOCi+ihjOWIl1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0g57WQ5p6c44Gu6KGM5YiXXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB0cmFuc2xhdGUobWF0LCB2ZWMsIGRlc3Qpe1xyXG4gICAgICAgIGxldCBvdXQgPSBkZXN0O1xyXG4gICAgICAgIGlmKGRlc3QgPT0gbnVsbCl7b3V0ID0gTWF0NC5jcmVhdGUoKX1cclxuICAgICAgICBvdXRbMF0gPSBtYXRbMF07IG91dFsxXSA9IG1hdFsxXTsgb3V0WzJdICA9IG1hdFsyXTsgIG91dFszXSAgPSBtYXRbM107XHJcbiAgICAgICAgb3V0WzRdID0gbWF0WzRdOyBvdXRbNV0gPSBtYXRbNV07IG91dFs2XSAgPSBtYXRbNl07ICBvdXRbN10gID0gbWF0WzddO1xyXG4gICAgICAgIG91dFs4XSA9IG1hdFs4XTsgb3V0WzldID0gbWF0WzldOyBvdXRbMTBdID0gbWF0WzEwXTsgb3V0WzExXSA9IG1hdFsxMV07XHJcbiAgICAgICAgb3V0WzEyXSA9IG1hdFswXSAqIHZlY1swXSArIG1hdFs0XSAqIHZlY1sxXSArIG1hdFs4XSAgKiB2ZWNbMl0gKyBtYXRbMTJdO1xyXG4gICAgICAgIG91dFsxM10gPSBtYXRbMV0gKiB2ZWNbMF0gKyBtYXRbNV0gKiB2ZWNbMV0gKyBtYXRbOV0gICogdmVjWzJdICsgbWF0WzEzXTtcclxuICAgICAgICBvdXRbMTRdID0gbWF0WzJdICogdmVjWzBdICsgbWF0WzZdICogdmVjWzFdICsgbWF0WzEwXSAqIHZlY1syXSArIG1hdFsxNF07XHJcbiAgICAgICAgb3V0WzE1XSA9IG1hdFszXSAqIHZlY1swXSArIG1hdFs3XSAqIHZlY1sxXSArIG1hdFsxMV0gKiB2ZWNbMl0gKyBtYXRbMTVdO1xyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOihjOWIl+OBq+Wbnui7ouOCkumBqeeUqOOBmeOCi++8iOWPgueFp+OBq+azqOaEj+ODu+aIu+OCiuWApOOBqOOBl+OBpuOCgue1kOaenOOCkui/lOOBme+8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBtYXQgLSDpgannlKjjgpLlj5fjgZHjgovooYzliJdcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIOWbnui7oumHj+OCkuihqOOBmeWApO+8iOODqeOCuOOCouODs++8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSBheGlzIC0g5Zue6Lui44Gu6Lu4XHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IFtkZXN0XSAtIOe1kOaenOOCkuagvOe0jeOBmeOCi+ihjOWIl1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0g57WQ5p6c44Gu6KGM5YiXXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyByb3RhdGUobWF0LCBhbmdsZSwgYXhpcywgZGVzdCl7XHJcbiAgICAgICAgbGV0IG91dCA9IGRlc3Q7XHJcbiAgICAgICAgaWYoZGVzdCA9PSBudWxsKXtvdXQgPSBNYXQ0LmNyZWF0ZSgpfVxyXG4gICAgICAgIGxldCBzcSA9IE1hdGguc3FydChheGlzWzBdICogYXhpc1swXSArIGF4aXNbMV0gKiBheGlzWzFdICsgYXhpc1syXSAqIGF4aXNbMl0pO1xyXG4gICAgICAgIGlmKCFzcSl7cmV0dXJuIG51bGw7fVxyXG4gICAgICAgIGxldCBhID0gYXhpc1swXSwgYiA9IGF4aXNbMV0sIGMgPSBheGlzWzJdO1xyXG4gICAgICAgIGlmKHNxICE9IDEpe3NxID0gMSAvIHNxOyBhICo9IHNxOyBiICo9IHNxOyBjICo9IHNxO31cclxuICAgICAgICBsZXQgZCA9IE1hdGguc2luKGFuZ2xlKSwgZSA9IE1hdGguY29zKGFuZ2xlKSwgZiA9IDEgLSBlLFxyXG4gICAgICAgICAgICBnID0gbWF0WzBdLCAgaCA9IG1hdFsxXSwgaSA9IG1hdFsyXSwgIGogPSBtYXRbM10sXHJcbiAgICAgICAgICAgIGsgPSBtYXRbNF0sICBsID0gbWF0WzVdLCBtID0gbWF0WzZdLCAgbiA9IG1hdFs3XSxcclxuICAgICAgICAgICAgbyA9IG1hdFs4XSwgIHAgPSBtYXRbOV0sIHEgPSBtYXRbMTBdLCByID0gbWF0WzExXSxcclxuICAgICAgICAgICAgcyA9IGEgKiBhICogZiArIGUsXHJcbiAgICAgICAgICAgIHQgPSBiICogYSAqIGYgKyBjICogZCxcclxuICAgICAgICAgICAgdSA9IGMgKiBhICogZiAtIGIgKiBkLFxyXG4gICAgICAgICAgICB2ID0gYSAqIGIgKiBmIC0gYyAqIGQsXHJcbiAgICAgICAgICAgIHcgPSBiICogYiAqIGYgKyBlLFxyXG4gICAgICAgICAgICB4ID0gYyAqIGIgKiBmICsgYSAqIGQsXHJcbiAgICAgICAgICAgIHkgPSBhICogYyAqIGYgKyBiICogZCxcclxuICAgICAgICAgICAgeiA9IGIgKiBjICogZiAtIGEgKiBkLFxyXG4gICAgICAgICAgICBBID0gYyAqIGMgKiBmICsgZTtcclxuICAgICAgICBpZihhbmdsZSl7XHJcbiAgICAgICAgICAgIGlmKG1hdCAhPSBvdXQpe1xyXG4gICAgICAgICAgICAgICAgb3V0WzEyXSA9IG1hdFsxMl07IG91dFsxM10gPSBtYXRbMTNdO1xyXG4gICAgICAgICAgICAgICAgb3V0WzE0XSA9IG1hdFsxNF07IG91dFsxNV0gPSBtYXRbMTVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3V0ID0gbWF0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBvdXRbMF0gID0gZyAqIHMgKyBrICogdCArIG8gKiB1O1xyXG4gICAgICAgIG91dFsxXSAgPSBoICogcyArIGwgKiB0ICsgcCAqIHU7XHJcbiAgICAgICAgb3V0WzJdICA9IGkgKiBzICsgbSAqIHQgKyBxICogdTtcclxuICAgICAgICBvdXRbM10gID0gaiAqIHMgKyBuICogdCArIHIgKiB1O1xyXG4gICAgICAgIG91dFs0XSAgPSBnICogdiArIGsgKiB3ICsgbyAqIHg7XHJcbiAgICAgICAgb3V0WzVdICA9IGggKiB2ICsgbCAqIHcgKyBwICogeDtcclxuICAgICAgICBvdXRbNl0gID0gaSAqIHYgKyBtICogdyArIHEgKiB4O1xyXG4gICAgICAgIG91dFs3XSAgPSBqICogdiArIG4gKiB3ICsgciAqIHg7XHJcbiAgICAgICAgb3V0WzhdICA9IGcgKiB5ICsgayAqIHogKyBvICogQTtcclxuICAgICAgICBvdXRbOV0gID0gaCAqIHkgKyBsICogeiArIHAgKiBBO1xyXG4gICAgICAgIG91dFsxMF0gPSBpICogeSArIG0gKiB6ICsgcSAqIEE7XHJcbiAgICAgICAgb3V0WzExXSA9IGogKiB5ICsgbiAqIHogKyByICogQTtcclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5Pjg6Xjg7zluqfmqJnlpInmj5vooYzliJfjgpLnlJ/miJDjgZnjgovvvIjlj4Lnhafjgavms6jmhI/jg7vmiLvjgorlgKTjgajjgZfjgabjgoLntZDmnpzjgpLov5TjgZnvvIlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gZXllIC0g6KaW54K55L2N572uXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IGNlbnRlciAtIOazqOimlueCuVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSB1cCAtIOS4iuaWueWQkeOCkuekuuOBmeODmeOCr+ODiOODq1xyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBbZGVzdF0gLSDntZDmnpzjgpLmoLzntI3jgZnjgovooYzliJdcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheS48TWF0ND59IOe1kOaenOOBruihjOWIl1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbG9va0F0KGV5ZSwgY2VudGVyLCB1cCwgZGVzdCl7XHJcbiAgICAgICAgbGV0IGV5ZVggICAgPSBleWVbMF0sICAgIGV5ZVkgICAgPSBleWVbMV0sICAgIGV5ZVogICAgPSBleWVbMl0sXHJcbiAgICAgICAgICAgIGNlbnRlclggPSBjZW50ZXJbMF0sIGNlbnRlclkgPSBjZW50ZXJbMV0sIGNlbnRlclogPSBjZW50ZXJbMl0sXHJcbiAgICAgICAgICAgIHVwWCAgICAgPSB1cFswXSwgICAgIHVwWSAgICAgPSB1cFsxXSwgICAgIHVwWiAgICAgPSB1cFsyXTtcclxuICAgICAgICBpZihleWVYID09IGNlbnRlclggJiYgZXllWSA9PSBjZW50ZXJZICYmIGV5ZVogPT0gY2VudGVyWil7cmV0dXJuIE1hdDQuaWRlbnRpdHkoZGVzdCk7fVxyXG4gICAgICAgIGxldCBvdXQgPSBkZXN0O1xyXG4gICAgICAgIGlmKGRlc3QgPT0gbnVsbCl7b3V0ID0gTWF0NC5jcmVhdGUoKX1cclxuICAgICAgICBsZXQgeDAsIHgxLCB4MiwgeTAsIHkxLCB5MiwgejAsIHoxLCB6MiwgbDtcclxuICAgICAgICB6MCA9IGV5ZVggLSBjZW50ZXJbMF07IHoxID0gZXllWSAtIGNlbnRlclsxXTsgejIgPSBleWVaIC0gY2VudGVyWzJdO1xyXG4gICAgICAgIGwgPSAxIC8gTWF0aC5zcXJ0KHowICogejAgKyB6MSAqIHoxICsgejIgKiB6Mik7XHJcbiAgICAgICAgejAgKj0gbDsgejEgKj0gbDsgejIgKj0gbDtcclxuICAgICAgICB4MCA9IHVwWSAqIHoyIC0gdXBaICogejE7XHJcbiAgICAgICAgeDEgPSB1cFogKiB6MCAtIHVwWCAqIHoyO1xyXG4gICAgICAgIHgyID0gdXBYICogejEgLSB1cFkgKiB6MDtcclxuICAgICAgICBsID0gTWF0aC5zcXJ0KHgwICogeDAgKyB4MSAqIHgxICsgeDIgKiB4Mik7XHJcbiAgICAgICAgaWYoIWwpe1xyXG4gICAgICAgICAgICB4MCA9IDA7IHgxID0gMDsgeDIgPSAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGwgPSAxIC8gbDtcclxuICAgICAgICAgICAgeDAgKj0gbDsgeDEgKj0gbDsgeDIgKj0gbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgeTAgPSB6MSAqIHgyIC0gejIgKiB4MTsgeTEgPSB6MiAqIHgwIC0gejAgKiB4MjsgeTIgPSB6MCAqIHgxIC0gejEgKiB4MDtcclxuICAgICAgICBsID0gTWF0aC5zcXJ0KHkwICogeTAgKyB5MSAqIHkxICsgeTIgKiB5Mik7XHJcbiAgICAgICAgaWYoIWwpe1xyXG4gICAgICAgICAgICB5MCA9IDA7IHkxID0gMDsgeTIgPSAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGwgPSAxIC8gbDtcclxuICAgICAgICAgICAgeTAgKj0gbDsgeTEgKj0gbDsgeTIgKj0gbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3V0WzBdID0geDA7IG91dFsxXSA9IHkwOyBvdXRbMl0gID0gejA7IG91dFszXSAgPSAwO1xyXG4gICAgICAgIG91dFs0XSA9IHgxOyBvdXRbNV0gPSB5MTsgb3V0WzZdICA9IHoxOyBvdXRbN10gID0gMDtcclxuICAgICAgICBvdXRbOF0gPSB4Mjsgb3V0WzldID0geTI7IG91dFsxMF0gPSB6Mjsgb3V0WzExXSA9IDA7XHJcbiAgICAgICAgb3V0WzEyXSA9IC0oeDAgKiBleWVYICsgeDEgKiBleWVZICsgeDIgKiBleWVaKTtcclxuICAgICAgICBvdXRbMTNdID0gLSh5MCAqIGV5ZVggKyB5MSAqIGV5ZVkgKyB5MiAqIGV5ZVopO1xyXG4gICAgICAgIG91dFsxNF0gPSAtKHowICogZXllWCArIHoxICogZXllWSArIHoyICogZXllWik7XHJcbiAgICAgICAgb3V0WzE1XSA9IDE7XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6YCP6KaW5oqV5b2x5aSJ5o+b6KGM5YiX44KS55Sf5oiQ44GZ44KL77yI5Y+C54Wn44Gr5rOo5oSP44O75oi744KK5YCk44Go44GX44Gm44KC57WQ5p6c44KS6L+U44GZ77yJXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZm92eSAtIOimlumHjuinku+8iOW6puaVsOazle+8iVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGFzcGVjdCAtIOOCouOCueODmuOCr+ODiOavlO+8iOW5hSAvIOmrmOOBle+8iVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgLSDjg4vjgqLjgq/jg6rjg4Pjg5fpnaLjgb7jgafjga7ot53pm6JcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmYXIgLSDjg5XjgqHjg7zjgq/jg6rjg4Pjg5fpnaLjgb7jgafjga7ot53pm6JcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gW2Rlc3RdIC0g57WQ5p6c44KS5qC857SN44GZ44KL6KGM5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSDntZDmnpzjga7ooYzliJdcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHBlcnNwZWN0aXZlKGZvdnksIGFzcGVjdCwgbmVhciwgZmFyLCBkZXN0KXtcclxuICAgICAgICBsZXQgb3V0ID0gZGVzdDtcclxuICAgICAgICBpZihkZXN0ID09IG51bGwpe291dCA9IE1hdDQuY3JlYXRlKCl9XHJcbiAgICAgICAgbGV0IHQgPSBuZWFyICogTWF0aC50YW4oZm92eSAqIE1hdGguUEkgLyAzNjApO1xyXG4gICAgICAgIGxldCByID0gdCAqIGFzcGVjdDtcclxuICAgICAgICBsZXQgYSA9IHIgKiAyLCBiID0gdCAqIDIsIGMgPSBmYXIgLSBuZWFyO1xyXG4gICAgICAgIG91dFswXSAgPSBuZWFyICogMiAvIGE7XHJcbiAgICAgICAgb3V0WzFdICA9IDA7XHJcbiAgICAgICAgb3V0WzJdICA9IDA7XHJcbiAgICAgICAgb3V0WzNdICA9IDA7XHJcbiAgICAgICAgb3V0WzRdICA9IDA7XHJcbiAgICAgICAgb3V0WzVdICA9IG5lYXIgKiAyIC8gYjtcclxuICAgICAgICBvdXRbNl0gID0gMDtcclxuICAgICAgICBvdXRbN10gID0gMDtcclxuICAgICAgICBvdXRbOF0gID0gMDtcclxuICAgICAgICBvdXRbOV0gID0gMDtcclxuICAgICAgICBvdXRbMTBdID0gLShmYXIgKyBuZWFyKSAvIGM7XHJcbiAgICAgICAgb3V0WzExXSA9IC0xO1xyXG4gICAgICAgIG91dFsxMl0gPSAwO1xyXG4gICAgICAgIG91dFsxM10gPSAwO1xyXG4gICAgICAgIG91dFsxNF0gPSAtKGZhciAqIG5lYXIgKiAyKSAvIGM7XHJcbiAgICAgICAgb3V0WzE1XSA9IDA7XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5q2j5bCE5b2x5oqV5b2x5aSJ5o+b6KGM5YiX44KS55Sf5oiQ44GZ44KL77yI5Y+C54Wn44Gr5rOo5oSP44O75oi744KK5YCk44Go44GX44Gm44KC57WQ5p6c44KS6L+U44GZ77yJXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGVmdCAtIOW3puerr1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHJpZ2h0IC0g5Y+z56uvXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdG9wIC0g5LiK56uvXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm90dG9tIC0g5LiL56uvXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbmVhciAtIOODi+OCouOCr+ODquODg+ODl+mdouOBvuOBp+OBrui3nembolxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZhciAtIOODleOCoeODvOOCr+ODquODg+ODl+mdouOBvuOBp+OBrui3nembolxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBbZGVzdF0gLSDntZDmnpzjgpLmoLzntI3jgZnjgovooYzliJdcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheS48TWF0ND59IOe1kOaenOOBruihjOWIl1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgb3J0aG8obGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tLCBuZWFyLCBmYXIsIGRlc3Qpe1xyXG4gICAgICAgIGxldCBvdXQgPSBkZXN0O1xyXG4gICAgICAgIGlmKGRlc3QgPT0gbnVsbCl7b3V0ID0gTWF0NC5jcmVhdGUoKX1cclxuICAgICAgICBsZXQgaCA9IChyaWdodCAtIGxlZnQpO1xyXG4gICAgICAgIGxldCB2ID0gKHRvcCAtIGJvdHRvbSk7XHJcbiAgICAgICAgbGV0IGQgPSAoZmFyIC0gbmVhcik7XHJcbiAgICAgICAgb3V0WzBdICA9IDIgLyBoO1xyXG4gICAgICAgIG91dFsxXSAgPSAwO1xyXG4gICAgICAgIG91dFsyXSAgPSAwO1xyXG4gICAgICAgIG91dFszXSAgPSAwO1xyXG4gICAgICAgIG91dFs0XSAgPSAwO1xyXG4gICAgICAgIG91dFs1XSAgPSAyIC8gdjtcclxuICAgICAgICBvdXRbNl0gID0gMDtcclxuICAgICAgICBvdXRbN10gID0gMDtcclxuICAgICAgICBvdXRbOF0gID0gMDtcclxuICAgICAgICBvdXRbOV0gID0gMDtcclxuICAgICAgICBvdXRbMTBdID0gLTIgLyBkO1xyXG4gICAgICAgIG91dFsxMV0gPSAwO1xyXG4gICAgICAgIG91dFsxMl0gPSAtKGxlZnQgKyByaWdodCkgLyBoO1xyXG4gICAgICAgIG91dFsxM10gPSAtKHRvcCArIGJvdHRvbSkgLyB2O1xyXG4gICAgICAgIG91dFsxNF0gPSAtKGZhciArIG5lYXIpIC8gZDtcclxuICAgICAgICBvdXRbMTVdID0gMTtcclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDou6Lnva7ooYzliJfjgpLnlJ/miJDjgZnjgovvvIjlj4Lnhafjgavms6jmhI/jg7vmiLvjgorlgKTjgajjgZfjgabjgoLntZDmnpzjgpLov5TjgZnvvIlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gbWF0IC0g6YGp55So44GZ44KL6KGM5YiXXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IFtkZXN0XSAtIOe1kOaenOOCkuagvOe0jeOBmeOCi+ihjOWIl1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0g57WQ5p6c44Gu6KGM5YiXXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB0cmFuc3Bvc2UobWF0LCBkZXN0KXtcclxuICAgICAgICBsZXQgb3V0ID0gZGVzdDtcclxuICAgICAgICBpZihkZXN0ID09IG51bGwpe291dCA9IE1hdDQuY3JlYXRlKCl9XHJcbiAgICAgICAgb3V0WzBdICA9IG1hdFswXTsgIG91dFsxXSAgPSBtYXRbNF07XHJcbiAgICAgICAgb3V0WzJdICA9IG1hdFs4XTsgIG91dFszXSAgPSBtYXRbMTJdO1xyXG4gICAgICAgIG91dFs0XSAgPSBtYXRbMV07ICBvdXRbNV0gID0gbWF0WzVdO1xyXG4gICAgICAgIG91dFs2XSAgPSBtYXRbOV07ICBvdXRbN10gID0gbWF0WzEzXTtcclxuICAgICAgICBvdXRbOF0gID0gbWF0WzJdOyAgb3V0WzldICA9IG1hdFs2XTtcclxuICAgICAgICBvdXRbMTBdID0gbWF0WzEwXTsgb3V0WzExXSA9IG1hdFsxNF07XHJcbiAgICAgICAgb3V0WzEyXSA9IG1hdFszXTsgIG91dFsxM10gPSBtYXRbN107XHJcbiAgICAgICAgb3V0WzE0XSA9IG1hdFsxMV07IG91dFsxNV0gPSBtYXRbMTVdO1xyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOmAhuihjOWIl+OCkueUn+aIkOOBmeOCi++8iOWPgueFp+OBq+azqOaEj+ODu+aIu+OCiuWApOOBqOOBl+OBpuOCgue1kOaenOOCkui/lOOBme+8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBtYXQgLSDpgannlKjjgZnjgovooYzliJdcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gW2Rlc3RdIC0g57WQ5p6c44KS5qC857SN44GZ44KL6KGM5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSDntZDmnpzjga7ooYzliJdcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGludmVyc2UobWF0LCBkZXN0KXtcclxuICAgICAgICBsZXQgb3V0ID0gZGVzdDtcclxuICAgICAgICBpZihkZXN0ID09IG51bGwpe291dCA9IE1hdDQuY3JlYXRlKCl9XHJcbiAgICAgICAgbGV0IGEgPSBtYXRbMF0sICBiID0gbWF0WzFdLCAgYyA9IG1hdFsyXSwgIGQgPSBtYXRbM10sXHJcbiAgICAgICAgICAgIGUgPSBtYXRbNF0sICBmID0gbWF0WzVdLCAgZyA9IG1hdFs2XSwgIGggPSBtYXRbN10sXHJcbiAgICAgICAgICAgIGkgPSBtYXRbOF0sICBqID0gbWF0WzldLCAgayA9IG1hdFsxMF0sIGwgPSBtYXRbMTFdLFxyXG4gICAgICAgICAgICBtID0gbWF0WzEyXSwgbiA9IG1hdFsxM10sIG8gPSBtYXRbMTRdLCBwID0gbWF0WzE1XSxcclxuICAgICAgICAgICAgcSA9IGEgKiBmIC0gYiAqIGUsIHIgPSBhICogZyAtIGMgKiBlLFxyXG4gICAgICAgICAgICBzID0gYSAqIGggLSBkICogZSwgdCA9IGIgKiBnIC0gYyAqIGYsXHJcbiAgICAgICAgICAgIHUgPSBiICogaCAtIGQgKiBmLCB2ID0gYyAqIGggLSBkICogZyxcclxuICAgICAgICAgICAgdyA9IGkgKiBuIC0gaiAqIG0sIHggPSBpICogbyAtIGsgKiBtLFxyXG4gICAgICAgICAgICB5ID0gaSAqIHAgLSBsICogbSwgeiA9IGogKiBvIC0gayAqIG4sXHJcbiAgICAgICAgICAgIEEgPSBqICogcCAtIGwgKiBuLCBCID0gayAqIHAgLSBsICogbyxcclxuICAgICAgICAgICAgaXZkID0gMSAvIChxICogQiAtIHIgKiBBICsgcyAqIHogKyB0ICogeSAtIHUgKiB4ICsgdiAqIHcpO1xyXG4gICAgICAgIG91dFswXSAgPSAoIGYgKiBCIC0gZyAqIEEgKyBoICogeikgKiBpdmQ7XHJcbiAgICAgICAgb3V0WzFdICA9ICgtYiAqIEIgKyBjICogQSAtIGQgKiB6KSAqIGl2ZDtcclxuICAgICAgICBvdXRbMl0gID0gKCBuICogdiAtIG8gKiB1ICsgcCAqIHQpICogaXZkO1xyXG4gICAgICAgIG91dFszXSAgPSAoLWogKiB2ICsgayAqIHUgLSBsICogdCkgKiBpdmQ7XHJcbiAgICAgICAgb3V0WzRdICA9ICgtZSAqIEIgKyBnICogeSAtIGggKiB4KSAqIGl2ZDtcclxuICAgICAgICBvdXRbNV0gID0gKCBhICogQiAtIGMgKiB5ICsgZCAqIHgpICogaXZkO1xyXG4gICAgICAgIG91dFs2XSAgPSAoLW0gKiB2ICsgbyAqIHMgLSBwICogcikgKiBpdmQ7XHJcbiAgICAgICAgb3V0WzddICA9ICggaSAqIHYgLSBrICogcyArIGwgKiByKSAqIGl2ZDtcclxuICAgICAgICBvdXRbOF0gID0gKCBlICogQSAtIGYgKiB5ICsgaCAqIHcpICogaXZkO1xyXG4gICAgICAgIG91dFs5XSAgPSAoLWEgKiBBICsgYiAqIHkgLSBkICogdykgKiBpdmQ7XHJcbiAgICAgICAgb3V0WzEwXSA9ICggbSAqIHUgLSBuICogcyArIHAgKiBxKSAqIGl2ZDtcclxuICAgICAgICBvdXRbMTFdID0gKC1pICogdSArIGogKiBzIC0gbCAqIHEpICogaXZkO1xyXG4gICAgICAgIG91dFsxMl0gPSAoLWUgKiB6ICsgZiAqIHggLSBnICogdykgKiBpdmQ7XHJcbiAgICAgICAgb3V0WzEzXSA9ICggYSAqIHogLSBiICogeCArIGMgKiB3KSAqIGl2ZDtcclxuICAgICAgICBvdXRbMTRdID0gKC1tICogdCArIG4gKiByIC0gbyAqIHEpICogaXZkO1xyXG4gICAgICAgIG91dFsxNV0gPSAoIGkgKiB0IC0gaiAqIHIgKyBrICogcSkgKiBpdmQ7XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6KGM5YiX44Gr44OZ44Kv44OI44Or44KS5LmX566X44GZ44KL77yI44OZ44Kv44OI44Or44Gr6KGM5YiX44KS6YGp55So44GZ44KL77yJXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IG1hdCAtIOmBqeeUqOOBmeOCi+ihjOWIl1xyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gdmVjIC0g5LmX566X44GZ44KL44OZ44Kv44OI44Or77yINCDjgaTjga7opoHntKDjgpLmjIHjgaTphY3liJfvvIlcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0g57WQ5p6c44Gu44OZ44Kv44OI44OrXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB0b1ZlY0lWKG1hdCwgdmVjKXtcclxuICAgICAgICBsZXQgYSA9IG1hdFswXSwgIGIgPSBtYXRbMV0sICBjID0gbWF0WzJdLCAgZCA9IG1hdFszXSxcclxuICAgICAgICAgICAgZSA9IG1hdFs0XSwgIGYgPSBtYXRbNV0sICBnID0gbWF0WzZdLCAgaCA9IG1hdFs3XSxcclxuICAgICAgICAgICAgaSA9IG1hdFs4XSwgIGogPSBtYXRbOV0sICBrID0gbWF0WzEwXSwgbCA9IG1hdFsxMV0sXHJcbiAgICAgICAgICAgIG0gPSBtYXRbMTJdLCBuID0gbWF0WzEzXSwgbyA9IG1hdFsxNF0sIHAgPSBtYXRbMTVdO1xyXG4gICAgICAgIGxldCB4ID0gdmVjWzBdLCB5ID0gdmVjWzFdLCB6ID0gdmVjWzJdLCB3ID0gdmVjWzNdO1xyXG4gICAgICAgIGxldCBvdXQgPSBbXTtcclxuICAgICAgICBvdXRbMF0gPSB4ICogYSArIHkgKiBlICsgeiAqIGkgKyB3ICogbTtcclxuICAgICAgICBvdXRbMV0gPSB4ICogYiArIHkgKiBmICsgeiAqIGogKyB3ICogbjtcclxuICAgICAgICBvdXRbMl0gPSB4ICogYyArIHkgKiBnICsgeiAqIGsgKyB3ICogbztcclxuICAgICAgICBvdXRbM10gPSB4ICogZCArIHkgKiBoICsgeiAqIGwgKyB3ICogcDtcclxuICAgICAgICB2ZWMgPSBvdXQ7XHJcbiAgICAgICAgcmV0dXJuIG91dDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44Kr44Oh44Op44Gu44OX44Ot44OR44OG44Kj44Gr55u45b2T44GZ44KL5oOF5aCx44KS5Y+X44GR5Y+W44KK6KGM5YiX44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IHBvc2l0aW9uIC0g44Kr44Oh44Op44Gu5bqn5qiZXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IGNlbnRlclBvaW50IC0g44Kr44Oh44Op44Gu5rOo6KaW54K5XHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IHVwRGlyZWN0aW9uIC0g44Kr44Oh44Op44Gu5LiK5pa55ZCRXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZm92eSAtIOimlumHjuinklxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGFzcGVjdCAtIOOCouOCueODmuOCr+ODiOavlFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG5lYXIgLSDjg4vjgqLjgq/jg6rjg4Pjg5fpnaJcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmYXIgLSDjg5XjgqHjg7zjgq/jg6rjg4Pjg5fpnaJcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gdm1hdCAtIOODk+ODpeODvOW6p+aomeWkieaPm+ihjOWIl+OBrue1kOaenOOCkuagvOe0jeOBmeOCi+ihjOWIl1xyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPE1hdDQ+fSBwbWF0IC0g6YCP6KaW5oqV5b2x5bqn5qiZ5aSJ5o+b6KGM5YiX44Gu57WQ5p6c44KS5qC857SN44GZ44KL6KGM5YiXXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IGRlc3QgLSDjg5Pjg6Xjg7wgeCDpgI/oppbmipXlvbHlpInmj5vooYzliJfjga7ntZDmnpzjgpLmoLzntI3jgZnjgovooYzliJdcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHZwRnJvbUNhbWVyYVByb3BlcnR5KHBvc2l0aW9uLCBjZW50ZXJQb2ludCwgdXBEaXJlY3Rpb24sIGZvdnksIGFzcGVjdCwgbmVhciwgZmFyLCB2bWF0LCBwbWF0LCBkZXN0KXtcclxuICAgICAgICBNYXQ0Lmxvb2tBdChwb3NpdGlvbiwgY2VudGVyUG9pbnQsIHVwRGlyZWN0aW9uLCB2bWF0KTtcclxuICAgICAgICBNYXQ0LnBlcnNwZWN0aXZlKGZvdnksIGFzcGVjdCwgbmVhciwgZmFyLCBwbWF0KTtcclxuICAgICAgICBNYXQ0Lm11bHRpcGx5KHBtYXQsIHZtYXQsIGRlc3QpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBNVlAg6KGM5YiX44Gr55u45b2T44GZ44KL6KGM5YiX44KS5Y+X44GR5Y+W44KK44OZ44Kv44OI44Or44KS5aSJ5o+b44GX44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48TWF0ND59IG1hdCAtIE1WUCDooYzliJdcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IHZlYyAtIE1WUCDooYzliJfjgajkuZfnrpfjgZnjgovjg5njgq/jg4jjg6tcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIOODk+ODpeODvOODneODvOODiOOBruW5hVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIOODk+ODpeODvOODneODvOODiOOBrumrmOOBlVxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59IOe1kOaenOOBruODmeOCr+ODiOODq++8iDIg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44Or77yJXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBzY3JlZW5Qb3NpdGlvbkZyb21NdnAobWF0LCB2ZWMsIHdpZHRoLCBoZWlnaHQpe1xyXG4gICAgICAgIGxldCBoYWxmV2lkdGggPSB3aWR0aCAqIDAuNTtcclxuICAgICAgICBsZXQgaGFsZkhlaWdodCA9IGhlaWdodCAqIDAuNTtcclxuICAgICAgICBsZXQgdiA9IE1hdDQudG9WZWNJVihtYXQsIFt2ZWNbMF0sIHZlY1sxXSwgdmVjWzJdLCAxLjBdKTtcclxuICAgICAgICBpZih2WzNdIDw9IDAuMCl7cmV0dXJuIFtOYU4sIE5hTl07fVxyXG4gICAgICAgIHZbMF0gLz0gdlszXTsgdlsxXSAvPSB2WzNdOyB2WzJdIC89IHZbM107XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgaGFsZldpZHRoICsgdlswXSAqIGhhbGZXaWR0aCxcclxuICAgICAgICAgICAgaGFsZkhlaWdodCAtIHZbMV0gKiBoYWxmSGVpZ2h0XHJcbiAgICAgICAgXTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFZlYzNcclxuICogQGNsYXNzIFZlYzNcclxuICovXHJcbmNsYXNzIFZlYzMge1xyXG4gICAgLyoqXHJcbiAgICAgKiAzIOOBpOOBruimgee0oOOCkuaMgeOBpOODmeOCr+ODiOODq+OCkueUn+aIkOOBmeOCi1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5fSDjg5njgq/jg4jjg6vmoLzntI3nlKjjga7phY3liJdcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZSgpe1xyXG4gICAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KDMpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5njgq/jg4jjg6vjga7plbfjgZXvvIjlpKfjgY3jgZXvvInjgpLov5TjgZlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gdiAtIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44OrXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOODmeOCr+ODiOODq+OBrumVt+OBle+8iOWkp+OBjeOBle+8iVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbGVuKHYpe1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodlswXSAqIHZbMF0gKyB2WzFdICogdlsxXSArIHZbMl0gKiB2WzJdKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogMiDjgaTjga7luqfmqJnvvIjlp4vngrnjg7vntYLngrnvvInjgpLntZDjgbbjg5njgq/jg4jjg6vjgpLov5TjgZlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gdjAgLSAzIOOBpOOBruimgee0oOOCkuaMgeOBpOWni+eCueW6p+aomVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSB2MSAtIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk57WC54K55bqn5qiZXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSDoppbngrnjgajntYLngrnjgpLntZDjgbbjg5njgq/jg4jjg6tcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRpc3RhbmNlKHYwLCB2MSl7XHJcbiAgICAgICAgbGV0IG4gPSBWZWMzLmNyZWF0ZSgpO1xyXG4gICAgICAgIG5bMF0gPSB2MVswXSAtIHYwWzBdO1xyXG4gICAgICAgIG5bMV0gPSB2MVsxXSAtIHYwWzFdO1xyXG4gICAgICAgIG5bMl0gPSB2MVsyXSAtIHYwWzJdO1xyXG4gICAgICAgIHJldHVybiBuO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5njgq/jg4jjg6vjgpLmraPopo/ljJbjgZfjgZ/ntZDmnpzjgpLov5TjgZlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gdiAtIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44OrXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSDmraPopo/ljJbjgZfjgZ/jg5njgq/jg4jjg6tcclxuICAgICAqL1xyXG4gICAgc3RhdGljIG5vcm1hbGl6ZSh2KXtcclxuICAgICAgICBsZXQgbiA9IFZlYzMuY3JlYXRlKCk7XHJcbiAgICAgICAgbGV0IGwgPSBWZWMzLmxlbih2KTtcclxuICAgICAgICBpZihsID4gMCl7XHJcbiAgICAgICAgICAgIGxldCBlID0gMS4wIC8gbDtcclxuICAgICAgICAgICAgblswXSA9IHZbMF0gKiBlO1xyXG4gICAgICAgICAgICBuWzFdID0gdlsxXSAqIGU7XHJcbiAgICAgICAgICAgIG5bMl0gPSB2WzJdICogZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgblswXSA9IDAuMDtcclxuICAgICAgICAgICAgblsxXSA9IDAuMDtcclxuICAgICAgICAgICAgblsyXSA9IDAuMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG47XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIDIg44Gk44Gu44OZ44Kv44OI44Or44Gu5YaF56mN44Gu57WQ5p6c44KS6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IHYwIC0gMyDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gdjEgLSAzIOOBpOOBruimgee0oOOCkuaMgeOBpOODmeOCr+ODiOODq1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDlhoXnqY3jga7ntZDmnpxcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRvdCh2MCwgdjEpe1xyXG4gICAgICAgIHJldHVybiB2MFswXSAqIHYxWzBdICsgdjBbMV0gKiB2MVsxXSArIHYwWzJdICogdjFbMl07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIDIg44Gk44Gu44OZ44Kv44OI44Or44Gu5aSW56mN44Gu57WQ5p6c44KS6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IHYwIC0gMyDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gdjEgLSAzIOOBpOOBruimgee0oOOCkuaMgeOBpOODmeOCr+ODiOODq1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxWZWMzPn0g5aSW56mN44Gu57WQ5p6cXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcm9zcyh2MCwgdjEpe1xyXG4gICAgICAgIGxldCBuID0gVmVjMy5jcmVhdGUoKTtcclxuICAgICAgICBuWzBdID0gdjBbMV0gKiB2MVsyXSAtIHYwWzJdICogdjFbMV07XHJcbiAgICAgICAgblsxXSA9IHYwWzJdICogdjFbMF0gLSB2MFswXSAqIHYxWzJdO1xyXG4gICAgICAgIG5bMl0gPSB2MFswXSAqIHYxWzFdIC0gdjBbMV0gKiB2MVswXTtcclxuICAgICAgICByZXR1cm4gbjtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogMyDjgaTjga7jg5njgq/jg4jjg6vjgYvjgonpnaLms5Xnt5rjgpLmsYLjgoHjgabov5TjgZlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMzPn0gdjAgLSAzIOOBpOOBruimgee0oOOCkuaMgeOBpOODmeOCr+ODiOODq1xyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzM+fSB2MSAtIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44OrXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMz59IHYyIC0gMyDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheS48VmVjMz59IOmdouazlee3muODmeOCr+ODiOODq1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZmFjZU5vcm1hbCh2MCwgdjEsIHYyKXtcclxuICAgICAgICBsZXQgbiA9IFZlYzMuY3JlYXRlKCk7XHJcbiAgICAgICAgbGV0IHZlYzEgPSBbdjFbMF0gLSB2MFswXSwgdjFbMV0gLSB2MFsxXSwgdjFbMl0gLSB2MFsyXV07XHJcbiAgICAgICAgbGV0IHZlYzIgPSBbdjJbMF0gLSB2MFswXSwgdjJbMV0gLSB2MFsxXSwgdjJbMl0gLSB2MFsyXV07XHJcbiAgICAgICAgblswXSA9IHZlYzFbMV0gKiB2ZWMyWzJdIC0gdmVjMVsyXSAqIHZlYzJbMV07XHJcbiAgICAgICAgblsxXSA9IHZlYzFbMl0gKiB2ZWMyWzBdIC0gdmVjMVswXSAqIHZlYzJbMl07XHJcbiAgICAgICAgblsyXSA9IHZlYzFbMF0gKiB2ZWMyWzFdIC0gdmVjMVsxXSAqIHZlYzJbMF07XHJcbiAgICAgICAgcmV0dXJuIFZlYzMubm9ybWFsaXplKG4pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogVmVjMlxyXG4gKiBAY2xhc3MgVmVjMlxyXG4gKi9cclxuY2xhc3MgVmVjMiB7XHJcbiAgICAvKipcclxuICAgICAqIDIg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44Or44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IOODmeOCr+ODiOODq+agvOe0jeeUqOOBrumFjeWIl1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY3JlYXRlKCl7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoMik7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOODmeOCr+ODiOODq+OBrumVt+OBle+8iOWkp+OBjeOBle+8ieOCkui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzI+fSB2IC0gMiDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0g44OZ44Kv44OI44Or44Gu6ZW344GV77yI5aSn44GN44GV77yJXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBsZW4odil7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh2WzBdICogdlswXSArIHZbMV0gKiB2WzFdKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogMiDjgaTjga7luqfmqJnvvIjlp4vngrnjg7vntYLngrnvvInjgpLntZDjgbbjg5njgq/jg4jjg6vjgpLov5TjgZlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMyPn0gdjAgLSAyIOOBpOOBruimgee0oOOCkuaMgeOBpOWni+eCueW6p+aomVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzI+fSB2MSAtIDIg44Gk44Gu6KaB57Sg44KS5oyB44Gk57WC54K55bqn5qiZXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPFZlYzI+fSDoppbngrnjgajntYLngrnjgpLntZDjgbbjg5njgq/jg4jjg6tcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRpc3RhbmNlKHYwLCB2MSl7XHJcbiAgICAgICAgbGV0IG4gPSBWZWMyLmNyZWF0ZSgpO1xyXG4gICAgICAgIG5bMF0gPSB2MVswXSAtIHYwWzBdO1xyXG4gICAgICAgIG5bMV0gPSB2MVsxXSAtIHYwWzFdO1xyXG4gICAgICAgIHJldHVybiBuO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjg5njgq/jg4jjg6vjgpLmraPopo/ljJbjgZfjgZ/ntZDmnpzjgpLov5TjgZlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMyPn0gdiAtIDIg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44OrXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPFZlYzI+fSDmraPopo/ljJbjgZfjgZ/jg5njgq/jg4jjg6tcclxuICAgICAqL1xyXG4gICAgc3RhdGljIG5vcm1hbGl6ZSh2KXtcclxuICAgICAgICBsZXQgbiA9IFZlYzIuY3JlYXRlKCk7XHJcbiAgICAgICAgbGV0IGwgPSBWZWMyLmxlbih2KTtcclxuICAgICAgICBpZihsID4gMCl7XHJcbiAgICAgICAgICAgIGxldCBlID0gMS4wIC8gbDtcclxuICAgICAgICAgICAgblswXSA9IHZbMF0gKiBlO1xyXG4gICAgICAgICAgICBuWzFdID0gdlsxXSAqIGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiAyIOOBpOOBruODmeOCr+ODiOODq+OBruWGheepjeOBrue1kOaenOOCkui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFZlYzI+fSB2MCAtIDIg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44OrXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMj59IHYxIC0gMiDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEByZXR1cm4ge251bWJlcn0g5YaF56mN44Gu57WQ5p6cXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkb3QodjAsIHYxKXtcclxuICAgICAgICByZXR1cm4gdjBbMF0gKiB2MVswXSArIHYwWzFdICogdjFbMV07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIDIg44Gk44Gu44OZ44Kv44OI44Or44Gu5aSW56mN44Gu57WQ5p6c44KS6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48VmVjMj59IHYwIC0gMiDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxWZWMyPn0gdjEgLSAyIOOBpOOBruimgee0oOOCkuaMgeOBpOODmeOCr+ODiOODq1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxWZWMyPn0g5aSW56mN44Gu57WQ5p6cXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcm9zcyh2MCwgdjEpe1xyXG4gICAgICAgIGxldCBuID0gVmVjMi5jcmVhdGUoKTtcclxuICAgICAgICByZXR1cm4gdjBbMF0gKiB2MVsxXSAtIHYwWzFdICogdjFbMF07XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBRdG5cclxuICogQGNsYXNzIFF0blxyXG4gKi9cclxuY2xhc3MgUXRuIHtcclxuICAgIC8qKlxyXG4gICAgICogNCDjgaTjga7opoHntKDjgYvjgonjgarjgovjgq/jgqnjg7zjgr/jg4vjgqrjg7Pjga7jg4fjg7zjgr/mp4vpgKDjgpLnlJ/miJDjgZnjgovvvIjomZrpg6ggeCwgeSwgeiwg5a6f6YOoIHcg44Gu6aCG5bqP44Gn5a6a576p77yJXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IOOCr+OCqeODvOOCv+ODi+OCquODs+ODh+ODvOOCv+agvOe0jeeUqOOBrumFjeWIl1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY3JlYXRlKCl7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoNCk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCr+OCqeODvOOCv+ODi+OCquODs+OCkuWIneacn+WMluOBmeOCi++8iOWPgueFp+OBq+azqOaEj++8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFF0bj59IGRlc3QgLSDliJ3mnJ/ljJbjgZnjgovjgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheS48UXRuPn0g57WQ5p6c44Gu44Kv44Kp44O844K/44OL44Kq44OzXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBpZGVudGl0eShkZXN0KXtcclxuICAgICAgICBkZXN0WzBdID0gMDsgZGVzdFsxXSA9IDA7IGRlc3RbMl0gPSAwOyBkZXN0WzNdID0gMTtcclxuICAgICAgICByZXR1cm4gZGVzdDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5YWx5b255Zub5YWD5pWw44KS55Sf5oiQ44GX44Gm6L+U44GZ77yI5Y+C54Wn44Gr5rOo5oSP44O75oi744KK5YCk44Go44GX44Gm44KC57WQ5p6c44KS6L+U44GZ77yJXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48UXRuPn0gcXRuIC0g5YWD44Go44Gq44KL44Kv44Kp44O844K/44OL44Kq44OzXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48UXRuPn0gW2Rlc3RdIC0g57WQ5p6c44KS5qC857SN44GZ44KL44Kv44Kp44O844K/44OL44Kq44OzXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPFF0bj59IOe1kOaenOOBruOCr+OCqeODvOOCv+ODi+OCquODs1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgaW52ZXJzZShxdG4sIGRlc3Qpe1xyXG4gICAgICAgIGxldCBvdXQgPSBkZXN0O1xyXG4gICAgICAgIGlmKGRlc3QgPT0gbnVsbCl7b3V0ID0gUXRuLmNyZWF0ZSgpO31cclxuICAgICAgICBvdXRbMF0gPSAtcXRuWzBdO1xyXG4gICAgICAgIG91dFsxXSA9IC1xdG5bMV07XHJcbiAgICAgICAgb3V0WzJdID0gLXF0blsyXTtcclxuICAgICAgICBvdXRbM10gPSAgcXRuWzNdO1xyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOiZmumDqOOCkuato+imj+WMluOBl+OBpui/lOOBme+8iOWPgueFp+OBq+azqOaEj++8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFF0bj59IHF0biAtIOWFg+OBqOOBquOCi+OCr+OCqeODvOOCv+ODi+OCquODs1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxRdG4+fSDntZDmnpzjga7jgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqL1xyXG4gICAgc3RhdGljIG5vcm1hbGl6ZShkZXN0KXtcclxuICAgICAgICBsZXQgeCA9IGRlc3RbMF0sIHkgPSBkZXN0WzFdLCB6ID0gZGVzdFsyXTtcclxuICAgICAgICBsZXQgbCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xyXG4gICAgICAgIGlmKGwgPT09IDApe1xyXG4gICAgICAgICAgICBkZXN0WzBdID0gMDtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IDA7XHJcbiAgICAgICAgICAgIGRlc3RbMl0gPSAwO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBsID0gMSAvIGw7XHJcbiAgICAgICAgICAgIGRlc3RbMF0gPSB4ICogbDtcclxuICAgICAgICAgICAgZGVzdFsxXSA9IHkgKiBsO1xyXG4gICAgICAgICAgICBkZXN0WzJdID0geiAqIGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkZXN0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgq/jgqnjg7zjgr/jg4vjgqrjg7PjgpLkuZfnrpfjgZfjgZ/ntZDmnpzjgpLov5TjgZnvvIjlj4Lnhafjgavms6jmhI/jg7vmiLvjgorlgKTjgajjgZfjgabjgoLntZDmnpzjgpLov5TjgZnvvIlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxRdG4+fSBxdG4wIC0g5LmX566X44GV44KM44KL44Kv44Kp44O844K/44OL44Kq44OzXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48UXRuPn0gcXRuMSAtIOS5l+eul+OBmeOCi+OCr+OCqeODvOOCv+ODi+OCquODs1xyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFF0bj59IFtkZXN0XSAtIOe1kOaenOOCkuagvOe0jeOBmeOCi+OCr+OCqeODvOOCv+ODi+OCquODs1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxRdG4+fSDntZDmnpzjga7jgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqL1xyXG4gICAgc3RhdGljIG11bHRpcGx5KHF0bjAsIHF0bjEsIGRlc3Qpe1xyXG4gICAgICAgIGxldCBvdXQgPSBkZXN0O1xyXG4gICAgICAgIGlmKGRlc3QgPT0gbnVsbCl7b3V0ID0gUXRuLmNyZWF0ZSgpO31cclxuICAgICAgICBsZXQgYXggPSBxdG4wWzBdLCBheSA9IHF0bjBbMV0sIGF6ID0gcXRuMFsyXSwgYXcgPSBxdG4wWzNdO1xyXG4gICAgICAgIGxldCBieCA9IHF0bjFbMF0sIGJ5ID0gcXRuMVsxXSwgYnogPSBxdG4xWzJdLCBidyA9IHF0bjFbM107XHJcbiAgICAgICAgb3V0WzBdID0gYXggKiBidyArIGF3ICogYnggKyBheSAqIGJ6IC0gYXogKiBieTtcclxuICAgICAgICBvdXRbMV0gPSBheSAqIGJ3ICsgYXcgKiBieSArIGF6ICogYnggLSBheCAqIGJ6O1xyXG4gICAgICAgIG91dFsyXSA9IGF6ICogYncgKyBhdyAqIGJ6ICsgYXggKiBieSAtIGF5ICogYng7XHJcbiAgICAgICAgb3V0WzNdID0gYXcgKiBidyAtIGF4ICogYnggLSBheSAqIGJ5IC0gYXogKiBiejtcclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgq/jgqnjg7zjgr/jg4vjgqrjg7Pjgavlm57ou6LjgpLpgannlKjjgZfov5TjgZnvvIjlj4Lnhafjgavms6jmhI/jg7vmiLvjgorlgKTjgajjgZfjgabjgoLntZDmnpzjgpLov5TjgZnvvIlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIOWbnui7ouOBmeOCi+mHj++8iOODqeOCuOOCouODs++8iVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gYXhpcyAtIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk6Lu444OZ44Kv44OI44OrXHJcbiAgICAgKiBAcGFyYW0ge0Zsb2F0MzJBcnJheS48UXRuPn0gW2Rlc3RdIC0g57WQ5p6c44KS5qC857SN44GZ44KL44Kv44Kp44O844K/44OL44Kq44OzXHJcbiAgICAgKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXkuPFF0bj59IOe1kOaenOOBruOCr+OCqeODvOOCv+ODi+OCquODs1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcm90YXRlKGFuZ2xlLCBheGlzLCBkZXN0KXtcclxuICAgICAgICBsZXQgb3V0ID0gZGVzdDtcclxuICAgICAgICBpZihkZXN0ID09IG51bGwpe291dCA9IFF0bi5jcmVhdGUoKTt9XHJcbiAgICAgICAgbGV0IGEgPSBheGlzWzBdLCBiID0gYXhpc1sxXSwgYyA9IGF4aXNbMl07XHJcbiAgICAgICAgbGV0IHNxID0gTWF0aC5zcXJ0KGF4aXNbMF0gKiBheGlzWzBdICsgYXhpc1sxXSAqIGF4aXNbMV0gKyBheGlzWzJdICogYXhpc1syXSk7XHJcbiAgICAgICAgaWYoc3EgIT09IDApe1xyXG4gICAgICAgICAgICBsZXQgbCA9IDEgLyBzcTtcclxuICAgICAgICAgICAgYSAqPSBsO1xyXG4gICAgICAgICAgICBiICo9IGw7XHJcbiAgICAgICAgICAgIGMgKj0gbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHMgPSBNYXRoLnNpbihhbmdsZSAqIDAuNSk7XHJcbiAgICAgICAgb3V0WzBdID0gYSAqIHM7XHJcbiAgICAgICAgb3V0WzFdID0gYiAqIHM7XHJcbiAgICAgICAgb3V0WzJdID0gYyAqIHM7XHJcbiAgICAgICAgb3V0WzNdID0gTWF0aC5jb3MoYW5nbGUgKiAwLjUpO1xyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOODmeOCr+ODiOODq+OBq+OCr+OCqeODvOOCv+ODi+OCquODs+OCkumBqeeUqOOBl+i/lOOBme+8iOWPgueFp+OBq+azqOaEj+ODu+aIu+OCiuWApOOBqOOBl+OBpuOCgue1kOaenOOCkui/lOOBme+8iVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gdmVjIC0gMyDjgaTjga7opoHntKDjgpLmjIHjgaTjg5njgq/jg4jjg6tcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxRdG4+fSBxdG4gLSDjgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtkZXN0XSAtIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk44OZ44Kv44OI44OrXHJcbiAgICAgKiBAcmV0dXJuIHtBcnJheS48bnVtYmVyPn0g57WQ5p6c44Gu44OZ44Kv44OI44OrXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB0b1ZlY0lJSSh2ZWMsIHF0biwgZGVzdCl7XHJcbiAgICAgICAgbGV0IG91dCA9IGRlc3Q7XHJcbiAgICAgICAgaWYoZGVzdCA9PSBudWxsKXtvdXQgPSBbMC4wLCAwLjAsIDAuMF07fVxyXG4gICAgICAgIGxldCBxcCA9IFF0bi5jcmVhdGUoKTtcclxuICAgICAgICBsZXQgcXEgPSBRdG4uY3JlYXRlKCk7XHJcbiAgICAgICAgbGV0IHFyID0gUXRuLmNyZWF0ZSgpO1xyXG4gICAgICAgIFF0bi5pbnZlcnNlKHF0biwgcXIpO1xyXG4gICAgICAgIHFwWzBdID0gdmVjWzBdO1xyXG4gICAgICAgIHFwWzFdID0gdmVjWzFdO1xyXG4gICAgICAgIHFwWzJdID0gdmVjWzJdO1xyXG4gICAgICAgIFF0bi5tdWx0aXBseShxciwgcXAsIHFxKTtcclxuICAgICAgICBRdG4ubXVsdGlwbHkocXEsIHF0biwgcXIpO1xyXG4gICAgICAgIG91dFswXSA9IHFyWzBdO1xyXG4gICAgICAgIG91dFsxXSA9IHFyWzFdO1xyXG4gICAgICAgIG91dFsyXSA9IHFyWzJdO1xyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIDR4NCDooYzliJfjgavjgq/jgqnjg7zjgr/jg4vjgqrjg7PjgpLpgannlKjjgZfov5TjgZnvvIjlj4Lnhafjgavms6jmhI/jg7vmiLvjgorlgKTjgajjgZfjgabjgoLntZDmnpzjgpLov5TjgZnvvIlcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxRdG4+fSBxdG4gLSDjgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0gW2Rlc3RdIC0gNHg0IOihjOWIl1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxNYXQ0Pn0g57WQ5p6c44Gu6KGM5YiXXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB0b01hdElWKHF0biwgZGVzdCl7XHJcbiAgICAgICAgbGV0IG91dCA9IGRlc3Q7XHJcbiAgICAgICAgaWYoZGVzdCA9PSBudWxsKXtvdXQgPSBNYXQ0LmNyZWF0ZSgpO31cclxuICAgICAgICBsZXQgeCA9IHF0blswXSwgeSA9IHF0blsxXSwgeiA9IHF0blsyXSwgdyA9IHF0blszXTtcclxuICAgICAgICBsZXQgeDIgPSB4ICsgeCwgeTIgPSB5ICsgeSwgejIgPSB6ICsgejtcclxuICAgICAgICBsZXQgeHggPSB4ICogeDIsIHh5ID0geCAqIHkyLCB4eiA9IHggKiB6MjtcclxuICAgICAgICBsZXQgeXkgPSB5ICogeTIsIHl6ID0geSAqIHoyLCB6eiA9IHogKiB6MjtcclxuICAgICAgICBsZXQgd3ggPSB3ICogeDIsIHd5ID0gdyAqIHkyLCB3eiA9IHcgKiB6MjtcclxuICAgICAgICBvdXRbMF0gID0gMSAtICh5eSArIHp6KTtcclxuICAgICAgICBvdXRbMV0gID0geHkgLSB3ejtcclxuICAgICAgICBvdXRbMl0gID0geHogKyB3eTtcclxuICAgICAgICBvdXRbM10gID0gMDtcclxuICAgICAgICBvdXRbNF0gID0geHkgKyB3ejtcclxuICAgICAgICBvdXRbNV0gID0gMSAtICh4eCArIHp6KTtcclxuICAgICAgICBvdXRbNl0gID0geXogLSB3eDtcclxuICAgICAgICBvdXRbN10gID0gMDtcclxuICAgICAgICBvdXRbOF0gID0geHogLSB3eTtcclxuICAgICAgICBvdXRbOV0gID0geXogKyB3eDtcclxuICAgICAgICBvdXRbMTBdID0gMSAtICh4eCArIHl5KTtcclxuICAgICAgICBvdXRbMTFdID0gMDtcclxuICAgICAgICBvdXRbMTJdID0gMDtcclxuICAgICAgICBvdXRbMTNdID0gMDtcclxuICAgICAgICBvdXRbMTRdID0gMDtcclxuICAgICAgICBvdXRbMTVdID0gMTtcclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiAyIOOBpOOBruOCr+OCqeODvOOCv+ODi+OCquODs+OBrueQg+mdoue3muW9ouijnOmWk+OCkuihjOOBo+OBn+e1kOaenOOCkui/lOOBme+8iOWPgueFp+OBq+azqOaEj+ODu+aIu+OCiuWApOOBqOOBl+OBpuOCgue1kOaenOOCkui/lOOBme+8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFF0bj59IHF0bjAgLSDjgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5LjxRdG4+fSBxdG4xIC0g44Kv44Kp44O844K/44OL44Kq44OzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdGltZSAtIOijnOmWk+S/guaVsO+8iDAuMCDjgYvjgokgMS4wIOOBp+aMh+Wumu+8iVxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXkuPFF0bj59IFtkZXN0XSAtIOe1kOaenOOCkuagvOe0jeOBmeOCi+OCr+OCqeODvOOCv+ODi+OCquODs1xyXG4gICAgICogQHJldHVybiB7RmxvYXQzMkFycmF5LjxRdG4+fSDntZDmnpzjga7jgq/jgqnjg7zjgr/jg4vjgqrjg7NcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHNsZXJwKHF0bjAsIHF0bjEsIHRpbWUsIGRlc3Qpe1xyXG4gICAgICAgIGxldCBvdXQgPSBkZXN0O1xyXG4gICAgICAgIGlmKGRlc3QgPT0gbnVsbCl7b3V0ID0gUXRuLmNyZWF0ZSgpO31cclxuICAgICAgICBsZXQgaHQgPSBxdG4wWzBdICogcXRuMVswXSArIHF0bjBbMV0gKiBxdG4xWzFdICsgcXRuMFsyXSAqIHF0bjFbMl0gKyBxdG4wWzNdICogcXRuMVszXTtcclxuICAgICAgICBsZXQgaHMgPSAxLjAgLSBodCAqIGh0O1xyXG4gICAgICAgIGlmKGhzIDw9IDAuMCl7XHJcbiAgICAgICAgICAgIG91dFswXSA9IHF0bjBbMF07XHJcbiAgICAgICAgICAgIG91dFsxXSA9IHF0bjBbMV07XHJcbiAgICAgICAgICAgIG91dFsyXSA9IHF0bjBbMl07XHJcbiAgICAgICAgICAgIG91dFszXSA9IHF0bjBbM107XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGhzID0gTWF0aC5zcXJ0KGhzKTtcclxuICAgICAgICAgICAgaWYoTWF0aC5hYnMoaHMpIDwgMC4wMDAxKXtcclxuICAgICAgICAgICAgICAgIG91dFswXSA9IChxdG4wWzBdICogMC41ICsgcXRuMVswXSAqIDAuNSk7XHJcbiAgICAgICAgICAgICAgICBvdXRbMV0gPSAocXRuMFsxXSAqIDAuNSArIHF0bjFbMV0gKiAwLjUpO1xyXG4gICAgICAgICAgICAgICAgb3V0WzJdID0gKHF0bjBbMl0gKiAwLjUgKyBxdG4xWzJdICogMC41KTtcclxuICAgICAgICAgICAgICAgIG91dFszXSA9IChxdG4wWzNdICogMC41ICsgcXRuMVszXSAqIDAuNSk7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgbGV0IHBoID0gTWF0aC5hY29zKGh0KTtcclxuICAgICAgICAgICAgICAgIGxldCBwdCA9IHBoICogdGltZTtcclxuICAgICAgICAgICAgICAgIGxldCB0MCA9IE1hdGguc2luKHBoIC0gcHQpIC8gaHM7XHJcbiAgICAgICAgICAgICAgICBsZXQgdDEgPSBNYXRoLnNpbihwdCkgLyBocztcclxuICAgICAgICAgICAgICAgIG91dFswXSA9IHF0bjBbMF0gKiB0MCArIHF0bjFbMF0gKiB0MTtcclxuICAgICAgICAgICAgICAgIG91dFsxXSA9IHF0bjBbMV0gKiB0MCArIHF0bjFbMV0gKiB0MTtcclxuICAgICAgICAgICAgICAgIG91dFsyXSA9IHF0bjBbMl0gKiB0MCArIHF0bjFbMl0gKiB0MTtcclxuICAgICAgICAgICAgICAgIG91dFszXSA9IHF0bjBbM10gKiB0MCArIHF0bjFbM10gKiB0MTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb3V0O1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2dsM01hdGguanMiLCJcclxuLyoqXHJcbiAqIGdsM01lc2hcclxuICogQGNsYXNzXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBnbDNNZXNoIHtcclxuICAgIC8qKlxyXG4gICAgICog5p2/44Od44Oq44K044Oz44Gu6aCC54K55oOF5aCx44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSDmnb/jg53jg6rjgrTjg7Pjga7kuIDovrrjga7luYVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSDmnb/jg53jg6rjgrTjg7Pjga7kuIDovrrjga7pq5jjgZVcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNvbG9yIC0gUkdCQSDjgpIgMC4wIOOBi+OCiSAxLjAg44Gu56+E5Zuy44Gn5oyH5a6a44GX44Gf6YWN5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBwb3NpdGlvbiAtIOmggueCueW6p+aomVxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gbm9ybWFsIC0g6aCC54K55rOV57eaXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBjb2xvciAtIOmggueCueOCq+ODqeODvFxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gdGV4Q29vcmQgLSDjg4bjgq/jgrnjg4Hjg6PluqfmqJlcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IGluZGV4IC0g6aCC54K544Kk44Oz44OH44OD44Kv44K577yIZ2wuVFJJQU5HTEVT77yJXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogbGV0IHBsYW5lRGF0YSA9IGdsMy5NZXNoLnBsYW5lKDIuMCwgMi4wLCBbMS4wLCAxLjAsIDEuMCwgMS4wXSk7XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwbGFuZSh3aWR0aCwgaGVpZ2h0LCBjb2xvcil7XHJcbiAgICAgICAgbGV0IHcsIGg7XHJcbiAgICAgICAgdyA9IHdpZHRoIC8gMjtcclxuICAgICAgICBoID0gaGVpZ2h0IC8gMjtcclxuICAgICAgICBpZihjb2xvcil7XHJcbiAgICAgICAgICAgIHRjID0gY29sb3I7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRjID0gWzEuMCwgMS4wLCAxLjAsIDEuMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBwb3MgPSBbXHJcbiAgICAgICAgICAgIC13LCAgaCwgIDAuMCxcclxuICAgICAgICAgICAgIHcsICBoLCAgMC4wLFxyXG4gICAgICAgICAgICAtdywgLWgsICAwLjAsXHJcbiAgICAgICAgICAgICB3LCAtaCwgIDAuMFxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IG5vciA9IFtcclxuICAgICAgICAgICAgMC4wLCAwLjAsIDEuMCxcclxuICAgICAgICAgICAgMC4wLCAwLjAsIDEuMCxcclxuICAgICAgICAgICAgMC4wLCAwLjAsIDEuMCxcclxuICAgICAgICAgICAgMC4wLCAwLjAsIDEuMFxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IGNvbCA9IFtcclxuICAgICAgICAgICAgY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10sXHJcbiAgICAgICAgICAgIGNvbG9yWzBdLCBjb2xvclsxXSwgY29sb3JbMl0sIGNvbG9yWzNdLFxyXG4gICAgICAgICAgICBjb2xvclswXSwgY29sb3JbMV0sIGNvbG9yWzJdLCBjb2xvclszXSxcclxuICAgICAgICAgICAgY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM11cclxuICAgICAgICBdO1xyXG4gICAgICAgIGxldCBzdCAgPSBbXHJcbiAgICAgICAgICAgIDAuMCwgMC4wLFxyXG4gICAgICAgICAgICAxLjAsIDAuMCxcclxuICAgICAgICAgICAgMC4wLCAxLjAsXHJcbiAgICAgICAgICAgIDEuMCwgMS4wXHJcbiAgICAgICAgXTtcclxuICAgICAgICBsZXQgaWR4ID0gW1xyXG4gICAgICAgICAgICAwLCAxLCAyLFxyXG4gICAgICAgICAgICAyLCAxLCAzXHJcbiAgICAgICAgXTtcclxuICAgICAgICByZXR1cm4ge3Bvc2l0aW9uOiBwb3MsIG5vcm1hbDogbm9yLCBjb2xvcjogY29sLCB0ZXhDb29yZDogc3QsIGluZGV4OiBpZHh9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDlhobvvIhYWSDlubPpnaLlsZXplovvvInjga7poILngrnmg4XloLHjgpLnlJ/miJDjgZnjgotcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGxpdCAtIOWGhuOBruWGhuWRqOOBruWIhuWJsuaVsFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHJhZCAtIOWGhuOBruWNiuW+hFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY29sb3IgLSBSR0JBIOOCkiAwLjAg44GL44KJIDEuMCDjga7nr4Tlm7LjgafmjIflrprjgZfjgZ/phY3liJdcclxuICAgICAqIEByZXR1cm4ge29iamVjdH1cclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IHBvc2l0aW9uIC0g6aCC54K55bqn5qiZXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBub3JtYWwgLSDpoILngrnms5Xnt5pcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IGNvbG9yIC0g6aCC54K544Kr44Op44O8XHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSB0ZXhDb29yZCAtIOODhuOCr+OCueODgeODo+W6p+aomVxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gaW5kZXggLSDpoILngrnjgqTjg7Pjg4fjg4Pjgq/jgrnvvIhnbC5UUklBTkdMRVPvvIlcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiBsZXQgY2lyY2xlRGF0YSA9IGdsMy5NZXNoLmNpcmNsZSg2NCwgMS4wLCBbMS4wLCAxLjAsIDEuMCwgMS4wXSk7XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjaXJjbGUoc3BsaXQsIHJhZCwgY29sb3Ipe1xyXG4gICAgICAgIGxldCBpLCBqID0gMDtcclxuICAgICAgICBsZXQgcG9zID0gW10sIG5vciA9IFtdLFxyXG4gICAgICAgICAgICBjb2wgPSBbXSwgc3QgID0gW10sIGlkeCA9IFtdO1xyXG4gICAgICAgIHBvcy5wdXNoKDAuMCwgMC4wLCAwLjApO1xyXG4gICAgICAgIG5vci5wdXNoKDAuMCwgMC4wLCAxLjApO1xyXG4gICAgICAgIGNvbC5wdXNoKGNvbG9yWzBdLCBjb2xvclsxXSwgY29sb3JbMl0sIGNvbG9yWzNdKTtcclxuICAgICAgICBzdC5wdXNoKDAuNSwgMC41KTtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBzcGxpdDsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IHIgPSBNYXRoLlBJICogMi4wIC8gc3BsaXQgKiBpO1xyXG4gICAgICAgICAgICBsZXQgcnggPSBNYXRoLmNvcyhyKTtcclxuICAgICAgICAgICAgbGV0IHJ5ID0gTWF0aC5zaW4ocik7XHJcbiAgICAgICAgICAgIHBvcy5wdXNoKHJ4ICogcmFkLCByeSAqIHJhZCwgMC4wKTtcclxuICAgICAgICAgICAgbm9yLnB1c2goMC4wLCAwLjAsIDEuMCk7XHJcbiAgICAgICAgICAgIGNvbC5wdXNoKGNvbG9yWzBdLCBjb2xvclsxXSwgY29sb3JbMl0sIGNvbG9yWzNdKTtcclxuICAgICAgICAgICAgc3QucHVzaCgocnggKyAxLjApICogMC41LCAxLjAgLSAocnkgKyAxLjApICogMC41KTtcclxuICAgICAgICAgICAgaWYoaSA9PT0gc3BsaXQgLSAxKXtcclxuICAgICAgICAgICAgICAgIGlkeC5wdXNoKDAsIGogKyAxLCAxKTtcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpZHgucHVzaCgwLCBqICsgMSwgaiArIDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICsrajtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtwb3NpdGlvbjogcG9zLCBub3JtYWw6IG5vciwgY29sb3I6IGNvbCwgdGV4Q29vcmQ6IHN0LCBpbmRleDogaWR4fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44Kt44Ol44O844OW44Gu6aCC54K55oOF5aCx44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2lkZSAtIOato+eri+aWueS9k+OBruS4gOi+uuOBrumVt+OBlVxyXG4gICAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gY29sb3IgLSBSR0JBIOOCkiAwLjAg44GL44KJIDEuMCDjga7nr4Tlm7LjgafmjIflrprjgZfjgZ/phY3liJdcclxuICAgICAqIEByZXR1cm4ge29iamVjdH1cclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IHBvc2l0aW9uIC0g6aCC54K55bqn5qiZXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBub3JtYWwgLSDpoILngrnms5Xnt5og4oC744Kt44Ol44O844OW44Gu5Lit5b+D44GL44KJ5ZCE6aCC54K544Gr5ZCR44GL44Gj44Gm5Ly444Gz44KL44OZ44Kv44OI44Or44Gq44Gu44Gn5rOo5oSPXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBjb2xvciAtIOmggueCueOCq+ODqeODvFxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gdGV4Q29vcmQgLSDjg4bjgq/jgrnjg4Hjg6PluqfmqJlcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IGluZGV4IC0g6aCC54K544Kk44Oz44OH44OD44Kv44K577yIZ2wuVFJJQU5HTEVT77yJXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogbGV0IGN1YmVEYXRhID0gZ2wzLk1lc2guY3ViZSgyLjAsIFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGN1YmUoc2lkZSwgY29sb3Ipe1xyXG4gICAgICAgIGxldCBocyA9IHNpZGUgKiAwLjU7XHJcbiAgICAgICAgbGV0IHBvcyA9IFtcclxuICAgICAgICAgICAgLWhzLCAtaHMsICBocywgIGhzLCAtaHMsICBocywgIGhzLCAgaHMsICBocywgLWhzLCAgaHMsICBocyxcclxuICAgICAgICAgICAgLWhzLCAtaHMsIC1ocywgLWhzLCAgaHMsIC1ocywgIGhzLCAgaHMsIC1ocywgIGhzLCAtaHMsIC1ocyxcclxuICAgICAgICAgICAgLWhzLCAgaHMsIC1ocywgLWhzLCAgaHMsICBocywgIGhzLCAgaHMsICBocywgIGhzLCAgaHMsIC1ocyxcclxuICAgICAgICAgICAgLWhzLCAtaHMsIC1ocywgIGhzLCAtaHMsIC1ocywgIGhzLCAtaHMsICBocywgLWhzLCAtaHMsICBocyxcclxuICAgICAgICAgICAgIGhzLCAtaHMsIC1ocywgIGhzLCAgaHMsIC1ocywgIGhzLCAgaHMsICBocywgIGhzLCAtaHMsICBocyxcclxuICAgICAgICAgICAgLWhzLCAtaHMsIC1ocywgLWhzLCAtaHMsICBocywgLWhzLCAgaHMsICBocywgLWhzLCAgaHMsIC1oc1xyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IHYgPSAxLjAgLyBNYXRoLnNxcnQoMy4wKTtcclxuICAgICAgICBsZXQgbm9yID0gW1xyXG4gICAgICAgICAgICAtdiwgLXYsICB2LCAgdiwgLXYsICB2LCAgdiwgIHYsICB2LCAtdiwgIHYsICB2LFxyXG4gICAgICAgICAgICAtdiwgLXYsIC12LCAtdiwgIHYsIC12LCAgdiwgIHYsIC12LCAgdiwgLXYsIC12LFxyXG4gICAgICAgICAgICAtdiwgIHYsIC12LCAtdiwgIHYsICB2LCAgdiwgIHYsICB2LCAgdiwgIHYsIC12LFxyXG4gICAgICAgICAgICAtdiwgLXYsIC12LCAgdiwgLXYsIC12LCAgdiwgLXYsICB2LCAtdiwgLXYsICB2LFxyXG4gICAgICAgICAgICAgdiwgLXYsIC12LCAgdiwgIHYsIC12LCAgdiwgIHYsICB2LCAgdiwgLXYsICB2LFxyXG4gICAgICAgICAgICAtdiwgLXYsIC12LCAtdiwgLXYsICB2LCAtdiwgIHYsICB2LCAtdiwgIHYsIC12XHJcbiAgICAgICAgXTtcclxuICAgICAgICBsZXQgY29sID0gW107XHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHBvcy5sZW5ndGggLyAzOyBpKyspe1xyXG4gICAgICAgICAgICBjb2wucHVzaChjb2xvclswXSwgY29sb3JbMV0sIGNvbG9yWzJdLCBjb2xvclszXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBzdCA9IFtcclxuICAgICAgICAgICAgMC4wLCAwLjAsIDEuMCwgMC4wLCAxLjAsIDEuMCwgMC4wLCAxLjAsXHJcbiAgICAgICAgICAgIDAuMCwgMC4wLCAxLjAsIDAuMCwgMS4wLCAxLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgICAgICAwLjAsIDAuMCwgMS4wLCAwLjAsIDEuMCwgMS4wLCAwLjAsIDEuMCxcclxuICAgICAgICAgICAgMC4wLCAwLjAsIDEuMCwgMC4wLCAxLjAsIDEuMCwgMC4wLCAxLjAsXHJcbiAgICAgICAgICAgIDAuMCwgMC4wLCAxLjAsIDAuMCwgMS4wLCAxLjAsIDAuMCwgMS4wLFxyXG4gICAgICAgICAgICAwLjAsIDAuMCwgMS4wLCAwLjAsIDEuMCwgMS4wLCAwLjAsIDEuMFxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IGlkeCA9IFtcclxuICAgICAgICAgICAgIDAsICAxLCAgMiwgIDAsICAyLCAgMyxcclxuICAgICAgICAgICAgIDQsICA1LCAgNiwgIDQsICA2LCAgNyxcclxuICAgICAgICAgICAgIDgsICA5LCAxMCwgIDgsIDEwLCAxMSxcclxuICAgICAgICAgICAgMTIsIDEzLCAxNCwgMTIsIDE0LCAxNSxcclxuICAgICAgICAgICAgMTYsIDE3LCAxOCwgMTYsIDE4LCAxOSxcclxuICAgICAgICAgICAgMjAsIDIxLCAyMiwgMjAsIDIyLCAyM1xyXG4gICAgICAgIF07XHJcbiAgICAgICAgcmV0dXJuIHtwb3NpdGlvbjogcG9zLCBub3JtYWw6IG5vciwgY29sb3I6IGNvbCwgdGV4Q29vcmQ6IHN0LCBpbmRleDogaWR4fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5LiJ6KeS6YyQ44Gu6aCC54K55oOF5aCx44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3BsaXQgLSDlupXpnaLlhobjga7lhoblkajjga7liIblibLmlbBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSByYWQgLSDlupXpnaLlhobjga7ljYrlvoRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSDkuInop5LpjJDjga7pq5jjgZVcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNvbG9yIC0gUkdCQSDjgpIgMC4wIOOBi+OCiSAxLjAg44Gu56+E5Zuy44Gn5oyH5a6a44GX44Gf6YWN5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBwb3NpdGlvbiAtIOmggueCueW6p+aomVxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gbm9ybWFsIC0g6aCC54K55rOV57eaXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBjb2xvciAtIOmggueCueOCq+ODqeODvFxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gdGV4Q29vcmQgLSDjg4bjgq/jgrnjg4Hjg6PluqfmqJlcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IGluZGV4IC0g6aCC54K544Kk44Oz44OH44OD44Kv44K577yIZ2wuVFJJQU5HTEVT77yJXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogbGV0IGNvbmVEYXRhID0gZ2wzLk1lc2guY29uZSg2NCwgMS4wLCAyLjAsIFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNvbmUoc3BsaXQsIHJhZCwgaGVpZ2h0LCBjb2xvcil7XHJcbiAgICAgICAgbGV0IGksIGogPSAwO1xyXG4gICAgICAgIGxldCBoID0gaGVpZ2h0IC8gMi4wO1xyXG4gICAgICAgIGxldCBwb3MgPSBbXSwgbm9yID0gW10sXHJcbiAgICAgICAgICAgIGNvbCA9IFtdLCBzdCAgPSBbXSwgaWR4ID0gW107XHJcbiAgICAgICAgcG9zLnB1c2goMC4wLCAtaCwgMC4wKTtcclxuICAgICAgICBub3IucHVzaCgwLjAsIC0xLjAsIDAuMCk7XHJcbiAgICAgICAgY29sLnB1c2goY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10pO1xyXG4gICAgICAgIHN0LnB1c2goMC41LCAwLjUpO1xyXG4gICAgICAgIGZvcihpID0gMDsgaSA8PSBzcGxpdDsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IHIgPSBNYXRoLlBJICogMi4wIC8gc3BsaXQgKiBpO1xyXG4gICAgICAgICAgICBsZXQgcnggPSBNYXRoLmNvcyhyKTtcclxuICAgICAgICAgICAgbGV0IHJ6ID0gTWF0aC5zaW4ocik7XHJcbiAgICAgICAgICAgIHBvcy5wdXNoKFxyXG4gICAgICAgICAgICAgICAgcnggKiByYWQsIC1oLCByeiAqIHJhZCxcclxuICAgICAgICAgICAgICAgIHJ4ICogcmFkLCAtaCwgcnogKiByYWRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgbm9yLnB1c2goXHJcbiAgICAgICAgICAgICAgICAwLjAsIC0xLjAsIDAuMCxcclxuICAgICAgICAgICAgICAgIHJ4LCAwLjAsIHJ6XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNvbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10sXHJcbiAgICAgICAgICAgICAgICBjb2xvclswXSwgY29sb3JbMV0sIGNvbG9yWzJdLCBjb2xvclszXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBzdC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgKHJ4ICsgMS4wKSAqIDAuNSwgMS4wIC0gKHJ6ICsgMS4wKSAqIDAuNSxcclxuICAgICAgICAgICAgICAgIChyeCArIDEuMCkgKiAwLjUsIDEuMCAtIChyeiArIDEuMCkgKiAwLjVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYoaSAhPT0gc3BsaXQpe1xyXG4gICAgICAgICAgICAgICAgaWR4LnB1c2goMCwgaiArIDEsIGogKyAzKTtcclxuICAgICAgICAgICAgICAgIGlkeC5wdXNoKGogKyA0LCBqICsgMiwgc3BsaXQgKiAyICsgMyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaiArPSAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwb3MucHVzaCgwLjAsIGgsIDAuMCk7XHJcbiAgICAgICAgbm9yLnB1c2goMC4wLCAxLjAsIDAuMCk7XHJcbiAgICAgICAgY29sLnB1c2goY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10pO1xyXG4gICAgICAgIHN0LnB1c2goMC41LCAwLjUpO1xyXG4gICAgICAgIHJldHVybiB7cG9zaXRpb246IHBvcywgbm9ybWFsOiBub3IsIGNvbG9yOiBjb2wsIHRleENvb3JkOiBzdCwgaW5kZXg6IGlkeH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOWGhuafseOBrumggueCueaDheWgseOCkueUn+aIkOOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNwbGl0IC0g5YaG5p+x44Gu5YaG5ZGo44Gu5YiG5Ymy5pWwXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdG9wUmFkIC0g5YaG5p+x44Gu5aSp6Z2i44Gu5Y2K5b6EXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYm90dG9tUmFkIC0g5YaG5p+x44Gu5bqV6Z2i44Gu5Y2K5b6EXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0g5YaG5p+x44Gu6auY44GVXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjb2xvciAtIFJHQkEg44KSIDAuMCDjgYvjgokgMS4wIOOBruevhOWbsuOBp+aMh+WumuOBl+OBn+mFjeWIl1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fVxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gcG9zaXRpb24gLSDpoILngrnluqfmqJlcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IG5vcm1hbCAtIOmggueCueazlee3mlxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gY29sb3IgLSDpoILngrnjgqvjg6njg7xcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IHRleENvb3JkIC0g44OG44Kv44K544OB44Oj5bqn5qiZXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBpbmRleCAtIOmggueCueOCpOODs+ODh+ODg+OCr+OCue+8iGdsLlRSSUFOR0xFU++8iVxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGxldCBjeWxpbmRlckRhdGEgPSBnbDMuTWVzaC5jeWxpbmRlcig2NCwgMC41LCAxLjAsIDIuMCwgWzEuMCwgMS4wLCAxLjAsIDEuMF0pO1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY3lsaW5kZXIoc3BsaXQsIHRvcFJhZCwgYm90dG9tUmFkLCBoZWlnaHQsIGNvbG9yKXtcclxuICAgICAgICBsZXQgaSwgaiA9IDI7XHJcbiAgICAgICAgbGV0IGggPSBoZWlnaHQgLyAyLjA7XHJcbiAgICAgICAgbGV0IHBvcyA9IFtdLCBub3IgPSBbXSxcclxuICAgICAgICAgICAgY29sID0gW10sIHN0ICA9IFtdLCBpZHggPSBbXTtcclxuICAgICAgICBwb3MucHVzaCgwLjAsIGgsIDAuMCwgMC4wLCAtaCwgMC4wLCk7XHJcbiAgICAgICAgbm9yLnB1c2goMC4wLCAxLjAsIDAuMCwgMC4wLCAtMS4wLCAwLjApO1xyXG4gICAgICAgIGNvbC5wdXNoKFxyXG4gICAgICAgICAgICBjb2xvclswXSwgY29sb3JbMV0sIGNvbG9yWzJdLCBjb2xvclszXSxcclxuICAgICAgICAgICAgY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM11cclxuICAgICAgICApO1xyXG4gICAgICAgIHN0LnB1c2goMC41LCAwLjUsIDAuNSwgMC41KTtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPD0gc3BsaXQ7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCByID0gTWF0aC5QSSAqIDIuMCAvIHNwbGl0ICogaTtcclxuICAgICAgICAgICAgbGV0IHJ4ID0gTWF0aC5jb3Mocik7XHJcbiAgICAgICAgICAgIGxldCByeiA9IE1hdGguc2luKHIpO1xyXG4gICAgICAgICAgICBwb3MucHVzaChcclxuICAgICAgICAgICAgICAgIHJ4ICogdG9wUmFkLCAgaCwgcnogKiB0b3BSYWQsXHJcbiAgICAgICAgICAgICAgICByeCAqIHRvcFJhZCwgIGgsIHJ6ICogdG9wUmFkLFxyXG4gICAgICAgICAgICAgICAgcnggKiBib3R0b21SYWQsIC1oLCByeiAqIGJvdHRvbVJhZCxcclxuICAgICAgICAgICAgICAgIHJ4ICogYm90dG9tUmFkLCAtaCwgcnogKiBib3R0b21SYWRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgbm9yLnB1c2goXHJcbiAgICAgICAgICAgICAgICAwLjAsIDEuMCwgMC4wLFxyXG4gICAgICAgICAgICAgICAgcngsIDAuMCwgcnosXHJcbiAgICAgICAgICAgICAgICAwLjAsIC0xLjAsIDAuMCxcclxuICAgICAgICAgICAgICAgIHJ4LCAwLjAsIHJ6XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNvbC5wdXNoKFxyXG4gICAgICAgICAgICAgICAgY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10sXHJcbiAgICAgICAgICAgICAgICBjb2xvclswXSwgY29sb3JbMV0sIGNvbG9yWzJdLCBjb2xvclszXSxcclxuICAgICAgICAgICAgICAgIGNvbG9yWzBdLCBjb2xvclsxXSwgY29sb3JbMl0sIGNvbG9yWzNdLFxyXG4gICAgICAgICAgICAgICAgY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM11cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgc3QucHVzaChcclxuICAgICAgICAgICAgICAgIChyeCArIDEuMCkgKiAwLjUsIDEuMCAtIChyeiArIDEuMCkgKiAwLjUsXHJcbiAgICAgICAgICAgICAgICAxLjAgLSBpIC8gc3BsaXQsIDAuMCxcclxuICAgICAgICAgICAgICAgIChyeCArIDEuMCkgKiAwLjUsIDEuMCAtIChyeiArIDEuMCkgKiAwLjUsXHJcbiAgICAgICAgICAgICAgICAxLjAgLSBpIC8gc3BsaXQsIDEuMFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZihpICE9PSBzcGxpdCl7XHJcbiAgICAgICAgICAgICAgICBpZHgucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAwLCBqICsgNCwgaixcclxuICAgICAgICAgICAgICAgICAgICAxLCBqICsgMiwgaiArIDYsXHJcbiAgICAgICAgICAgICAgICAgICAgaiArIDUsIGogKyA3LCBqICsgMSxcclxuICAgICAgICAgICAgICAgICAgICBqICsgMSwgaiArIDcsIGogKyAzXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGogKz0gNDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtwb3NpdGlvbjogcG9zLCBub3JtYWw6IG5vciwgY29sb3I6IGNvbCwgdGV4Q29vcmQ6IHN0LCBpbmRleDogaWR4fVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog55CD5L2T44Gu6aCC54K55oOF5aCx44KS55Sf5oiQ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcm93IC0g55CD44Gu57im5pa55ZCR77yI57ev5bqm5pa55ZCR77yJ44Gu5YiG5Ymy5pWwXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29sdW1uIC0g55CD44Gu5qiq5pa55ZCR77yI57WM5bqm5pa55ZCR77yJ44Gu5YiG5Ymy5pWwXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmFkIC0g55CD44Gu5Y2K5b6EXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjb2xvciAtIFJHQkEg44KSIDAuMCDjgYvjgokgMS4wIOOBruevhOWbsuOBp+aMh+WumuOBl+OBn+mFjeWIl1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fVxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gcG9zaXRpb24gLSDpoILngrnluqfmqJlcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IG5vcm1hbCAtIOmggueCueazlee3mlxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gY29sb3IgLSDpoILngrnjgqvjg6njg7xcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IHRleENvb3JkIC0g44OG44Kv44K544OB44Oj5bqn5qiZXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBpbmRleCAtIOmggueCueOCpOODs+ODh+ODg+OCr+OCue+8iGdsLlRSSUFOR0xFU++8iVxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGxldCBzcGhlcmVEYXRhID0gZ2wzLk1lc2guc3BoZXJlKDY0LCA2NCwgMS4wLCBbMS4wLCAxLjAsIDEuMCwgMS4wXSk7XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBzcGhlcmUocm93LCBjb2x1bW4sIHJhZCwgY29sb3Ipe1xyXG4gICAgICAgIGxldCBpLCBqO1xyXG4gICAgICAgIGxldCBwb3MgPSBbXSwgbm9yID0gW10sXHJcbiAgICAgICAgICAgIGNvbCA9IFtdLCBzdCAgPSBbXSwgaWR4ID0gW107XHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDw9IHJvdzsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IHIgPSBNYXRoLlBJIC8gcm93ICogaTtcclxuICAgICAgICAgICAgbGV0IHJ5ID0gTWF0aC5jb3Mocik7XHJcbiAgICAgICAgICAgIGxldCByciA9IE1hdGguc2luKHIpO1xyXG4gICAgICAgICAgICBmb3IoaiA9IDA7IGogPD0gY29sdW1uOyBqKyspe1xyXG4gICAgICAgICAgICAgICAgbGV0IHRyID0gTWF0aC5QSSAqIDIgLyBjb2x1bW4gKiBqO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR4ID0gcnIgKiByYWQgKiBNYXRoLmNvcyh0cik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHkgPSByeSAqIHJhZDtcclxuICAgICAgICAgICAgICAgIGxldCB0eiA9IHJyICogcmFkICogTWF0aC5zaW4odHIpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJ4ID0gcnIgKiBNYXRoLmNvcyh0cik7XHJcbiAgICAgICAgICAgICAgICBsZXQgcnogPSByciAqIE1hdGguc2luKHRyKTtcclxuICAgICAgICAgICAgICAgIHBvcy5wdXNoKHR4LCB0eSwgdHopO1xyXG4gICAgICAgICAgICAgICAgbm9yLnB1c2gocngsIHJ5LCByeik7XHJcbiAgICAgICAgICAgICAgICBjb2wucHVzaChjb2xvclswXSwgY29sb3JbMV0sIGNvbG9yWzJdLCBjb2xvclszXSk7XHJcbiAgICAgICAgICAgICAgICBzdC5wdXNoKDEgLSAxIC8gY29sdW1uICogaiwgMSAvIHJvdyAqIGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihpID0gMDsgaSA8IHJvdzsgaSsrKXtcclxuICAgICAgICAgICAgZm9yKGogPSAwOyBqIDwgY29sdW1uOyBqKyspe1xyXG4gICAgICAgICAgICAgICAgbGV0IHIgPSAoY29sdW1uICsgMSkgKiBpICsgajtcclxuICAgICAgICAgICAgICAgIGlkeC5wdXNoKHIsIHIgKyAxLCByICsgY29sdW1uICsgMik7XHJcbiAgICAgICAgICAgICAgICBpZHgucHVzaChyLCByICsgY29sdW1uICsgMiwgciArIGNvbHVtbiArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7cG9zaXRpb246IHBvcywgbm9ybWFsOiBub3IsIGNvbG9yOiBjb2wsIHRleENvb3JkOiBzdCwgaW5kZXg6IGlkeH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODiOODvOODqeOCueOBrumggueCueaDheWgseOCkueUn+aIkOOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHJvdyAtIOi8quOBruWIhuWJsuaVsFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvbHVtbiAtIOODkeOCpOODl+aWremdouOBruWIhuWJsuaVsFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGlyYWQgLSDjg5HjgqTjg5fmlq3pnaLjga7ljYrlvoRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcmFkIC0g44OR44Kk44OX5YWo5L2T44Gu5Y2K5b6EXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSBjb2xvciAtIFJHQkEg44KSIDAuMCDjgYvjgokgMS4wIOOBruevhOWbsuOBp+aMh+WumuOBl+OBn+mFjeWIl1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fVxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gcG9zaXRpb24gLSDpoILngrnluqfmqJlcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IG5vcm1hbCAtIOmggueCueazlee3mlxyXG4gICAgICogQHByb3BlcnR5IHtBcnJheS48bnVtYmVyPn0gY29sb3IgLSDpoILngrnjgqvjg6njg7xcclxuICAgICAqIEBwcm9wZXJ0eSB7QXJyYXkuPG51bWJlcj59IHRleENvb3JkIC0g44OG44Kv44K544OB44Oj5bqn5qiZXHJcbiAgICAgKiBAcHJvcGVydHkge0FycmF5LjxudW1iZXI+fSBpbmRleCAtIOmggueCueOCpOODs+ODh+ODg+OCr+OCue+8iGdsLlRSSUFOR0xFU++8iVxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIGxldCB0b3J1c0RhdGEgPSBnbDMuTWVzaC50b3J1cyg2NCwgNjQsIDAuMjUsIDAuNzUsIFsxLjAsIDEuMCwgMS4wLCAxLjBdKTtcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHRvcnVzKHJvdywgY29sdW1uLCBpcmFkLCBvcmFkLCBjb2xvcil7XHJcbiAgICAgICAgbGV0IGksIGo7XHJcbiAgICAgICAgbGV0IHBvcyA9IFtdLCBub3IgPSBbXSxcclxuICAgICAgICAgICAgY29sID0gW10sIHN0ICA9IFtdLCBpZHggPSBbXTtcclxuICAgICAgICBmb3IoaSA9IDA7IGkgPD0gcm93OyBpKyspe1xyXG4gICAgICAgICAgICBsZXQgciA9IE1hdGguUEkgKiAyIC8gcm93ICogaTtcclxuICAgICAgICAgICAgbGV0IHJyID0gTWF0aC5jb3Mocik7XHJcbiAgICAgICAgICAgIGxldCByeSA9IE1hdGguc2luKHIpO1xyXG4gICAgICAgICAgICBmb3IoaiA9IDA7IGogPD0gY29sdW1uOyBqKyspe1xyXG4gICAgICAgICAgICAgICAgbGV0IHRyID0gTWF0aC5QSSAqIDIgLyBjb2x1bW4gKiBqO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR4ID0gKHJyICogaXJhZCArIG9yYWQpICogTWF0aC5jb3ModHIpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5ID0gcnkgKiBpcmFkO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR6ID0gKHJyICogaXJhZCArIG9yYWQpICogTWF0aC5zaW4odHIpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJ4ID0gcnIgKiBNYXRoLmNvcyh0cik7XHJcbiAgICAgICAgICAgICAgICBsZXQgcnogPSByciAqIE1hdGguc2luKHRyKTtcclxuICAgICAgICAgICAgICAgIGxldCBycyA9IDEgLyBjb2x1bW4gKiBqO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJ0ID0gMSAvIHJvdyAqIGkgKyAwLjU7XHJcbiAgICAgICAgICAgICAgICBpZihydCA+IDEuMCl7cnQgLT0gMS4wO31cclxuICAgICAgICAgICAgICAgIHJ0ID0gMS4wIC0gcnQ7XHJcbiAgICAgICAgICAgICAgICBwb3MucHVzaCh0eCwgdHksIHR6KTtcclxuICAgICAgICAgICAgICAgIG5vci5wdXNoKHJ4LCByeSwgcnopO1xyXG4gICAgICAgICAgICAgICAgY29sLnB1c2goY29sb3JbMF0sIGNvbG9yWzFdLCBjb2xvclsyXSwgY29sb3JbM10pO1xyXG4gICAgICAgICAgICAgICAgc3QucHVzaChycywgcnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvcihpID0gMDsgaSA8IHJvdzsgaSsrKXtcclxuICAgICAgICAgICAgZm9yKGogPSAwOyBqIDwgY29sdW1uOyBqKyspe1xyXG4gICAgICAgICAgICAgICAgbGV0IHIgPSAoY29sdW1uICsgMSkgKiBpICsgajtcclxuICAgICAgICAgICAgICAgIGlkeC5wdXNoKHIsIHIgKyBjb2x1bW4gKyAxLCByICsgMSk7XHJcbiAgICAgICAgICAgICAgICBpZHgucHVzaChyICsgY29sdW1uICsgMSwgciArIGNvbHVtbiArIDIsIHIgKyAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge3Bvc2l0aW9uOiBwb3MsIG5vcm1hbDogbm9yLCBjb2xvcjogY29sLCB0ZXhDb29yZDogc3QsIGluZGV4OiBpZHh9XHJcbiAgICB9XHJcbn1cclxuXHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2dsM01lc2guanMiLCJcclxuLyoqXHJcbiAqIGdsM1V0aWxcclxuICogQGNsYXNzIGdsM1V0aWxcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGdsM1V0aWwge1xyXG4gICAgLyoqXHJcbiAgICAgKiBIU1Yg44Kr44Op44O844KS55Sf5oiQ44GX44Gm6YWN5YiX44Gn6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaCAtIOiJsuebuFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHMgLSDlvanluqZcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2IC0g5piO5bqmXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYSAtIOOCouODq+ODleOCoVxyXG4gICAgICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59IFJHQkEg44KSIDAuMCDjgYvjgokgMS4wIOOBruevhOWbsuOBq+ato+imj+WMluOBl+OBn+iJsuOBrumFjeWIl1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgaHN2YShoLCBzLCB2LCBhKXtcclxuICAgICAgICBpZihzID4gMSB8fCB2ID4gMSB8fCBhID4gMSl7cmV0dXJuO31cclxuICAgICAgICBsZXQgdGggPSBoICUgMzYwO1xyXG4gICAgICAgIGxldCBpID0gTWF0aC5mbG9vcih0aCAvIDYwKTtcclxuICAgICAgICBsZXQgZiA9IHRoIC8gNjAgLSBpO1xyXG4gICAgICAgIGxldCBtID0gdiAqICgxIC0gcyk7XHJcbiAgICAgICAgbGV0IG4gPSB2ICogKDEgLSBzICogZik7XHJcbiAgICAgICAgbGV0IGsgPSB2ICogKDEgLSBzICogKDEgLSBmKSk7XHJcbiAgICAgICAgbGV0IGNvbG9yID0gbmV3IEFycmF5KCk7XHJcbiAgICAgICAgaWYoIXMgPiAwICYmICFzIDwgMCl7XHJcbiAgICAgICAgICAgIGNvbG9yLnB1c2godiwgdiwgdiwgYSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IHIgPSBuZXcgQXJyYXkodiwgbiwgbSwgbSwgaywgdik7XHJcbiAgICAgICAgICAgIGxldCBnID0gbmV3IEFycmF5KGssIHYsIHYsIG4sIG0sIG0pO1xyXG4gICAgICAgICAgICBsZXQgYiA9IG5ldyBBcnJheShtLCBtLCBrLCB2LCB2LCBuKTtcclxuICAgICAgICAgICAgY29sb3IucHVzaChyW2ldLCBnW2ldLCBiW2ldLCBhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbG9yO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44Kk44O844K444Oz44KwXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdCAtIDAuMCDjgYvjgokgMS4wIOOBruWApFxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDjgqTjg7zjgrjjg7PjgrDjgZfjgZ/ntZDmnpxcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGVhc2VMaW5lcih0KXtcclxuICAgICAgICByZXR1cm4gdCA8IDAuNSA/IDQgKiB0ICogdCAqIHQgOiAodCAtIDEpICogKDIgKiB0IC0gMikgKiAoMiAqIHQgLSAyKSArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjgqTjg7zjgrjjg7PjgrBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB0IC0gMC4wIOOBi+OCiSAxLjAg44Gu5YCkXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOOCpOODvOOCuOODs+OCsOOBl+OBn+e1kOaenFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZWFzZU91dEN1YmljKHQpe1xyXG4gICAgICAgIHJldHVybiAodCA9IHQgLyAxIC0gMSkgKiB0ICogdCArIDE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjgqTjg7zjgrjjg7PjgrBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB0IC0gMC4wIOOBi+OCiSAxLjAg44Gu5YCkXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOOCpOODvOOCuOODs+OCsOOBl+OBn+e1kOaenFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZWFzZVF1aW50aWModCl7XHJcbiAgICAgICAgbGV0IHRzID0gKHQgPSB0IC8gMSkgKiB0O1xyXG4gICAgICAgIGxldCB0YyA9IHRzICogdDtcclxuICAgICAgICByZXR1cm4gKHRjICogdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5bqm5pWw5rOV44Gu6KeS5bqm44GL44KJ5byn5bqm5rOV44Gu5YCk44G45aSJ5o+b44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVnIC0g5bqm5pWw5rOV44Gu6KeS5bqmXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOW8p+W6puazleOBruWApFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZGVnVG9SYWQoZGVnKXtcclxuICAgICAgICByZXR1cm4gKGRlZyAlIDM2MCkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6LWk6YGT5Y2K5b6E77yIa23vvIlcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXQgRUFSVEhfUkFESVVTKCl7cmV0dXJuIDYzNzguMTM3O31cclxuXHJcbiAgICAvKipcclxuICAgICAqIOi1pOmBk+WGhuWRqO+8iGtt77yJXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0IEVBUlRIX0NJUkNVTSgpe3JldHVybiBnbDNVdGlsLkVBUlRIX1JBRElVUyAqIE1hdGguUEkgKiAyLjA7fVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog6LWk6YGT5YaG5ZGo44Gu5Y2K5YiG77yIa23vvIlcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXQgRUFSVEhfSEFMRl9DSVJDVU0oKXtyZXR1cm4gZ2wzVXRpbC5FQVJUSF9SQURJVVMgKiBNYXRoLlBJO31cclxuXHJcbiAgICAvKipcclxuICAgICAqIOODoeODq+OCq+ODiOODq+W6p+aomeezu+OBq+OBiuOBkeOCi+acgOWkp+e3r+W6plxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldCBFQVJUSF9NQVhfTEFUKCl7cmV0dXJuIDg1LjA1MTEyODc4O31cclxuXHJcbiAgICAvKipcclxuICAgICAqIOe1jOW6puOCkuWFg+OBq+ODoeODq+OCq+ODiOODq+W6p+aomeOCkui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvbiAtIOe1jOW6plxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDjg6Hjg6vjgqvjg4jjg6vluqfmqJnns7vjgavjgYrjgZHjgosgWFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbG9uVG9NZXIobG9uKXtcclxuICAgICAgICByZXR1cm4gZ2wzVXRpbC5FQVJUSF9SQURJVVMgKiBnbDNVdGlsLmRlZ1RvUmFkKGxvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnt6/luqbjgpLlhYPjgavjg6Hjg6vjgqvjg4jjg6vluqfmqJnjgpLov5TjgZlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsYXQgLSDnt6/luqZcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZmxhdHRlbj0wXSAtIOaJgeW5s+eOh1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDjg6Hjg6vjgqvjg4jjg6vluqfmqJnns7vjgavjgYrjgZHjgosgWVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbGF0VG9NZXIobGF0LCBmbGF0dGVuID0gMCl7XHJcbiAgICAgICAgbGV0IGZsYXR0ZW5pbmcgPSBmbGF0dGVuO1xyXG4gICAgICAgIGlmKGlzTmFOKHBhcnNlRmxvYXQoZmxhdHRlbikpKXtcclxuICAgICAgICAgICAgZmxhdHRlbmluZyA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjbGFtcCA9IDAuMDAwMTtcclxuICAgICAgICBpZihsYXQgPj0gOTAgLSBjbGFtcCl7XHJcbiAgICAgICAgICAgIGxhdCA9IDkwIC0gY2xhbXA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGxhdCA8PSAtOTAgKyBjbGFtcCl7XHJcbiAgICAgICAgICAgIGxhdCA9IC05MCArIGNsYW1wO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdGVtcCA9ICgxIC0gZmxhdHRlbmluZyk7XHJcbiAgICAgICAgbGV0IGVzID0gMS4wIC0gKHRlbXAgKiB0ZW1wKTtcclxuICAgICAgICBsZXQgZWNjZW50ID0gTWF0aC5zcXJ0KGVzKTtcclxuICAgICAgICBsZXQgcGhpID0gZ2wzVXRpbC5kZWdUb1JhZChsYXQpO1xyXG4gICAgICAgIGxldCBzaW5waGkgPSBNYXRoLnNpbihwaGkpO1xyXG4gICAgICAgIGxldCBjb24gPSBlY2NlbnQgKiBzaW5waGk7XHJcbiAgICAgICAgbGV0IGNvbSA9IDAuNSAqIGVjY2VudDtcclxuICAgICAgICBjb24gPSBNYXRoLnBvdygoMS4wIC0gY29uKSAvICgxLjAgKyBjb24pLCBjb20pO1xyXG4gICAgICAgIGxldCB0cyA9IE1hdGgudGFuKDAuNSAqIChNYXRoLlBJICogMC41IC0gcGhpKSkgLyBjb247XHJcbiAgICAgICAgcmV0dXJuIGdsM1V0aWwuRUFSVEhfUkFESVVTICogTWF0aC5sb2codHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog57ev5bqm57WM5bqm44KS44Oh44Or44Kr44OI44Or5bqn5qiZ57O744Gr5aSJ5o+b44GX44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbG9uIC0g57WM5bqmXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGF0IC0g57ev5bqmXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2ZsYXR0ZW49MF0gLSDmiYHlubPnjodcclxuICAgICAqIEByZXR1cm4ge29ian1cclxuICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB4IC0g44Oh44Or44Kr44OI44Or5bqn5qiZ57O744Gr44GK44GR44KLIFgg5bqn5qiZXHJcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0geSAtIOODoeODq+OCq+ODiOODq+W6p+aomeezu+OBq+OBiuOBkeOCiyBZIOW6p+aomVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbG9uTGF0VG9NZXIobG9uLCBsYXQsIGZsYXR0ZW4gPSAwKXtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBnbDNVdGlsLmxvblRvTWVyKGxvbiksXHJcbiAgICAgICAgICAgIHk6IGdsM1V0aWwubGF0VG9NZXIobGF0LCBmbGF0dGVuaW5nKVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjg6Hjg6vjgqvjg4jjg6vluqfmqJnjgpLnt6/luqbntYzluqbjgavlpInmj5vjgZfjgabov5TjgZlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0g44Oh44Or44Kr44OI44Or5bqn5qiZ57O744Gr44GK44GR44KLIFgg5bqn5qiZXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIOODoeODq+OCq+ODiOODq+W6p+aomeezu+OBq+OBiuOBkeOCiyBZIOW6p+aomVxyXG4gICAgICogQHJldHVybiB7b2JqfVxyXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGxvbiAtIOe1jOW6plxyXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGxhdCAtIOe3r+W6plxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbWVyVG9Mb25MYXQoeCwgeSl7XHJcbiAgICAgICAgbGV0IGxvbiA9ICh4IC8gZ2wzVXRpbC5FQVJUSF9IQUxGX0NJUkNVTSkgKiAxODA7XHJcbiAgICAgICAgbGV0IGxhdCA9ICh5IC8gZ2wzVXRpbC5FQVJUSF9IQUxGX0NJUkNVTSkgKiAxODA7XHJcbiAgICAgICAgbGF0ID0gMTgwIC8gTWF0aC5QSSAqICgyICogTWF0aC5hdGFuKE1hdGguZXhwKGxhdCAqIE1hdGguUEkgLyAxODApKSAtIE1hdGguUEkgLyAyKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsb246IGxvbixcclxuICAgICAgICAgICAgbGF0OiBsYXRcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog57WM5bqm44GL44KJ44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K544KS5rGC44KB44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbG9uIC0g57WM5bqmXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIOOCuuODvOODoOODrOODmeODq1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDntYzluqbmlrnlkJHjga7jgr/jgqTjg6vjgqTjg7Pjg4fjg4Pjgq/jgrlcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGxvblRvVGlsZShsb24sIHpvb20pe1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKChsb24gLyAxODAgKyAxKSAqIE1hdGgucG93KDIsIHpvb20pIC8gMik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDnt6/luqbjgYvjgonjgr/jgqTjg6vjgqTjg7Pjg4fjg4Pjgq/jgrnjgpLmsYLjgoHjgabov5TjgZlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsYXQgLSDnt6/luqZcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0g44K644O844Og44Os44OZ44OrXHJcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IOe3r+W6puaWueWQkeOBruOCv+OCpOODq+OCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbGF0VG9UaWxlKGxhdCwgem9vbSl7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKC1NYXRoLmxvZyhNYXRoLnRhbigoNDUgKyBsYXQgLyAyKSAqIE1hdGguUEkgLyAxODApKSArIE1hdGguUEkpICogTWF0aC5wb3coMiwgem9vbSkgLyAoMiAqIE1hdGguUEkpKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIOe3r+W6pue1jOW6puOCkuOCv+OCpOODq+OCpOODs+ODh+ODg+OCr+OCueOBq+WkieaPm+OBl+OBpui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvbiAtIOe1jOW6plxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxhdCAtIOe3r+W6plxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb20gLSDjgrrjg7zjg6Djg6zjg5njg6tcclxuICAgICAqIEByZXR1cm4ge29ian1cclxuICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsb24gLSDntYzluqbmlrnlkJHjga7jgr/jgqTjg6vjgqTjg7Pjg4fjg4Pjgq/jgrlcclxuICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBsYXQgLSDnt6/luqbmlrnlkJHjga7jgr/jgqTjg6vjgqTjg7Pjg4fjg4Pjgq/jgrlcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGxvbkxhdFRvVGlsZShsb24sIGxhdCwgem9vbSl7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbG9uOiBnbDNVdGlsLmxvblRvVGlsZShsb24sIHpvb20pLFxyXG4gICAgICAgICAgICBsYXQ6IGdsM1V0aWwubGF0VG9UaWxlKGxhdCwgem9vbSlcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K544GL44KJ57WM5bqm44KS5rGC44KB44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbG9uIC0g57WM5bqm5pa55ZCR44Gu44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K5XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIOOCuuODvOODoOODrOODmeODq1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDntYzluqZcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHRpbGVUb0xvbihsb24sIHpvb20pe1xyXG4gICAgICAgIHJldHVybiAobG9uIC8gTWF0aC5wb3coMiwgem9vbSkpICogMzYwIC0gMTgwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K544GL44KJ57ev5bqm44KS5rGC44KB44Gm6L+U44GZXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGF0IC0g57ev5bqm5pa55ZCR44Gu44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K5XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gem9vbSAtIOOCuuODvOODoOODrOODmeODq1xyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDnt6/luqZcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHRpbGVUb0xhdChsYXQsIHpvb20pe1xyXG4gICAgICAgIGxldCB5ID0gKGxhdCAvIE1hdGgucG93KDIsIHpvb20pKSAqIDIgKiBNYXRoLlBJIC0gTWF0aC5QSTtcclxuICAgICAgICByZXR1cm4gMiAqIE1hdGguYXRhbihNYXRoLnBvdyhNYXRoLkUsIC15KSkgKiAxODAgLyBNYXRoLlBJIC0gOTA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiDjgr/jgqTjg6vjgqTjg7Pjg4fjg4Pjgq/jgrnjgYvjgonnt6/luqbntYzluqbjgpLmsYLjgoHjgabov5TjgZlcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsb24gLSDntYzluqZcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsYXQgLSDnt6/luqZcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB6b29tIC0g44K644O844Og44Os44OZ44OrXHJcbiAgICAgKiBAcmV0dXJuIHtvYmp9XHJcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gbG9uIC0g57WM5bqm5pa55ZCR44Gu44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K5XHJcbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gbGF0IC0g57ev5bqm5pa55ZCR44Gu44K/44Kk44Or44Kk44Oz44OH44OD44Kv44K5XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB0aWxlVG9Mb25MYXQobG9uLCBsYXQsIHpvb20pe1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGxvbjogZ2wzVXRpbC50aWxlVG9Mb24obG9uLCB6b29tKSxcclxuICAgICAgICAgICAgbGF0OiBnbDNVdGlsLnRpbGVUb0xhdChsYXQsIHpvb20pXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vZ2wzVXRpbC5qcyIsIlxyXG4vKipcclxuICogQGV4YW1wbGVcclxuICogbGV0IHdyYXBwZXIgPSBuZXcgZ2wzLkd1aS5XcmFwcGVyKCk7XHJcbiAqIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQod3JhcHBlci5nZXRFbGVtZW50KCkpO1xyXG4gKlxyXG4gKiBsZXQgc2xpZGVyID0gbmV3IGdsMy5HdWkuU2xpZGVyKCd0ZXN0JywgNTAsIDAsIDEwMCwgMSk7XHJcbiAqIHNsaWRlci5hZGQoJ2lucHV0JywgKGV2ZSwgc2VsZikgPT4ge2NvbnNvbGUubG9nKHNlbGYuZ2V0VmFsdWUoKSk7fSk7XHJcbiAqIHdyYXBwZXIuYXBwZW5kKHNsaWRlci5nZXRFbGVtZW50KCkpO1xyXG4gKlxyXG4gKiBsZXQgY2hlY2sgPSBuZXcgZ2wzLkd1aS5DaGVja2JveCgnaG9nZScsIGZhbHNlKTtcclxuICogY2hlY2suYWRkKCdjaGFuZ2UnLCAoZXZlLCBzZWxmKSA9PiB7Y29uc29sZS5sb2coc2VsZi5nZXRWYWx1ZSgpKTt9KTtcclxuICogd3JhcHBlci5hcHBlbmQoY2hlY2suZ2V0RWxlbWVudCgpKTtcclxuICpcclxuICogbGV0IHJhZGlvID0gbmV3IGdsMy5HdWkuUmFkaW8oJ2hvZ2UnLCBudWxsLCBmYWxzZSk7XHJcbiAqIHJhZGlvLmFkZCgnY2hhbmdlJywgKGV2ZSwgc2VsZikgPT4ge2NvbnNvbGUubG9nKHNlbGYuZ2V0VmFsdWUoKSk7fSk7XHJcbiAqIHdyYXBwZXIuYXBwZW5kKHJhZGlvLmdldEVsZW1lbnQoKSk7XHJcbiAqXHJcbiAqIGxldCBzZWxlY3QgPSBuZXcgZ2wzLkd1aS5TZWxlY3QoJ2Z1Z2EnLCBbJ2ZvbycsICdiYWEnXSwgMCk7XHJcbiAqIHNlbGVjdC5hZGQoJ2NoYW5nZScsIChldmUsIHNlbGYpID0+IHtjb25zb2xlLmxvZyhzZWxmLmdldFZhbHVlKCkpO30pO1xyXG4gKiB3cmFwcGVyLmFwcGVuZChzZWxlY3QuZ2V0RWxlbWVudCgpKTtcclxuICpcclxuICogbGV0IHNwaW4gPSBuZXcgZ2wzLkd1aS5TcGluKCdob2dlJywgMC4wLCAtMS4wLCAxLjAsIDAuMSk7XHJcbiAqIHNwaW4uYWRkKCdpbnB1dCcsIChldmUsIHNlbGYpID0+IHtjb25zb2xlLmxvZyhzZWxmLmdldFZhbHVlKCkpO30pO1xyXG4gKiB3cmFwcGVyLmFwcGVuZChzcGluLmdldEVsZW1lbnQoKSk7XHJcbiAqXHJcbiAqIGxldCBjb2xvciA9IG5ldyBnbDMuR3VpLkNvbG9yKCdmdWdhJywgJyNmZjAwMDAnKTtcclxuICogY29sb3IuYWRkKCdjaGFuZ2UnLCAoZXZlLCBzZWxmKSA9PiB7Y29uc29sZS5sb2coc2VsZi5nZXRWYWx1ZSgpLCBzZWxmLmdldEZsb2F0VmFsdWUoKSk7fSk7XHJcbiAqIHdyYXBwZXIuYXBwZW5kKGNvbG9yLmdldEVsZW1lbnQoKSk7XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIGdsM0d1aVxyXG4gKiBAY2xhc3MgZ2wzR3VpXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBnbDNHdWkge1xyXG4gICAgLyoqXHJcbiAgICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoKXtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUlXcmFwcGVyXHJcbiAgICAgICAgICogQHR5cGUge0dVSVdyYXBwZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5XcmFwcGVyID0gR1VJV3JhcHBlcjtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUlFbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0dVSUVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5FbGVtZW50ID0gR1VJRWxlbWVudDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUlTbGlkZXJcclxuICAgICAgICAgKiBAdHlwZSB7R1VJU2xpZGVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuU2xpZGVyID0gR1VJU2xpZGVyO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdVSUNoZWNrYm94XHJcbiAgICAgICAgICogQHR5cGUge0dVSUNoZWNrYm94fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuQ2hlY2tib3ggPSBHVUlDaGVja2JveDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUlSYWRpb1xyXG4gICAgICAgICAqIEB0eXBlIHtHVUlSYWRpb31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLlJhZGlvID0gR1VJUmFkaW87XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR1VJU2VsZWN0XHJcbiAgICAgICAgICogQHR5cGUge0dVSVNlbGVjdH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLlNlbGVjdCA9IEdVSVNlbGVjdDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUlTcGluXHJcbiAgICAgICAgICogQHR5cGUge0dVSVNwaW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5TcGluID0gR1VJU3BpbjtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUlDb2xvclxyXG4gICAgICAgICAqIEB0eXBlIHtHVUlDb2xvcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLkNvbG9yID0gR1VJQ29sb3I7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHVUlXcmFwcGVyXHJcbiAqIEBjbGFzcyBHVUlXcmFwcGVyXHJcbiAqL1xyXG5jbGFzcyBHVUlXcmFwcGVyIHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR1VJIOWFqOS9k+OCkuWMheOCgOODqeODg+ODkeODvCBET01cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTERpdkVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudG9wID0gJzBweCc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnJpZ2h0ID0gJzBweCc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gJzM0MHB4JztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2l0aW9uID0gJ3JpZ2h0IDAuOHMgY3ViaWMtYmV6aWVyKDAsIDAsIDAsIDEuMCknO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdVSSDjg5Hjg7zjg4TjgpLljIXjgoDjg6njg4Pjg5Hjg7wgRE9NXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxEaXZFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMud3JhcHBlci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSg2NCwgNjQsIDY0LCAwLjUpJztcclxuICAgICAgICB0aGlzLndyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG4gICAgICAgIHRoaXMud3JhcHBlci5zdHlsZS5vdmVyZmxvdyA9ICdhdXRvJztcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHVUkg5oqY44KK44Gf44Gf44G/44OI44Kw44OrXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxEaXZFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudG9nZ2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuY2xhc3NOYW1lID0gJ3Zpc2libGUnO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlLnRleHRDb250ZW50ID0gJ+KWtic7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUuZm9udFNpemUgPSAnMThweCc7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUubGluZUhlaWdodCA9ICczMnB4JztcclxuICAgICAgICB0aGlzLnRvZ2dsZS5zdHlsZS5jb2xvciA9ICdyZ2JhKDI0MCwgMjQwLCAyNDAsIDAuNSknO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDMyLCAzMiwgMzIsIDAuNSknO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlLnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgcmdiYSgyNDAsIDI0MCwgMjQwLCAwLjIpJztcclxuICAgICAgICB0aGlzLnRvZ2dsZS5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnMjVweCc7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUuYm94U2hhZG93ID0gJzBweCAwcHggMnB4IDJweCByZ2JhKDgsIDgsIDgsIDAuOCknO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgICAgICB0aGlzLnRvZ2dsZS5zdHlsZS50b3AgPSAnMjBweCc7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUucmlnaHQgPSAnMzYwcHgnO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlLnN0eWxlLndpZHRoID0gJzMycHgnO1xyXG4gICAgICAgIHRoaXMudG9nZ2xlLnN0eWxlLmhlaWdodCA9ICczMnB4JztcclxuICAgICAgICB0aGlzLnRvZ2dsZS5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUudHJhbnNmb3JtID0gJ3JvdGF0ZSgwZGVnKSc7XHJcbiAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUudHJhbnNpdGlvbiA9ICd0cmFuc2Zvcm0gMC41cyBjdWJpYy1iZXppZXIoMCwgMCwgMCwgMS4wKSc7XHJcblxyXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLnRvZ2dsZSk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMud3JhcHBlcik7XHJcblxyXG4gICAgICAgIHRoaXMudG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZS5jbGFzc0xpc3QudG9nZ2xlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgIGlmKHRoaXMudG9nZ2xlLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5yaWdodCA9ICcwcHgnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50b2dnbGUuc3R5bGUudHJhbnNmb3JtID0gJ3JvdGF0ZSgwZGVnKSc7XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnJpZ2h0ID0gJy0zNDBweCc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZS5zdHlsZS50cmFuc2Zvcm0gPSAncm90YXRlKC0xODBkZWcpJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgqjjg6zjg6Hjg7Pjg4jjgpLov5TjgZlcclxuICAgICAqIEByZXR1cm4ge0hUTUxEaXZFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBnZXRFbGVtZW50KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5a2Q6KaB57Sg44KS44Ki44Oa44Oz44OJ44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IC0g44Ki44Oa44Oz44OJ44GZ44KL6KaB57SgXHJcbiAgICAgKi9cclxuICAgIGFwcGVuZChlbGVtZW50KXtcclxuICAgICAgICB0aGlzLndyYXBwZXIuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHVUlFbGVtZW50XHJcbiAqIEBjbGFzcyBHVUlFbGVtZW50XHJcbiAqL1xyXG5jbGFzcyBHVUlFbGVtZW50IHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3RleHQ9JyddIC0g44Ko44Os44Oh44Oz44OI44Gr6Kit5a6a44GZ44KL44OG44Kt44K544OIXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHRleHQgPSAnJyl7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Ko44Os44Oh44Oz44OI44Op44OD44OR44O8IERPTVxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRGl2RWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSAnc21hbGwnO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSAnMzIwcHgnO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAnMzBweCc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmxpbmVIZWlnaHQgPSAnMzBweCc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAncm93JztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnZmxleC1zdGFydCc7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Op44OZ44Or55So44Ko44Os44Oh44Oz44OIIERPTVxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MU3BhbkVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB0aGlzLmxhYmVsLnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgICAgICB0aGlzLmxhYmVsLnN0eWxlLmNvbG9yID0gJyMyMjInO1xyXG4gICAgICAgIHRoaXMubGFiZWwuc3R5bGUudGV4dFNoYWRvdyA9ICcwcHggMHB4IDVweCB3aGl0ZSc7XHJcbiAgICAgICAgdGhpcy5sYWJlbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1ibG9jayc7XHJcbiAgICAgICAgdGhpcy5sYWJlbC5zdHlsZS5tYXJnaW4gPSAnYXV0byA1cHgnO1xyXG4gICAgICAgIHRoaXMubGFiZWwuc3R5bGUud2lkdGggPSAnMTAwcHgnO1xyXG4gICAgICAgIHRoaXMubGFiZWwuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5sYWJlbCk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5YCk6KGo56S655SoIERPTVxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MU3BhbkVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICB0aGlzLnZhbHVlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDAsIDAsIDAsIDAuMjUpJztcclxuICAgICAgICB0aGlzLnZhbHVlLnN0eWxlLmNvbG9yID0gJ3doaXRlc21va2UnO1xyXG4gICAgICAgIHRoaXMudmFsdWUuc3R5bGUuZm9udFNpemUgPSAneC1zbWFsbCc7XHJcbiAgICAgICAgdGhpcy52YWx1ZS5zdHlsZS50ZXh0U2hhZG93ID0gJzBweCAwcHggNXB4IGJsYWNrJztcclxuICAgICAgICB0aGlzLnZhbHVlLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcclxuICAgICAgICB0aGlzLnZhbHVlLnN0eWxlLm1hcmdpbiA9ICdhdXRvIDVweCc7XHJcbiAgICAgICAgdGhpcy52YWx1ZS5zdHlsZS53aWR0aCA9ICc1MHB4JztcclxuICAgICAgICB0aGlzLnZhbHVlLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMudmFsdWUpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCs+ODs+ODiOODreODvOODqyBET01cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250cm9sID0gbnVsbDtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDjg6njg5njg6vjgavoqK3lrprjgZnjgovjg4bjgq3jgrnjg4hcclxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Kk44OZ44Oz44OI44Oq44K544OKXHJcbiAgICAgICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHt9O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgqTjg5njg7Pjg4jjg6rjgrnjg4rjgpLnmbvpjLLjgZnjgotcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0g44Kk44OZ44Oz44OI44K/44Kk44OXXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jIC0g55m76Yyy44GZ44KL6Zai5pWwXHJcbiAgICAgKi9cclxuICAgIGFkZCh0eXBlLCBmdW5jKXtcclxuICAgICAgICBpZih0aGlzLmNvbnRyb2wgPT0gbnVsbCB8fCB0eXBlID09IG51bGwgfHwgZnVuYyA9PSBudWxsKXtyZXR1cm47fVxyXG4gICAgICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0eXBlKSAhPT0gJ1tvYmplY3QgU3RyaW5nXScpe3JldHVybjt9XHJcbiAgICAgICAgaWYoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGZ1bmMpICE9PSAnW29iamVjdCBGdW5jdGlvbl0nKXtyZXR1cm47fVxyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzW3R5cGVdID0gZnVuYztcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44Kk44OZ44Oz44OI44KS55m654Gr44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIOeZuueBq+OBmeOCi+OCpOODmeODs+ODiOOCv+OCpOODl1xyXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlIC0gRXZlbnQg44Kq44OW44K444Kn44Kv44OIXHJcbiAgICAgKi9cclxuICAgIGVtaXQodHlwZSwgZXZlKXtcclxuICAgICAgICBpZih0aGlzLmNvbnRyb2wgPT0gbnVsbCB8fCAhdGhpcy5saXN0ZW5lcnMuaGFzT3duUHJvcGVydHkodHlwZSkpe3JldHVybjt9XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnNbdHlwZV0oZXZlLCB0aGlzKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44Kk44OZ44Oz44OI44Oq44K544OK44KS55m76Yyy6Kej6Zmk44GZ44KLXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZSgpe1xyXG4gICAgICAgIGlmKHRoaXMuY29udHJvbCA9PSBudWxsIHx8ICF0aGlzLmxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSl7cmV0dXJuO31cclxuICAgICAgICB0aGlzLmxpc3RlbmVyc1t0eXBlXSA9IG51bGw7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMubGlzdGVuZXJzW3R5cGVdO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjg6njg5njg6vjg4bjgq3jgrnjg4jjgajjgrPjg7Pjg4jjg63jg7zjg6vjga7lgKTjgpLmm7TmlrDjgZnjgotcclxuICAgICAqIEBwYXJhbSB7bWl4ZWR9IHZhbHVlIC0g6Kit5a6a44GZ44KL5YCkXHJcbiAgICAgKi9cclxuICAgIHNldFZhbHVlKHZhbHVlKXtcclxuICAgICAgICB0aGlzLnZhbHVlLnRleHRDb250ZW50ID0gdmFsdWU7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnZhbHVlID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCs+ODs+ODiOODreODvOODq+OBq+ioreWumuOBleOCjOOBpuOBhOOCi+WApOOCkui/lOOBmVxyXG4gICAgICogQHJldHVybiB7bWl4ZWR9IOOCs+ODs+ODiOODreODvOODq+OBq+ioreWumuOBleOCjOOBpuOBhOOCi+WApFxyXG4gICAgICovXHJcbiAgICBnZXRWYWx1ZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wudmFsdWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCs+ODs+ODiOODreODvOODq+OCqOODrOODoeODs+ODiOOCkui/lOOBmVxyXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGdldENvbnRyb2woKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjg6njg5njg6vjgavoqK3lrprjgZXjgozjgabjgYTjgovjg4bjgq3jgrnjg4jjgpLov5TjgZlcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ30g44Op44OZ44Or44Gr6Kit5a6a44GV44KM44Gm44GE44KL5YCkXHJcbiAgICAgKi9cclxuICAgIGdldFRleHQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy50ZXh0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgqjjg6zjg6Hjg7Pjg4jjgpLov5TjgZlcclxuICAgICAqIEByZXR1cm4ge0hUTUxEaXZFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBnZXRFbGVtZW50KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdVSVNsaWRlclxyXG4gKiBAY2xhc3MgR1VJU2xpZGVyXHJcbiAqL1xyXG5jbGFzcyBHVUlTbGlkZXIgZXh0ZW5kcyBHVUlFbGVtZW50IHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3RleHQ9JyddIC0g44Ko44Os44Oh44Oz44OI44Gr6Kit5a6a44GZ44KL44OG44Kt44K544OIXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ZhbHVlPTBdIC0g44Kz44Oz44OI44Ot44O844Or44Gr6Kit5a6a44GZ44KL5YCkXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21pbj0wXSAtIOOCueODqeOCpOODgOODvOOBruacgOWwj+WApFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFttYXg9MTAwXSAtIOOCueODqeOCpOODgOODvOOBruacgOWkp+WApFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGVwPTFdIC0g44K544Op44Kk44OA44O844Gu44K544OG44OD44OX5pWwXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHRleHQgPSAnJywgdmFsdWUgPSAwLCBtaW4gPSAwLCBtYXggPSAxMDAsIHN0ZXAgPSAxKXtcclxuICAgICAgICBzdXBlcih0ZXh0KTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDjgrPjg7Pjg4jjg63jg7zjg6vjgqjjg6zjg6Hjg7Pjg4hcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTElucHV0RWxlbWVudH1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNvbnRyb2wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFuZ2UnKTtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc2V0QXR0cmlidXRlKCdtaW4nLCBtaW4pO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRBdHRyaWJ1dGUoJ21heCcsIG1heCk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnNldEF0dHJpYnV0ZSgnc3RlcCcsIHN0ZXApO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zdHlsZS5tYXJnaW4gPSAnYXV0byc7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnN0eWxlLnZlcnRpY2FsQWxpZ24gPSAnbWlkZGxlJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250cm9sKTtcclxuXHJcbiAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh0aGlzLmNvbnRyb2wudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBldmVudFxyXG4gICAgICAgIHRoaXMuY29udHJvbC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChldmUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdpbnB1dCcsIGV2ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5jb250cm9sLnZhbHVlKTtcclxuICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCueODqeOCpOODgOODvOOBruacgOWwj+WApOOCkuOCu+ODg+ODiOOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiAtIOacgOWwj+WApOOBq+ioreWumuOBmeOCi+WApFxyXG4gICAgICovXHJcbiAgICBzZXRNaW4obWluKXtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc2V0QXR0cmlidXRlKCdtaW4nLCBtaW4pO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgrnjg6njgqTjg4Djg7zjga7mnIDlpKflgKTjgpLjgrvjg4Pjg4jjgZnjgotcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggLSDmnIDlpKflgKTjgavoqK3lrprjgZnjgovlgKRcclxuICAgICAqL1xyXG4gICAgc2V0TWF4KG1heCl7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnNldEF0dHJpYnV0ZSgnbWF4JywgbWF4KTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44K544Op44Kk44OA44O844Gu44K544OG44OD44OX5pWw44KS44K744OD44OI44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RlcCAtIOOCueODhuODg+ODl+aVsOOBq+ioreWumuOBmeOCi+WApFxyXG4gICAgICovXHJcbiAgICBzZXRTdGVwKHN0ZXApe1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRBdHRyaWJ1dGUoJ3N0ZXAnLCBzdGVwKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdVSUNoZWNrYm94XHJcbiAqIEBjbGFzcyBHVUlDaGVja2JveFxyXG4gKi9cclxuY2xhc3MgR1VJQ2hlY2tib3ggZXh0ZW5kcyBHVUlFbGVtZW50IHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3RleHQ9JyddIC0g44Ko44Os44Oh44Oz44OI44Gr6Kit5a6a44GZ44KL44OG44Kt44K544OIXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjaGVja2VkPWZhbHNlXSAtIOOCs+ODs+ODiOODreODvOODq+OBq+ioreWumuOBmeOCi+WApFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih0ZXh0ID0gJycsIGNoZWNrZWQgPSBmYWxzZSl7XHJcbiAgICAgICAgc3VwZXIodGV4dCk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Kz44Oz44OI44Ot44O844Or44Ko44Os44Oh44Oz44OIXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxJbnB1dEVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250cm9sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NoZWNrYm94Jyk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLmNoZWNrZWQgPSBjaGVja2VkO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zdHlsZS5tYXJnaW4gPSAnYXV0byc7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnN0eWxlLnZlcnRpY2FsQWxpZ24gPSAnbWlkZGxlJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250cm9sKTtcclxuXHJcbiAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh0aGlzLmNvbnRyb2wuY2hlY2tlZCk7XHJcblxyXG4gICAgICAgIC8vIGV2ZW50XHJcbiAgICAgICAgdGhpcy5jb250cm9sLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChldmUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBldmUpO1xyXG4gICAgICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuY29udHJvbC5jaGVja2VkKTtcclxuICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCs+ODs+ODiOODreODvOODq+OBq+WApOOCkuioreWumuOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBjaGVja2VkIC0g44Kz44Oz44OI44Ot44O844Or44Gr6Kit5a6a44GZ44KL5YCkXHJcbiAgICAgKi9cclxuICAgIHNldFZhbHVlKGNoZWNrZWQpe1xyXG4gICAgICAgIHRoaXMudmFsdWUudGV4dENvbnRlbnQgPSBjaGVja2VkO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5jaGVja2VkID0gY2hlY2tlZDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44Kz44Oz44OI44Ot44O844Or44Gu5YCk44KS6L+U44GZXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSDjgrPjg7Pjg4jjg63jg7zjg6vjga7lgKRcclxuICAgICAqL1xyXG4gICAgZ2V0VmFsdWUoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLmNoZWNrZWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHVUlSYWRpb1xyXG4gKiBAY2xhc3MgR1VJUmFkaW9cclxuICovXHJcbmNsYXNzIEdVSVJhZGlvIGV4dGVuZHMgR1VJRWxlbWVudCB7XHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt0ZXh0PScnXSAtIOOCqOODrOODoeODs+ODiOOBq+ioreWumuOBmeOCi+ODhuOCreOCueODiFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtuYW1lPSdnbDNyYWRpbyddIC0g44Ko44Os44Oh44Oz44OI44Gr6Kit5a6a44GZ44KL5ZCN5YmNXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjaGVja2VkPWZhbHNlXSAtIOOCs+ODs+ODiOODreODvOODq+OBq+ioreWumuOBmeOCi+WApFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih0ZXh0ID0gJycsIG5hbWUgPSAnZ2wzcmFkaW8nLCBjaGVja2VkID0gZmFsc2Upe1xyXG4gICAgICAgIHN1cGVyKHRleHQpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCs+ODs+ODiOODreODvOODq+OCqOODrOODoeODs+ODiFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MSW5wdXRFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY29udHJvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCBuYW1lKTtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuY2hlY2tlZCA9IGNoZWNrZWQ7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnN0eWxlLm1hcmdpbiA9ICdhdXRvJztcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc3R5bGUudmVydGljYWxBbGlnbiA9ICdtaWRkbGUnO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmNvbnRyb2wpO1xyXG5cclxuICAgICAgICAvLyBzZXRcclxuICAgICAgICB0aGlzLnNldFZhbHVlKHRoaXMuY29udHJvbC5jaGVja2VkKTtcclxuXHJcbiAgICAgICAgLy8gZXZlbnRcclxuICAgICAgICB0aGlzLmNvbnRyb2wuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGV2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZScsIGV2ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5jb250cm9sLmNoZWNrZWQpO1xyXG4gICAgICAgIH0sIGZhbHNlKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44Kz44Oz44OI44Ot44O844Or44Gr5YCk44KS6Kit5a6a44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNoZWNrZWQgLSDjgrPjg7Pjg4jjg63jg7zjg6vjgavoqK3lrprjgZnjgovlgKRcclxuICAgICAqL1xyXG4gICAgc2V0VmFsdWUoY2hlY2tlZCl7XHJcbiAgICAgICAgdGhpcy52YWx1ZS50ZXh0Q29udGVudCA9ICctLS0nO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5jaGVja2VkID0gY2hlY2tlZDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44Kz44Oz44OI44Ot44O844Or44Gu5YCk44KS6L+U44GZXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSDjgrPjg7Pjg4jjg63jg7zjg6vjga7lgKRcclxuICAgICAqL1xyXG4gICAgZ2V0VmFsdWUoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sLmNoZWNrZWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHVUlTZWxlY3RcclxuICogQGNsYXNzIEdVSVNlbGVjdFxyXG4gKi9cclxuY2xhc3MgR1VJU2VsZWN0IGV4dGVuZHMgR1VJRWxlbWVudCB7XHJcbiAgICAvKipcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFt0ZXh0PScnXSAtIOOCqOODrOODoeODs+ODiOOBq+ioreWumuOBmeOCi+ODhuOCreOCueODiFxyXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gW2xpc3Q9W11dIC0g44Oq44K544OI44Gr55m76Yyy44GZ44KL44Ki44Kk44OG44Og44KS5oyH5a6a44GZ44KL5paH5a2X5YiX44Gu6YWN5YiXXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3NlbGVjdGVkSW5kZXg9MF0gLSDjgrPjg7Pjg4jjg63jg7zjg6vjgafpgbjmip7jgZnjgovjgqTjg7Pjg4fjg4Pjgq/jgrlcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodGV4dCA9ICcnLCBsaXN0ID0gW10sIHNlbGVjdGVkSW5kZXggPSAwKXtcclxuICAgICAgICBzdXBlcih0ZXh0KTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDjgrPjg7Pjg4jjg63jg7zjg6vjgqjjg6zjg6Hjg7Pjg4hcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTFNlbGVjdEVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250cm9sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XHJcbiAgICAgICAgbGlzdC5tYXAoKHYpID0+IHtcclxuICAgICAgICAgICAgbGV0IG9wdCA9IG5ldyBPcHRpb24odiwgdik7XHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbC5hZGQob3B0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc2VsZWN0ZWRJbmRleCA9IHNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnN0eWxlLndpZHRoID0gJzEzMHB4JztcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc3R5bGUubWFyZ2luID0gJ2F1dG8nO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zdHlsZS52ZXJ0aWNhbEFsaWduID0gJ21pZGRsZSc7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuY29udHJvbCk7XHJcblxyXG4gICAgICAgIC8vIHNldFxyXG4gICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5jb250cm9sLnZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8gZXZlbnRcclxuICAgICAgICB0aGlzLmNvbnRyb2wuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGV2ZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZScsIGV2ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5jb250cm9sLnZhbHVlKTtcclxuICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCs+ODs+ODiOODreODvOODq+OBp+mBuOaKnuOBmeOCi+OCpOODs+ODh+ODg+OCr+OCueOCkuaMh+WumuOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0g5oyH5a6a44GZ44KL44Kk44Oz44OH44OD44Kv44K5XHJcbiAgICAgKi9cclxuICAgIHNldFNlbGVjdGVkSW5kZXgoaW5kZXgpe1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCs+ODs+ODiOODreODvOODq+OBjOePvuWcqOmBuOaKnuOBl+OBpuOBhOOCi+OCpOODs+ODh+ODg+OCr+OCueOCkui/lOOBmVxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSDnj77lnKjpgbjmip7jgZfjgabjgYTjgovjgqTjg7Pjg4fjg4Pjgq/jgrlcclxuICAgICAqL1xyXG4gICAgZ2V0U2VsZWN0ZWRJbmRleCgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRyb2wuc2VsZWN0ZWRJbmRleDtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdVSVNwaW5cclxuICogQGNsYXNzIEdVSVNwaW5cclxuICovXHJcbmNsYXNzIEdVSVNwaW4gZXh0ZW5kcyBHVUlFbGVtZW50IHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3RleHQ9JyddIC0g44Ko44Os44Oh44Oz44OI44Gr6Kit5a6a44GZ44KL44OG44Kt44K544OIXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ZhbHVlPTAuMF0gLSDjgrPjg7Pjg4jjg63jg7zjg6vjgavoqK3lrprjgZnjgovlgKRcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbbWluPS0xLjBdIC0g44K544OU44Oz44GZ44KL6Zqb44Gu5pyA5bCP5YCkXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW21heD0xLjBdIC0g44K544OU44Oz44GZ44KL6Zqb44Gu5pyA5aSn5YCkXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3N0ZXA9MC4xXSAtIOOCueODlOODs+OBmeOCi+OCueODhuODg+ODl+aVsFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih0ZXh0ID0gJycsIHZhbHVlID0gMC4wLCBtaW4gPSAtMS4wLCBtYXggPSAxLjAsIHN0ZXAgPSAwLjEpe1xyXG4gICAgICAgIHN1cGVyKHRleHQpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCs+ODs+ODiOODreODvOODq+OCqOODrOODoeODs+ODiFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MSW5wdXRFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY29udHJvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnNldEF0dHJpYnV0ZSgndHlwZScsICdudW1iZXInKTtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc2V0QXR0cmlidXRlKCdtaW4nLCBtaW4pO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRBdHRyaWJ1dGUoJ21heCcsIG1heCk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnNldEF0dHJpYnV0ZSgnc3RlcCcsIHN0ZXApO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zdHlsZS5tYXJnaW4gPSAnYXV0byc7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnN0eWxlLnZlcnRpY2FsQWxpZ24gPSAnbWlkZGxlJztcclxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250cm9sKTtcclxuXHJcbiAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh0aGlzLmNvbnRyb2wudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBldmVudFxyXG4gICAgICAgIHRoaXMuY29udHJvbC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChldmUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdpbnB1dCcsIGV2ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUodGhpcy5jb250cm9sLnZhbHVlKTtcclxuICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOOCueODlOODs+OBruacgOWwj+WApOOCkuioreWumuOBmeOCi1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG1pbiAtIOioreWumuOBmeOCi+acgOWwj+WApFxyXG4gICAgICovXHJcbiAgICBzZXRNaW4obWluKXtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuc2V0QXR0cmlidXRlKCdtaW4nLCBtaW4pO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDjgrnjg5Tjg7Pjga7mnIDlpKflgKTjgpLoqK3lrprjgZnjgotcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBtYXggLSDoqK3lrprjgZnjgovmnIDlpKflgKRcclxuICAgICAqL1xyXG4gICAgc2V0TWF4KG1heCl7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnNldEF0dHJpYnV0ZSgnbWF4JywgbWF4KTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog44K544OU44Oz44Gu44K544OG44OD44OX5pWw44KS6Kit5a6a44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RlcCAtIOioreWumuOBmeOCi+OCueODhuODg+ODl+aVsFxyXG4gICAgICovXHJcbiAgICBzZXRTdGVwKHN0ZXApe1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zZXRBdHRyaWJ1dGUoJ3N0ZXAnLCBzdGVwKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdVSUNvbG9yXHJcbiAqIEBjbGFzcyBHVUlDb2xvclxyXG4gKi9cclxuY2xhc3MgR1VJQ29sb3IgZXh0ZW5kcyBHVUlFbGVtZW50IHtcclxuICAgIC8qKlxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3RleHQ9JyddIC0g44Ko44Os44Oh44Oz44OI44Gr6Kit5a6a44GZ44KL44OG44Kt44K544OIXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW3ZhbHVlPScjMDAwMDAwJ10gLSDjgrPjg7Pjg4jjg63jg7zjg6vjgavoqK3lrprjgZnjgovlgKRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodGV4dCA9ICcnLCB2YWx1ZSA9ICcjMDAwMDAwJyl7XHJcbiAgICAgICAgc3VwZXIodGV4dCk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Kz44Oz44OI44Ot44O844Or44KS5YyF44KA44Kz44Oz44OG44OK44Ko44Os44Oh44Oz44OIXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxEaXZFbGVtZW50fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIuc3R5bGUubGluZUhlaWdodCA9ICcwJztcclxuICAgICAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS5tYXJnaW4gPSAnMnB4IGF1dG8nO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLndpZHRoID0gJzEwMHB4JztcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDkvZnnmb3lhbzpgbjmip7jgqvjg6njg7zooajnpLrjgqjjg6zjg6Hjg7Pjg4hcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTERpdkVsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5sYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMubGFiZWwuc3R5bGUubWFyZ2luID0gJzBweCc7XHJcbiAgICAgICAgdGhpcy5sYWJlbC5zdHlsZS53aWR0aCA9ICdjYWxjKDEwMCUgLSAycHgpJztcclxuICAgICAgICB0aGlzLmxhYmVsLnN0eWxlLmhlaWdodCA9ICcyNHB4JztcclxuICAgICAgICB0aGlzLmxhYmVsLnN0eWxlLmJvcmRlciA9ICcxcHggc29saWQgd2hpdGVzbW9rZSc7XHJcbiAgICAgICAgdGhpcy5sYWJlbC5zdHlsZS5ib3hTaGFkb3cgPSAnMHB4IDBweCAwcHggMXB4ICMyMjInO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCs+ODs+ODiOODreODvOODq+OCqOODrOODoeODs+ODiOOBruW9ueWJsuOCkuaLheOBhiBjYW52YXNcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTENhbnZhc0VsZW1lbnR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250cm9sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLnN0eWxlLm1hcmdpbiA9ICcwcHgnO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIHRoaXMuY29udHJvbC53aWR0aCA9IDEwMDtcclxuICAgICAgICB0aGlzLmNvbnRyb2wuaGVpZ2h0ID0gMTAwO1xyXG5cclxuICAgICAgICAvLyBhcHBlbmRcclxuICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5jb250YWluZXIpO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMubGFiZWwpO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuY29udHJvbCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOOCs+ODs+ODiOODreODvOODq+eUqCBjYW52YXMg44GuIDJkIOOCs+ODs+ODhuOCreOCueODiFxyXG4gICAgICAgICAqIEB0eXBlIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNvbnRyb2wuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICBsZXQgZ3JhZCA9IHRoaXMuY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIHRoaXMuY29udHJvbC53aWR0aCwgMCk7XHJcbiAgICAgICAgbGV0IGFyciA9IFsnI2ZmMDAwMCcsICcjZmZmZjAwJywgJyMwMGZmMDAnLCAnIzAwZmZmZicsICcjMDAwMGZmJywgJyNmZjAwZmYnLCAnI2ZmMDAwMCddO1xyXG4gICAgICAgIGZvcihsZXQgaSA9IDAsIGogPSBhcnIubGVuZ3RoOyBpIDwgajsgKytpKXtcclxuICAgICAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoaSAvIChqIC0gMSksIGFycltpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGdyYWQ7XHJcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5jb250cm9sLndpZHRoLCB0aGlzLmNvbnRyb2wuaGVpZ2h0KTtcclxuICAgICAgICBncmFkID0gdGhpcy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgdGhpcy5jb250cm9sLmhlaWdodCk7XHJcbiAgICAgICAgYXJyID0gWydyZ2JhKDI1NSwgMjU1LCAyNTUsIDEuMCknLCAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjApJywgJ3JnYmEoMCwgMCwgMCwgMC4wKScsICdyZ2JhKDAsIDAsIDAsIDEuMCknXTtcclxuICAgICAgICBmb3IobGV0IGkgPSAwLCBqID0gYXJyLmxlbmd0aDsgaSA8IGo7ICsraSl7XHJcbiAgICAgICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKGkgLyAoaiAtIDEpLCBhcnJbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBncmFkO1xyXG4gICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMuY29udHJvbC53aWR0aCwgdGhpcy5jb250cm9sLmhlaWdodCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiHqui6q+OBq+ioreWumuOBleOCjOOBpuOBhOOCi+iJsuOCkuihqOOBmeaWh+Wtl+WIl+OBruWApFxyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb2xvclZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog44Kv44Oq44OD44Kv5pmC44Gr44Gu44G/IGNvbG9yVmFsdWUg44KS5pu05paw44GZ44KL44Gf44KB44Gu5LiA5pmC44Kt44Oj44OD44K344Ol5aSJ5pWwXHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRlbXBDb2xvclZhbHVlID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgdGhpcy5zZXRWYWx1ZSh2YWx1ZSk7XHJcblxyXG4gICAgICAgIC8vIGV2ZW50XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2wuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICAgICAgICAgIHRoaXMudGVtcENvbG9yVmFsdWUgPSB0aGlzLmNvbG9yVmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICBpZih0aGlzLnRlbXBDb2xvclZhbHVlICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRWYWx1ZSh0aGlzLnRlbXBDb2xvclZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGVtcENvbG9yVmFsdWUgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5jb250cm9sLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChldmUpID0+IHtcclxuICAgICAgICAgICAgbGV0IGltYWdlRGF0YSA9IHRoaXMuY3R4LmdldEltYWdlRGF0YShldmUub2Zmc2V0WCwgZXZlLm9mZnNldFksIDEsIDEpO1xyXG4gICAgICAgICAgICBsZXQgY29sb3IgPSB0aGlzLmdldENvbG9yOGJpdFN0cmluZyhpbWFnZURhdGEuZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUoY29sb3IpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNvbnRyb2wuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZURhdGEgPSB0aGlzLmN0eC5nZXRJbWFnZURhdGEoZXZlLm9mZnNldFgsIGV2ZS5vZmZzZXRZLCAxLCAxKTtcclxuICAgICAgICAgICAgZXZlLmN1cnJlbnRUYXJnZXQudmFsdWUgPSB0aGlzLmdldENvbG9yOGJpdFN0cmluZyhpbWFnZURhdGEuZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMudGVtcENvbG9yVmFsdWUgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2wuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBldmUpO1xyXG4gICAgICAgIH0sIGZhbHNlKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6Ieq6Lqr44Gu44OX44Ot44OR44OG44Kj44Gr6Imy44KS6Kit5a6a44GZ44KLXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSBDU1Mg6Imy6KGo54++44Gu44GG44GhIDE2IOmAsuaVsOihqOiomOOBruOCguOBrlxyXG4gICAgICovXHJcbiAgICBzZXRWYWx1ZSh2YWx1ZSl7XHJcbiAgICAgICAgdGhpcy52YWx1ZS50ZXh0Q29udGVudCA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuY29sb3JWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuY29sb3JWYWx1ZTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog6Ieq6Lqr44Gr6Kit5a6a44GV44KM44Gm44GE44KL6Imy44KS6KGo44GZ5paH5a2X5YiX44KS6L+U44GZXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IDE2IOmAsuaVsOihqOiomOOBruiJsuOCkuihqOOBmeaWh+Wtl+WIl1xyXG4gICAgICovXHJcbiAgICBnZXRWYWx1ZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbG9yVmFsdWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOiHqui6q+OBq+ioreWumuOBleOCjOOBpuOBhOOCi+iJsuOCkuihqOOBmeaWh+Wtl+WIl+OCkiAwLjAg44GL44KJIDEuMCDjga7lgKTjgavlpInmj5vjgZfphY3liJfjgafov5TjgZlcclxuICAgICAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fSDmta7li5XlsI/mlbDjgafooajnj77jgZfjgZ/oibLjga7lgKTjga7phY3liJdcclxuICAgICAqL1xyXG4gICAgZ2V0RmxvYXRWYWx1ZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbG9yRmxvYXRBcnJheSh0aGlzLmNvbG9yVmFsdWUpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBjYW52YXMuaW1hZ2VEYXRhIOOBi+OCieWPluW+l+OBmeOCi+aVsOWApOOBrumFjeWIl+OCkuWFg+OBqyAxNiDpgLLmlbDooajoqJjmloflrZfliJfjgpLnlJ/miJDjgZfjgabov5TjgZlcclxuICAgICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IGNvbG9yIC0g5pyA5L2O44Gn44KCIDMg44Gk44Gu6KaB57Sg44KS5oyB44Gk5pWw5YCk44Gu6YWN5YiXXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IDE2IOmAsuaVsOihqOiomOOBruiJsuOBruWApOOBruaWh+Wtl+WIl1xyXG4gICAgICovXHJcbiAgICBnZXRDb2xvcjhiaXRTdHJpbmcoY29sb3Ipe1xyXG4gICAgICAgIGxldCByID0gdGhpcy56ZXJvUGFkZGluZyhjb2xvclswXS50b1N0cmluZygxNiksIDIpO1xyXG4gICAgICAgIGxldCBnID0gdGhpcy56ZXJvUGFkZGluZyhjb2xvclsxXS50b1N0cmluZygxNiksIDIpO1xyXG4gICAgICAgIGxldCBiID0gdGhpcy56ZXJvUGFkZGluZyhjb2xvclsyXS50b1N0cmluZygxNiksIDIpO1xyXG4gICAgICAgIHJldHVybiAnIycgKyByICsgZyArIGI7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIDE2IOmAsuaVsOihqOiomOOBruiJsuihqOePvuaWh+Wtl+WIl+OCkuWFg+OBqyAwLjAg44GL44KJIDEuMCDjga7lgKTjgavlpInmj5vjgZfjgZ/phY3liJfjgpLnlJ/miJDjgZfov5TjgZlcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciAtIDE2IOmAsuaVsOihqOiomOOBruiJsuOBruWApOOBruaWh+Wtl+WIl1xyXG4gICAgICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59IFJHQiDjga4gMyDjgaTjga7lgKTjgpIgMC4wIOOBi+OCiSAxLjAg44Gr5aSJ5o+b44GX44Gf5YCk44Gu6YWN5YiXXHJcbiAgICAgKi9cclxuICAgIGdldENvbG9yRmxvYXRBcnJheShjb2xvcil7XHJcbiAgICAgICAgaWYoY29sb3IgPT0gbnVsbCB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoY29sb3IpICE9PSAnW29iamVjdCBTdHJpbmddJyl7cmV0dXJuIG51bGw7fVxyXG4gICAgICAgIGlmKGNvbG9yLnNlYXJjaCgvXiMrW1xcZHxhLWZ8QS1GXSskLykgPT09IC0xKXtyZXR1cm4gbnVsbDt9XHJcbiAgICAgICAgbGV0IHMgPSBjb2xvci5yZXBsYWNlKCcjJywgJycpO1xyXG4gICAgICAgIGlmKHMubGVuZ3RoICE9PSAzICYmIHMubGVuZ3RoICE9PSA2KXtyZXR1cm4gbnVsbDt9XHJcbiAgICAgICAgbGV0IHQgPSBzLmxlbmd0aCAvIDM7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgcGFyc2VJbnQoY29sb3Iuc3Vic3RyKDEsIHQpLCAxNikgLyAyNTUsXHJcbiAgICAgICAgICAgIHBhcnNlSW50KGNvbG9yLnN1YnN0cigxICsgdCwgdCksIDE2KSAvIDI1NSxcclxuICAgICAgICAgICAgcGFyc2VJbnQoY29sb3Iuc3Vic3RyKDEgKyB0ICogMiwgdCksIDE2KSAvIDI1NVxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIOaVsOWApOOCkuaMh+WumuOBleOCjOOBn+ahgeaVsOOBq+aVtOW9ouOBl+OBn+aWh+Wtl+WIl+OCkui/lOOBmVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG51bWJlciAtIOaVtOW9ouOBl+OBn+OBhOaVsOWApFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IC0g5pW05b2i44GZ44KL5qGB5pWwXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IDE2IOmAsuaVsOihqOiomOOBruiJsuOBruWApOOBruaWh+Wtl+WIl1xyXG4gICAgICovXHJcbiAgICB6ZXJvUGFkZGluZyhudW1iZXIsIGNvdW50KXtcclxuICAgICAgICBsZXQgYSA9IG5ldyBBcnJheShjb3VudCkuam9pbignMCcpO1xyXG4gICAgICAgIHJldHVybiAoYSArIG51bWJlcikuc2xpY2UoLWNvdW50KTtcclxuICAgIH1cclxufVxyXG5cclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vZ2wzR3VpLmpzIiwiLy8gZ2VvbWV0b3J5XHJcblxyXG4vKiB0aWxlZFBsYW5lUG9pbnRcclxuICogQHBhcmFtIHtudW1iZXJ9IHJlcyAtIHJlc29sdXRpb25cclxuICogQHJldHVybiB7b2JqZWN0fVxyXG4gKiAge3ZlYzN9IHBvc2l0aW9uLFxyXG4gKiAge3ZlYzR9IGNvbG9yLFxyXG4gKiAge3ZlYzJ9IHRleENvb3JkLFxyXG4gKiAge3ZlYzR9IHR5cGUsXHJcbiAqICB7dmVjNH0gcmFuZG9tXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdGlsZWRQbGFuZVBvaW50KHJlcyl7XHJcbiAgICB2YXIgaSwgaiwgaywgbCwgbSwgbjtcclxuICAgIHZhciB4LCB5LCB6LCByLCBnLCBiLCBhO1xyXG4gICAgdmFyIHBvcyA9IFtdOyAgICAgICAgICAgIC8vIHBvc2l0aW9uLnh5elxyXG4gICAgdmFyIGNvbCA9IFtdOyAgICAgICAgICAgIC8vIGhvcml6b24gbGluZSBhbHBoYSwgY3Jvc3MgbGluZSBhbHBoYVxyXG4gICAgdmFyIHRleCA9IFtdOyAgICAgICAgICAgIC8vIHRleENvb3JkLnN0XHJcbiAgICB2YXIgdHlwID0gW107ICAgICAgICAgICAgLy8geGluZGV4LCB5aW5kZXgsIHRvdGFsaW5kZXhcclxuICAgIHZhciBybmQgPSBbXTsgICAgICAgICAgICAvLyByYW5kb20gZmxvYXRcclxuICAgIHZhciBpZHhIb3Jpem9uTGluZSA9IFtdO1xyXG4gICAgdmFyIGlkeENyb3NzTGluZSA9IFtdO1xyXG4gICAgbiA9IDA7XHJcbiAgICBmb3IoaSA9IDA7IGkgPD0gcmVzOyArK2kpe1xyXG4gICAgICAgIGsgPSAoaSAvIHJlcyAqIDIuMCAtIDEuMCk7XHJcbiAgICAgICAgbSA9IDEuMCAtIGkgLyByZXM7XHJcbiAgICAgICAgZm9yKGogPSAwOyBqIDw9IHJlczsgKytqKXtcclxuICAgICAgICAgICAgbCA9IChqIC8gcmVzICogMi4wIC0gMS4wKTtcclxuICAgICAgICAgICAgcG9zLnB1c2gobCwgaywgMC4wKTtcclxuICAgICAgICAgICAgdGV4LnB1c2goaiAvIHJlcywgbSk7XHJcbiAgICAgICAgICAgIHR5cC5wdXNoKGksIGosIG4sIDAuMCk7XHJcbiAgICAgICAgICAgIHJuZC5wdXNoKE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCksIE1hdGgucmFuZG9tKCkpO1xyXG4gICAgICAgICAgICAvLyBob3Jpem9uIGxpbmUgaW5kZXgoZ2wuTElORVMpXHJcbiAgICAgICAgICAgIHIgPSAwLjA7XHJcbiAgICAgICAgICAgIGlmKGogIT09IDAgJiYgaiA8IHJlcyl7XHJcbiAgICAgICAgICAgICAgICByID0gMS4wO1xyXG4gICAgICAgICAgICAgICAgaWR4SG9yaXpvbkxpbmUucHVzaChuLCBuICsgMSk7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKGogPT09IDApe1xyXG4gICAgICAgICAgICAgICAgciA9IDAuMDtcclxuICAgICAgICAgICAgICAgIGlkeEhvcml6b25MaW5lLnB1c2gobiwgbiArIDEpO1xyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHIgPSAwLjA7XHJcbiAgICAgICAgICAgICAgICBpZHhIb3Jpem9uTGluZS5wdXNoKG4sIG4gLSByZXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNyb3NzIGxpbmUgaW5kZXgoZ2wuTElORVMpXHJcbiAgICAgICAgICAgIGcgPSAxLjA7XHJcbiAgICAgICAgICAgIGlmKGogPT09IDAgJiYgaSA8IHJlcyl7XHJcbiAgICAgICAgICAgICAgICAvLyBpZHhDcm9zc0xpbmUucHVzaChuLCBuICsgcmVzICsgMSwgbiwgbiArIHJlcyArIDIsIG4sIG4gKyAxKTtcclxuICAgICAgICAgICAgICAgIGlkeENyb3NzTGluZS5wdXNoKG4sIG4gKyByZXMgKyAxLCBuLCBuICsgMSk7XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKGogPT09IHJlcyAmJiBpIDwgcmVzKXtcclxuICAgICAgICAgICAgICAgIGlkeENyb3NzTGluZS5wdXNoKG4sIG4gKyByZXMgKyAxKTtcclxuICAgICAgICAgICAgICAgIC8vIGlkeENyb3NzTGluZS5wdXNoKG4sIG4gKyByZXMsIG4sIG4gKyByZXMgKyAxKTtcclxuICAgICAgICAgICAgfWVsc2UgaWYoaiA8IHJlcyAmJiBpID09PSByZXMpe1xyXG4gICAgICAgICAgICAgICAgaWR4Q3Jvc3NMaW5lLnB1c2gobiwgbiArIDEpO1xyXG4gICAgICAgICAgICB9ZWxzZSBpZihqIDwgcmVzICYmIGkgPCByZXMpe1xyXG4gICAgICAgICAgICAgICAgLy8gaWR4Q3Jvc3NMaW5lLnB1c2gobiwgbiArIHJlcywgbiwgbiArIHJlcyArIDEsIG4sIG4gKyByZXMgKyAyLCBuLCBuICsgMSk7XHJcbiAgICAgICAgICAgICAgICBpZHhDcm9zc0xpbmUucHVzaChuLCBuICsgcmVzICsgMSwgbiwgbiArIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGIgPSAwLjA7XHJcbiAgICAgICAgICAgIGEgPSAwLjA7XHJcbiAgICAgICAgICAgIGNvbC5wdXNoKHIsIGcsIGIsIGEpO1xyXG4gICAgICAgICAgICBuKys7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBwb3NpdGlvbjogcG9zLFxyXG4gICAgICAgIGNvbG9yOiBjb2wsXHJcbiAgICAgICAgdGV4Q29vcmQ6IHRleCxcclxuICAgICAgICB0eXBlOiB0eXAsXHJcbiAgICAgICAgcmFuZG9tOiBybmQsXHJcbiAgICAgICAgaW5kZXhIb3Jpem9uOiBpZHhIb3Jpem9uTGluZSxcclxuICAgICAgICBpbmRleENyb3NzOiBpZHhDcm9zc0xpbmVcclxuICAgIH07XHJcbn1cclxuXHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2dlb21ldG9yeS5qcyJdLCJzb3VyY2VSb290IjoiIn0=