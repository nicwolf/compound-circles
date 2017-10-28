// #############################################################################
// INHERITANCE HELPERS
// #############################################################################

function extend(base, sub) {
  // Thanks to Stack Overflow's @juan-mendes:
  // See: https://stackoverflow.com/questions/4152931/ for original source.
  //
  // Avoid instantiating the base class just to setup inheritance
  // Also, do a recursive merge of two prototypes, so we don't overwrite
  // the existing prototype, but still maintain the inheritance chain
  // Thanks to @ccnokes
  var origProto = sub.prototype;
  sub.prototype = Object.create(base.prototype);
  for (var key in origProto)  {
     sub.prototype[key] = origProto[key];
  }
  // The constructor property was set wrong, let's fix it
  Object.defineProperty(sub.prototype, 'constructor', {
    enumerable: false,
    value: sub
  });
}

// #############################################################################
// BASE DATA STRUCTURES
// #############################################################################

// =============================================================================
// Node
// =============================================================================
function Node() {
  this.next = null;
  this.prev = null;
}

// =============================================================================
// Doubly Linked List
// =============================================================================
function DoublyLinkedList() {
  this.head = null;
  this.tail = null;
  this.length = 0;
};

DoublyLinkedList.prototype.remove = function(index) {
  if (index >= 0 && index < this.length) {
    var current = this.itemAt(index);
    // Special Case: First Item
    if (index == 0) {
      this.head = current.next;
      if (this.head == null) {
        this.tail = null;
      } else {
        this.head.prev = null;
      }
    }
    // Special Case: Last Item
    else if (index == this.length - 1) {
      this.tail = current.prev;
      this.tail.next = null;
    }
    // General Case
    else {
      current.prev.next = current.next;
      current.next.prev = current.prev;
    }
    // Update List
    --this.length;
    return current;
  }
};

DoublyLinkedList.prototype.add = function(node) {
  // Special Case: No Items
  if (this.head == null) {
    this.head = node;
    this.tail = node;
  }
  // General Case
  else {
    this.tail.next = node;
    node.prev = this.tail;
    this.tail = node;
  }
  // Update List
  ++this.length;
};

DoublyLinkedList.prototype.itemAt = function(index) {
  if (index >= 0 && index < this.length) {
    var current = this.head;
    for (var i=0; i<index; ++i) {
      current = current.next;
    }
    return current;
  }
};

// #############################################################################
// COMPOUND CIRCLE VISUALIZER
// #############################################################################

// =============================================================================
// Model
// =============================================================================

// --------------------------
// Compound Circle Node Model
// --------------------------

function CompoundCircleNodeModel() {
  Node.call(this);
  const DEFAULTS = {
    RADIUS: 0.1,  // Screen-Space Units
    AZIMUTH: 0.0, // Radians
    SPEED: 1.0,   // Radians per Second
  }
  this.azimuth = DEFAULTS.AZIMUTH;
  this.radius = DEFAULTS.RADIUS;
  this.speed = DEFAULTS.SPEED;
  this.pos = vec2.fromValues(0.1, 0.0);
}

extend(Node, CompoundCircleNodeModel);

CompoundCircleNodeModel.prototype.update = function(timeDelta) {
  azimuthDelta = this.speed * timeDelta;
  this.azimuth += azimuthDelta;
  this.azimuth %= 2.0 * Math.PI
  this.updatePosition();
}

CompoundCircleNodeModel.prototype.updatePosition = function() {
  var x = Math.cos(this.azimuth) * this.radius;
  var y = Math.sin(this.azimuth) * this.radius;
  vec2.set(this.pos, x, y);
}

// ----------------------------
// Compound Circle System Model
// ----------------------------

function CompoundCircleSystemModel(numNodes) {
  DoublyLinkedList.call(this);
  this.origin = vec2.create();
  // Add Nodes
  for (var i=0; i<numNodes; ++i) {
    node = new CompoundCircleNodeModel();
    this.add(node);
  }
}

extend(DoublyLinkedList, CompoundCircleSystemModel);

CompoundCircleSystemModel.prototype.update = function(timeDelta) {
  for (var i=0; i<this.length; ++i) {
    this.itemAt(i).update(timeDelta);
  }
}

// =============================================================================
// View
// =============================================================================

// -------------------------------
// WebGL Utilities
// -------------------------------

function initWebGl(canvas) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }
  return gl
}

function initShaderProgram(gl, vsSource, fsSource) {
  // Load Shaders
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  // Compile and Link Program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  // Error Handling
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw 'Unable to initialize the shader program: ' + gl.getProgramInfo(shaderProgram);
    return null;
  }
  // Return
  return shaderProgram
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw "Unable to compile the shader: " + gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// -------------------------------
// Line Renderer
// -------------------------------

function LineRenderer(gl) {
  this.gl = gl;
  this.setup();
}

LineRenderer.prototype.setupShader = function() {
  vertexShaderSource = `
    attribute vec3 position;

    uniform mat4 modelMatrix;

    void main() {
      gl_Position = modelMatrix * vec4(position, 1.0);
    }
  `;

  fragmentShaderSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;
  shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
  this.shader = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'position'),
    },
    uniformLocations: {
      modelMatrix: gl.getUniformLocation(shaderProgram, 'modelMatrix'),
    }
  };
}

LineRenderer.prototype.setupArrayBuffer = function () {
  if (!this.shader) {
    throw "Must setup shader before setting up this Array Buffer.";
  }
  var vertices = [
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
  ];
  this.buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    this.shader.attribLocations.vertexPosition,
    3, gl.FLOAT, false, 0, 0
  );
  gl.enableVertexAttribArray(
    this.shader.attribLocations.vertexPosition
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

LineRenderer.prototype.setup = function() {
  this.setupShader();
  this.setupArrayBuffer();
}

LineRenderer.prototype.draw = function(p0, p1) {
  const gl = this.gl;
  gl.useProgram(this.shader.program);
  // Create a vector to represent this line
  const line = vec2.create();
  vec2.sub(line, p1, p0);
  // Scale
  const length = vec2.length(line);
  const S = mat4.create();
  mat4.fromScaling(S, vec3.fromValues(length, length, length));
  // Rotate
  const theta = Math.atan2(line[1], line[0]);
  const R = mat4.create();
  mat4.fromRotation(R, theta, [0.0, 0.0, 1.0]);
  // Translate
  const T = mat4.create();
  mat4.fromTranslation(T, [p0[0], p0[1], 0.0]);
  // Create Model Matrix
  const modelMatrix = mat4.create();
  mat4.multiply(modelMatrix, R, S);
  mat4.multiply(modelMatrix, T, modelMatrix);
  // Send Uniforms
  gl.uniformMatrix4fv(
    this.shader.uniformLocations.modelMatrix, false, modelMatrix
  );
  // Draw
  gl.drawArrays(gl.LINES, 0, 2);
}

// -------------------------------
// Point Renderer
// -------------------------------

function PointRenderer(gl) {
  this.gl = gl;
  this.setup();
}

PointRenderer.prototype.setupShader = function() {
  vertexShaderSource = `
    attribute vec3 position;

    uniform float pointSize;
    uniform mat4 modelMatrix;

    void main() {
      gl_Position = modelMatrix * vec4(position, 1.0);
      gl_PointSize = pointSize;
    }
  `;

  fragmentShaderSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;
  shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
  this.shader = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'position'),
    },
    uniformLocations: {
      pointSize: gl.getUniformLocation(shaderProgram, 'pointSize'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'modelMatrix'),
    }
  };
}

PointRenderer.prototype.setupArrayBuffer = function () {
  if (!this.shader) {
    throw "Must setup shader before setting up this Array Buffer.";
  }
  var vertices = [
    0.0, 0.0, 0.0,
  ];
  this.buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    this.shader.attribLocations.vertexPosition,
    3, gl.FLOAT, false, 0, 0
  );
  gl.enableVertexAttribArray(
    this.shader.attribLocations.vertexPosition
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

PointRenderer.prototype.setup = function() {
  this.setupShader();
  this.setupArrayBuffer();
}

PointRenderer.prototype.draw = function(p) {
  const gl = this.gl;
  gl.useProgram(this.shader.program);
  gl.uniform1f(this.shader.uniformLocations.pointSize, 10.0);
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [p[0], p[1], 0.0])
  gl.uniformMatrix4fv(
    this.shader.uniformLocations.modelMatrix, false, modelMatrix
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  gl.drawArrays(gl.POINTS, 0, 1);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

// -------------------------------
// Compound Circle System Renderer
// -------------------------------

function CompoundCircleSystemRenderer(gl) {

  this.gl = gl;
  this.setup();

}

// TODO: Does a Buffer Array need to be bound to draw? Should the buffer arrays
//       for point/line be attached to this object?

CompoundCircleSystemRenderer.prototype.setup = function() {

  this.setupLineRenderer();
  this.setupPointRenderer();

}

CompoundCircleSystemRenderer.prototype.setupLineRenderer = function() {

  this.lineRenderer = new LineRenderer(this.gl);

}

CompoundCircleSystemRenderer.prototype.setupPointRenderer = function() {

  this.pointRenderer = new PointRenderer(this.gl);

}

CompoundCircleSystemRenderer.prototype.draw = function(compoundCircleSystem) {

  this.drawLines(compoundCircleSystem);
  this.drawPoints(compoundCircleSystem);

}

CompoundCircleSystemRenderer.prototype.drawPoints = function(compoundCircleSystem) {
  var origin = vec2.clone(compoundCircleSystem.origin);
  for (var i=0; i<compoundCircleSystem.length; ++i) {
    var node = compoundCircleSystem.itemAt(i);
    var drawAt = vec2.create();
    vec2.add(drawAt, origin, node.pos);
    this.drawPoint(drawAt);
    origin = drawAt;
  }

}

CompoundCircleSystemRenderer.prototype.drawPoint = function(pos) {

  this.pointRenderer.draw(pos);

}

CompoundCircleSystemRenderer.prototype.drawLines = function(compoundCircleSystem) {

  var p0 = vec2.clone(compoundCircleSystem.origin);
  for (var i=0; i<compoundCircleSystem.length; ++i) {
    var node = compoundCircleSystem.itemAt(i);
    var p1 = vec2.create();
    vec2.add(p1, p0, node.pos);
    this.drawLine(p0, p1);
    vec2.add(p0, p0, node.pos);
  }

}

CompoundCircleSystemRenderer.prototype.drawLine = function(p0, p1) {

  this.lineRenderer.draw(p0, p1);

}

// #############################################################################
// MAIN
// #############################################################################

var numNodes = 13;
var visualizerModel = new CompoundCircleSystemModel(numNodes);

const canvas = document.querySelector("#glCanvas");
const gl = initWebGl(canvas);

visualizerRenderer = new CompoundCircleSystemRenderer(gl);
lineRenderer = new LineRenderer(gl);

var then = 0;
function render(now) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  now *= 0.001;  // convert to seconds
  const deltaTime = now - then;
  then = now;
  visualizerModel.update(deltaTime);
  visualizerRenderer.draw(visualizerModel);
  // lineRenderer.draw(vec2.fromValues(0.0, 0.5), vec2.fromValues(1.0, 0.0));
  // lineRenderer.draw(vec2.fromValues(0.0, 0.0), vec2.fromValues(-0.2, -0.2));
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
