#version 300 es

precision mediump float;

out vec4 outColor;

in vec2 v_fragPosition;
// yes, I know preprocessing is a bad idea, but that's best way to include user functions
void main() {
    float x = v_fragPosition.x;
    float y = v_fragPosition.y;
    // the base function, at least for now, is always a sine wave
    // because the function must yield a number between 0.0 and 1.0
    float red = (1.0 + sin(RED_FUNCTION)) / 2.0;
    float green = (1.0 + sin(GREEN_FUNCTION)) / 2.0;
    float blue = (1.0 + sin(BLUE_FUNCTION)) / 2.0;
    vec3 v_color = vec3(red, green, blue);
    outColor = vec4(v_color, 1.0);
}