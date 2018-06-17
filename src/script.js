
import glcubic           from './gl3Core.js';
import {tiledPlanePoint} from './geometory.js';

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

// variable ===================================================================
let gl3 = new glcubic();
let canvas, gl, run, mat4, qtn;
let scenePrg, finalPrg, noisePrg, gaussPrg, positionPrg, velocityPrg;
let gWeight, nowTime;
let canvasWidth, canvasHeight;

// variable initialize ========================================================
run  = true;
mat4 = gl3.Math.Mat4;
qtn  = gl3.Math.Qtn;

// const variable =============================================================
const BUFFER_SIZE          = 1024;
const GPGPU_BUFFER_SIZE    = 64;
const DEFAULT_CAM_POSITION = [0.0, 0.0, 3.0];
const DEFAULT_CAM_CENTER   = [0.0, 0.0, 0.0];
const DEFAULT_CAM_UP       = [0.0, 1.0, 0.0];

// onload =====================================================================
window.addEventListener('load', () => {
    // gl3 initialize
    gl3.init('canvas');
    if(!gl3.ready){console.log('initialize error'); return;}
    gl = gl3.gl;
    canvas = gl3.canvas;
    canvas.width  = canvasWidth = window.innerWidth;
    canvas.height = canvasHeight = window.innerHeight;

    // event
    window.addEventListener('keydown', (eve) => {
        run = (eve.key !== 'Escape');
        console.log(nowTime);
    }, true);

    shaderLoader();
}, false);

function shaderLoader(){
    // programs
    scenePrg = gl3.createProgramFromFile(
        'shader/planePoint.vert',
        'shader/planePoint.frag',
        ['position', 'color', 'texCoord', 'type', 'random'],
        [3, 4, 2, 4, 4],
        ['mvpMatrix', 'positionTexture', 'time', 'globalColor'],
        ['matrix4fv', '1i', '1f', '4fv'],
        shaderLoadCheck
    );

    // final program
    finalPrg = gl3.createProgramFromFile(
        'shader/final.vert',
        'shader/final.frag',
        ['position'],
        [3],
        ['globalColor', 'texture', 'time', 'resolution'],
        ['4fv', '1i', '1f', '2fv'],
        shaderLoadCheck
    );

    // noise program
    noisePrg = gl3.createProgramFromFile(
        'shader/noise.vert',
        'shader/noise.frag',
        ['position'],
        [3],
        ['resolution'],
        ['2fv'],
        shaderLoadCheck
    );

    // gauss program
    gaussPrg = gl3.createProgramFromFile(
        'shader/gaussian.vert',
        'shader/gaussian.frag',
        ['position'],
        [3],
        ['resolution', 'horizontal', 'weight', 'texture'],
        ['2fv', '1i', '1fv', '1i'],
        shaderLoadCheck
    );

    // gpgpu position program
    positionPrg = gl3.createProgramFromFile(
        'shader/gpgpuPosition.vert',
        'shader/gpgpuPosition.frag',
        ['position', 'texCoord'],
        [3, 2],
        ['time', 'noiseTexture', 'previousTexture', 'velocityTexture'],
        ['1f', '1i', '1i', '1i'],
        shaderLoadCheck
    );

    // gpgpu velocity program
    velocityPrg = gl3.createProgramFromFile(
        'shader/gpgpuVelocity.vert',
        'shader/gpgpuVelocity.frag',
        ['position', 'texCoord'],
        [3, 2],
        ['time', 'noiseTexture', 'previousTexture'],
        ['1f', '1i', '1i'],
        shaderLoadCheck
    );

    function shaderLoadCheck(){
        if(scenePrg.prg    != null &&
           finalPrg.prg    != null &&
           noisePrg.prg    != null &&
           gaussPrg.prg    != null &&
           positionPrg.prg != null &&
           velocityPrg.prg != null &&
           true
        ){init();}
    }
}

function init(){
    let resetBufferFunction = null;
    window.addEventListener('resize', () => {
        resetBufferFunction = generateScreenBuffer;
        run = false;
    }, false);

    // application setting
    canvasWidth   = window.innerWidth;
    canvasHeight  = window.innerHeight;
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    gWeight = gaussWeight(20, 100.0);

    // tiled plane point mesh
    let tiledPlanePointData = tiledPlanePoint(GPGPU_BUFFER_SIZE);
    let tiledPlanePointVBO = [
        gl3.createVbo(tiledPlanePointData.position),
        gl3.createVbo(tiledPlanePointData.color),
        gl3.createVbo(tiledPlanePointData.texCoord),
        gl3.createVbo(tiledPlanePointData.type),
        gl3.createVbo(tiledPlanePointData.random)
    ];
    let tiledPlaneHorizonLineIBO = gl3.createIboInt(tiledPlanePointData.indexHorizon);
    let tiledPlaneCrossLineIBO = gl3.createIboInt(tiledPlanePointData.indexCross);
    let tiledPlanePointLength = tiledPlanePointData.position.length / 3;

    // plane mesh
    let planePosition = [
        -1.0,  1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    let planeTexCoord = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    let planeIndex = [
        0, 2, 1, 1, 2, 3
    ];
    let planeVBO = [gl3.createVbo(planePosition)];
    let planeTexCoordVBO = [
        gl3.createVbo(planePosition),
        gl3.createVbo(planeTexCoord)
    ];
    let planeIBO = gl3.createIboInt(planeIndex);

    // matrix
    let mMatrix = mat4.identity(mat4.create());
    let vMatrix = mat4.identity(mat4.create());
    let pMatrix = mat4.identity(mat4.create());
    let vpMatrix = mat4.identity(mat4.create());
    let mvpMatrix = mat4.identity(mat4.create());
    let invMatrix = mat4.identity(mat4.create());

    // frame buffer
    let frameBuffer, hGaussBuffer, vGaussBuffer;
    generateScreenBuffer();
    function generateScreenBuffer(){
        if(frameBuffer != null){
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            let arr = [frameBuffer, hGaussBuffer, vGaussBuffer];
            for(let i = 0; i < 3; ++i){
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.deleteTexture(arr[i].texture);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.deleteRenderbuffer(arr[i].depthRenderbuffer);
                gl.deleteFramebuffer(arr[i].framebuffer);
            }
        }
        frameBuffer  = gl3.createFramebuffer(canvasWidth, canvasHeight, 0);
        hGaussBuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 1);
        vGaussBuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 2);
        for(let i = 0; i < 3; ++i){
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, gl3.textures[i].texture);
        }
    }
    let noiseBuffer = gl3.createFramebuffer(BUFFER_SIZE, BUFFER_SIZE, 3);
    let positionBuffer = [];
    positionBuffer[0] = gl3.createFramebufferFloat(GPGPU_BUFFER_SIZE, GPGPU_BUFFER_SIZE, 4);
    positionBuffer[1] = gl3.createFramebufferFloat(GPGPU_BUFFER_SIZE, GPGPU_BUFFER_SIZE, 5);
    let velocityBuffer = [];
    velocityBuffer[0] = gl3.createFramebufferFloat(GPGPU_BUFFER_SIZE, GPGPU_BUFFER_SIZE, 6);
    velocityBuffer[1] = gl3.createFramebufferFloat(GPGPU_BUFFER_SIZE, GPGPU_BUFFER_SIZE, 7);

    // texture setting
    (() => {
        for(let i = 0; i < 8; ++i){
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, gl3.textures[i].texture);
        }
    })();

    // noise texture
    noisePrg.useProgram();
    noisePrg.setAttribute(planeVBO, planeIBO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, noiseBuffer.framebuffer);
    gl3.sceneClear([0.0, 0.0, 0.0, 1.0]);
    gl3.sceneView(0, 0, BUFFER_SIZE, BUFFER_SIZE);
    noisePrg.pushShader([[BUFFER_SIZE, BUFFER_SIZE]]);
    gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);

    // gl flags
    gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.BLEND);

    // rendering
    let count = 0;
    let beginTime = Date.now();
    let targetBufferNum = 0;
    render();

    function render(){
        let i;
        nowTime = Date.now() - beginTime;
        nowTime /= 1000;
        count++;
        targetBufferNum = count % 2;

        // canvas
        canvasWidth   = window.innerWidth;
        canvasHeight  = window.innerHeight;
        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;

        // perspective projection
        let cameraPosition    = DEFAULT_CAM_POSITION;
        let centerPoint       = DEFAULT_CAM_CENTER;
        let cameraUpDirection = DEFAULT_CAM_UP;
        mat4.vpFromCameraProperty(
            cameraPosition,
            centerPoint,
            cameraUpDirection,
            45, canvasWidth / canvasHeight,
            0.1,
            10.0,
            vMatrix, pMatrix, vpMatrix
        );

        // gpgpu update ---------------------------------------------------
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, velocityBuffer[targetBufferNum].framebuffer);
        gl3.sceneView(0, 0, GPGPU_BUFFER_SIZE, GPGPU_BUFFER_SIZE);
        velocityPrg.useProgram();
        velocityPrg.setAttribute(planeTexCoordVBO, planeIBO);
        velocityPrg.pushShader([nowTime, 3, 6 + 1 - targetBufferNum]);
        gl3.drawElementsInt(gl.TRIANGLES, planeIndex.length);
        gl.bindFramebuffer(gl.FRAMEBUFFER, positionBuffer[targetBufferNum].framebuffer);
        gl3.sceneView(0, 0, GPGPU_BUFFER_SIZE, GPGPU_BUFFER_SIZE);
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

        if(run){
            requestAnimationFrame(render);
        }else{
            if(resetBufferFunction != null){
                resetBufferFunction();
                resetBufferFunction = null;
                run = true;
                requestAnimationFrame(render);
            }
        }
    }
}

function gaussWeight(resolution, power){
    let i;
    let t = 0.0;
    let weight = [];
    for(i = 0; i < resolution; i++){
        let r = 1.0 + 2.0 * i;
        let w = Math.exp(-0.5 * (r * r) / power);
        weight[i] = w;
        if(i > 0){w *= 2.0;}
        t += w;
    }
    for(i = 0; i < weight.length; i++){
        weight[i] /= t;
    }
    return weight;
}

