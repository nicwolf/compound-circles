attribute vec3 position;

uniform float pointSize;
uniform mat4 modelMatrix;

void main() {
  gl_Position = modelMatrix * vec4(position, 1.0);
  gl_PointSize = pointSize;
}
