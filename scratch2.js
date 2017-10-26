// #############################################################################
// BASE DATA STRUCTURES
// #############################################################################

// =============================================================================
// Node
// =============================================================================
function Node() = {
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
// Defaults
// =============================================================================
const COMPOUND_CIRCLE_DEFAULTS = {
  RADIUS: 0.1,  // Screen-Space Units
  AZIMUTH: 0.0, // Radians
  SPEED: 1.0,   // Radians per Second
  NUM_NODES: 3
}

// =============================================================================
// Model
// =============================================================================

// --------------------------
// Compound Circle Node Model
// --------------------------
function CompoundCircleNodeModel() = {

  Node.call(this);

  this.azimuth = COMPOUND_CIRCLE_DEFAULTS.AZIMUTH;
  this.radius = COMPOUND_CIRCLE_DEFAULTS.RADIUS;
  this.speed = COMPOUND_CIRCLE_DEFAULTS.SPEED;

}

CompoundCircleNodeModel.prototype.update = function(timeDelta) {
  azimuthDelta = this.speed * timeDelta;
  this.azimuth += azimuthDelta;
  this.azimuth %= 2.0 * Math.PI;
}

// ----------------------------
// Compound Circle System Model
// ----------------------------
function CompoundCircleSystemModel(numNodes) = {

  DoublyLinkedList.call(this);

  // Add Root Node
  root = CompoundCircleNodeModel;
  root.radius = 0.0;

  // Add Child Nodes
  for (var i=0; i<numNodes; ++i) {
    node = CompoundCircleNodeModel();
    this.add(node);
  }

}

CompoundCircleSystemModel.prototype.update = function(timeDelta) {
  for (var i=0; i<this.length; ++i) {
    this.item(i).update(timeDelta);
  }
}

// =============================================================================
// View
// =============================================================================

// -------------------------------
// Compound Circle System Renderer
// -------------------------------

function CompoundCircleSystemRenderer(gl) = {

  this.gl = gl;

  var vertices;
  var vsSource;
  var fsSource;
  var modelMatrix;

  // Rendering Lines
  vsSource = `
    attribute vec3 position;

    uniform mat4 modelMatrix;

    void main() {
      gl_Position = modelMatrix * vec4(position, 1.0);
    }
  `;
  fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;
  shaderProgramLine = initShaderProgram(gl, vsSource, fsSource);
  this.shaderProgramLineInfo = {
    program: shaderProgramLine,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgramLine, 'position'),
    },
    uniformLocations: {
      pointSize: gl.getUniformLocation(shaderProgramLine, 'pointSize'),
      modelMatrix: gl.getUniformLocation(shaderProgramLine, 'modelMatrix'),
    }
  };
  vertices = [
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
  ]
  bufferLine = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferLine);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    shaderProgramLineInfo.attribLocations.vertexPosition,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(
    shaderProgramPointInfo.attribLocations.vertexPosition
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Rendering Points
  vsSource = `
    attribute vec3 position;

    uniform float pointSize;
    uniform mat4 modelMatrix;

    void main() {
      gl_Position = modelMatrix * vec4(position, 1.0);
      gl_PointSize = pointSize;
    }
  `;
  fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;
  shaderProgramPoint = initShaderProgram(gl, vsSource, fsSource);
  this.shaderProgramPointInfo = {
    program: shaderProgramPoint,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgramPoint, 'position'),
    },
    uniformLocations: {
      pointSize: gl.getUniformLocation(shaderProgramPoint, 'pointSize'),
      modelMatrix: gl.getUniformLocation(shaderProgramPoint, 'modelMatrix'),
    }
  };
  vertices = [
    0.0, 0.0, 0.0,
  ]
  bufferPoint = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPoint);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    shaderProgramPointInfo.attribLocations.vertexPosition,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(
    shaderProgramPointInfo.attribLocations.vertexPosition
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

}

// TODO: Does a Buffer Array need to be bound to draw? Should the buffer arrays
//       for point/line be attached to this object?

CompoundCircleSystemRenderer.prototype.setup = function() {
  this.setupLineRenderer();
  this.setupPointRenderer();
}

CompoundCircleSystemRenderer.prototype.setupLineRenderer() {

}

CompoundCircleSystemRenderer.prototype.setupPointRenderer() {

}

CompoundCircleSystemRenderer.prototype.draw = function(compoundCircleSystem) {
  this.drawLines(compoundCircleSystem);
  this.drawNodes(compoundCircleSystem);
}

CompoundCircleSystemRenderer.prototype.drawNodes = function(compoundCircleSystem) {

}
CompoundCircleSystemRenderer.prototype.drawNode = function(node) {

}
CompoundCircleSystemRenderer.prototype.drawLines = function(compoundCircleSystem) {

}
CompoundCircleSystemRenderer.prototype.drawLine = function(node1, node2) {

}
