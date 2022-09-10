// Get canvas element and initialize webgl
var canvas = document.getElementById('obamoid');
gl = canvas.getContext('experimental-webgl');

// Geometry

var vertices = [
    // Bottom
    -1,-1,-1, 1,-1,-1, 1,-1,1, -1,-1,1,
    // Right
    -1,-1,-1, 1,-1,-1, 0,1,0,
    // Back
    1,-1,-1, 1,-1,1, 0,1,0,
    // Left
    1,-1,1, -1,-1,1, 0,1,0,
    // Front
    -1,-1,1, -1,-1,-1, 0,1,0,
]

var indices = [
    // Bottom
    0,1,2, 0,2,3, 
    // Back
    4,5,6,
    // Left
    7,8,9,
    //Front
    10,11,12,
    //Right
    13,14,15
];

const textureCoordinates = [
    // Bottom
    0.51,  0.49,
    0.99,  0.49,
    0.99,  0.01,
    0.51,  0.01,
    // Back
    0.49,  0.01,
    0.01,  0.01,
    0.25,  0.49,
    // Left
    0.99,  0.51,
    0.51,  0.51,
    0.75,  0.99,
    // Front
    0.49,  0.51,
    0.01,  0.51,
    0.25,  0.99,
    // Right
    0.51,  0.51,
    0.99,  0.51,
    0.75,  0.99,
];

// Create and store data into vertex buffer
var vertexBuffer = gl.createBuffer ();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

//Create and store data into texture buffer
var textureCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

// Create and store data into index buffer
var indexBuffer = gl.createBuffer ();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

//
// Loading texture
//

// Initialize a texture and load an image.
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = url;

    return texture;
}

const texture = loadTexture(gl, window.location.href + 'obamoid.png');
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

//
// Shaders
//

var vertCode = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uModelMatrix;
    uniform mat4 uVertexMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    void main(void) {
        gl_Position = uProjectionMatrix * uVertexMatrix * uModelMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`;

var fragCode = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`;

// Create vertex shader
var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

// Create fragment shader
var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

// Initialize shader program
var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

//
// Vertex shader attributes
//

var modelMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelMatrix");
var vertexMatrixLocation = gl.getUniformLocation(shaderProgram, "uVertexMatrix");
var projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
var uSamplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");

// Vertices
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
var vertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false,0,0) ;
gl.enableVertexAttribArray(vertexPosition);

// Texture
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
var textureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord");
gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false , 0, 0) ;
gl.enableVertexAttribArray(textureCoord);

// Bind texture
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.uniform1i(uSamplerLocation, 0);

// Select program
gl.useProgram(shaderProgram);

//
// Matrices
//

function get3DProjection(angle, width, height, zMin, zMax) {
    var ang = Math.tan((angle*.5)*Math.PI/180);//angle*.5
    var max = Math.max(width, height);
    return [
        (0.5/ang)*(height/max), 0 , 0, 0,
        0, (0.5/ang)*(width/max), 0, 0,
        0, 0, -(zMax+zMin)/(zMax-zMin), -1,
        0, 0, (-2*zMax*zMin)/(zMax-zMin), 0 
    ];
}

function get2DProjection(width, height, depth, scale) {
    var max = Math.max(width, height);
    return [
        scale*height/max, 0, 0, 0,
        0, scale*width/max, 0, 0,
        0, 0, 1 / depth, 0,
        0, 0, 0, 1,
    ];
}


//var projectionMatrix = get2DProjection(canvas.width, canvas.height, 10, 0.5);
var projectionMatrix = get3DProjection(40, canvas.width, canvas.height, 1, 10);

var modelMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
var viewMatrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

// Translating Z
viewMatrix[14] = viewMatrix[14]-3;

// Moving the camera
modelMatrix[13] = modelMatrix[13] + 0.3;
//rotateX(viewMatrix, 0.3)

//  
// Rotation 
//

function rotateZ(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]-s*m[1];
    m[4] = c*m[4]-s*m[5];
    m[8] = c*m[8]-s*m[9];

    m[1]=c*m[1]+s*mv0;
    m[5]=c*m[5]+s*mv4;
    m[9]=c*m[9]+s*mv8;
}


function rotateY(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv0 = m[0], mv4 = m[4], mv8 = m[8];

    m[0] = c*m[0]+s*m[2];
    m[4] = c*m[4]+s*m[6];
    m[8] = c*m[8]+s*m[10];

    m[2] = c*m[2]-s*mv0;
    m[6] = c*m[6]-s*mv4;
    m[10] = c*m[10]-s*mv8;
}

function rotateX(m, angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var mv1 = m[1], mv5 = m[5], mv9 = m[9];

    m[1] = m[1]*c-m[2]*s;
    m[5] = m[5]*c-m[6]*s;
    m[9] = m[9]*c-m[10]*s;

    m[2] = m[2]*c+mv1*s;
    m[6] = m[6]*c+mv5*s;
    m[10] = m[10]*c+mv9*s;
}

// Drawing
var last = 0;
//var lastRand = 0;
//var random = [1,1,1];

function loop(now) {
    var time = now-last;
    //lastRand += time;
    //if (lastRand > 2000) {
    //    random = [Math.random(), Math.random(), Math.random()];
    //    lastRand = 0;
    //}
    //rotateX(modelMatrix, time*0.001*random[0]);
    //rotateY(modelMatrix, time*0.001*random[1]);
    //rotateZ(modelMatrix, time*0.001*random[2]);
    rotateY(modelMatrix, time*0.001);
    last = now;

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(vertexMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);
