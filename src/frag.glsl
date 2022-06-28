#version 300 es

precision mediump float;

out vec4 outColor;

// x and y position of that point
in vec2 v_fragPosition;

// slider is a float given to the user to be able to utilze in their functions. Used for animations and stuff
uniform float u_slider;

void main() {
   /* 
      These defines make writing the function more concise. The reason I'm not using varibles
      is because these values won't necessarily be used , so if I assign it to a variable,
      it's possible that the compiler would think "hey, the program uses v_fragPosition (for example)
      because it's assigned to a variable" and keep that redundancy in the shader code.
      However #define's are compile time only, meaning that should the user not use v_fragPosition
      (because they haven't used both X and Y) the compiler would be able to easily spot
      that and optimize them away.
   */
   #define x v_fragPosition.x
   #define y v_fragPosition.y
   #define n u_slider
   /*
      The base function, at least for now, is always a sine wave.
      That's because the function must yield a number between 0.0 and 1.0,
      which is an easy thing to regulate with a sine wave. Also, a sine wave
      is cyclic and thus very convenient for animations.
      Yes, I know preprocessing is a bad idea, but that's best way to
      include user functions (since they are code rather than variables
      and cannot be passed in a `uniform`).
    */ 
   float red = (1.0 + sin(RED_FUNCTION)) / 2.0;
   float green = (1.0 + sin(GREEN_FUNCTION)) / 2.0;
   float blue = (1.0 + sin(BLUE_FUNCTION)) / 2.0;
   vec3 v_color = vec3(red, green, blue);
   outColor = vec4(v_color, 1.0);
}