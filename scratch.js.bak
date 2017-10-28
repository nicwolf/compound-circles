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
    alert('Unable to initialize the shader program: ' + gl.getProgramInfo(shaderProgram));
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
    alert("Unable to compile the shader: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}


function initWebGl(canvas) {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }
  return gl
}

function main() {
  const canvas = document.querySelector("#glcanvas");
  const gl = initWebGl(canvas);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  var vertices = [
    0.0, 0.0, 0.0
  ];
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const vsSource = `
    attribute vec3 position;

    uniform float pointSize;
    uniform mat4 modelMatrix;

    void main() {
      gl_Position = modelMatrix * vec4(position, 1.0);
      gl_PointSize = pointSize;
    }
  `;
  const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'position'),
    },
    uniformLocations: {
      pointSize: gl.getUniformLocation(shaderProgram, 'pointSize'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'modelMatrix'),
    }
  }

  {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
                           3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  gl.useProgram(programInfo.program);
  gl.uniform1f(programInfo.uniformLocations.pointSize, 10.0);
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [0.5, 0.5, 0.0]);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelMatrix,
    false,
    modelMatrix
  )

  gl.drawArrays(gl.POINTS, 0, 1);
}

main();
