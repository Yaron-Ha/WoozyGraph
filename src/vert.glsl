#version 300 es

uniform vec2 u_resolution;
uniform float u_blockSize;

in vec2 a_position;

out vec2 v_fragPosition;

void main() {
    vec2 updatedPos = a_position - 0.5; // add 0.5 for the x and y values, to make it draw from left downards
    // convert the rectangle from pixels to 0.0 to 1.0
    vec2 zeroToOne = updatedPos / u_resolution;
    // convert from 0 -> 1 to 0 -> 2
    vec2 zeroToTwo = zeroToOne * 2.0;
    // convert from 0 -> 2 to -1 -> +1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;
    // Flip 0,0 from bottom left to conventional 2D top left.
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    // use large points
    gl_PointSize = u_blockSize * u_blockSize;
    // set the color according to the position
    v_fragPosition = a_position;
}