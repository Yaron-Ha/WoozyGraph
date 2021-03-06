# WoozyGraph

[![Demo 1](readme-res/img1.png "Colorful random function 1: Curls")](https://yaron-ha.github.io/WoozyGraph/#eyJpc1BhdXNlZCI6ZmFsc2UsImJsb2NrV2lkdGgiOjQuODQ4NTAwMDAwMDAwMDAwNSwiem9vbSI6Mi4xODQ1NDYzMTM3OTk2MjIsImFuaW1hdGlvblN0YXRlIjoiZm9yd2FyZCIsImFuaW1hdGlvblNwZWVkIjozLCJzZXBlcmF0ZUZ1bmN0aW9ucyI6dHJ1ZSwic2hhZGVGdW5jdGlvbiI6ImNlaWwoKG1pbigoMC4xMDMgKyB5KSwgbWF4KGNvcyhjb3MoY29zKG4pKSksIHNpbmgoeCkpKSAvIHRhbmgoeCkpKSIsInJlZEZ1bmN0aW9uIjoiKHNxcnQocG93KGNlaWwoeSksIGFzaW4oKHRhbihhY29zKHkpKSAqIG1pbih5LCB4KSkpKSkgKiAobiAtIHkpKSIsImdyZWVuRnVuY3Rpb24iOiIobG9nKHkpIC8gdGFuKG1pbihpbnZlcnNlc3FydCgoKHggLyAxMS41NjIpIC0gaW52ZXJzZXNxcnQoY2VpbCh4KSkpKSwgY2VpbChuKSkpKSIsImJsdWVGdW5jdGlvbiI6IigoeSArIHgpICogbWF4KHNxcnQoeSksIGF0YW4oKCgoKHggLyB5KSArIHJhZGlhbnMoeCkpIC8gbWluKDMuOTkwLCBuKSkgLSBtYXgobiwgeSkpKSkpIiwic2xpZGVyIjo4LjEwMDAzNDk5OTk5OTgzOH0=)

### Playable link: https://yaron-ha.github.io/WoozyGraph/

## What is this?
WoozyGraph is a WebGL based simulation game for the creation and display of woozy patterns and graphs.
The principle behind it is very simple:

The user provides a mathematical function for monochrome shading or three mathematical functions for RGB shading.
The function takes three basic variables, `x` `y` and `n`, and these variables can be shaped to create a shading function
that'll decide which color each pixel should be given. The function is injected into a GLSL fragment shader, meaning that
the user has the power of all GLSL functions in their hands, basically making the function a really basic fragment shader ran on big pixels.

The `x` variable is the left to right coordinate of the pixel, the `y` variable is the up to down coordinate of the pixel, and `n` is a uniform animation parameter passed to the shader and can be modified by the user and animated.

One important distinction which the shading function has, is the fact that it's always wrapped in a sine wave.
This wrapping has multiple benefits:
* Range: I can very easily clamp the function between 0 and 1, the GLSL color space range. The sine wave function returns
a number between -1 and 1, so this following forumla yields the desired range: ![((sin(f(x)) + 1) / 2](https://latex.codecogs.com/svg.image?\frac{sin(f(x))&plus;1}{2})
* Circularity: The output of the sine function is circular, which yields repeating values even when the `x` and `y` values get very large. This very circularity is the reason for WoozyGraph's unique patterns.

## Great! How do I play this game?
Just play around with the settings, I'm sure you'll find some interesting patterns!
**Left click** the canvas to generate random shader functions.
If you skimmed past many random shaders too fast and missed a cool one, **right click** the canvas to go back.
If you created or found a cool "build" (a combination of settings and functions) click the share link to
copy the build into a URL.

## I'm bored of generating random patterns. How can I make my own?
You don't necessarily need to have a deep knowledge of mathematics to create a cool shader function, just play
around with different [GLSL functions](https://docs.gl/el3/abs) until you get something nice!

## Um, I wrote my own function and the game froze. What happened?
You have an error in your function. The most common ones I encounter myself are forgetting to add a decimal point
to numbers (2 instead of 2.0, for example), and forgetting to close function parenthesis.
If you think the syntax is correct and the game is still frozen, open the console
and see what the reported issue is.

## Ok, cool, how can I mod this game?
Download this repository, and make sure you have `yarn` installed.
Open a terminal window in the repository's folder, then run `yarn` to install
required packages, and then `yarn dev` for live debugging or `yarn build` to build this game into a static website.
Make sure you read the license first, please.

## Example screenshots (click to open in WoozyGraph)
[![Demo 2](readme-res/img2.png "Colorful random function 2: Sea")](https://yaron-ha.github.io/WoozyGraph/#eyJpc1BhdXNlZCI6ZmFsc2UsImJsb2NrV2lkdGgiOjUuODY5Mywiem9vbSI6My4wNjkyMzQ0MDQ1MzY4NjIsImFuaW1hdGlvblN0YXRlIjoiZm9yd2FyZCIsImFuaW1hdGlvblNwZWVkIjozLCJzZXBlcmF0ZUZ1bmN0aW9ucyI6dHJ1ZSwic2hhZGVGdW5jdGlvbiI6IihzaW4ocG93KG1heChuLCB5KSwgbWluKG1pbihuLCB5KSwgbWluKHBvdyh4LCB4KSwgcG93KG1pbih4LCBuKSwgKG4gLSB5KSkpKSkpICogbWF4KG4sIG4pKSIsInJlZEZ1bmN0aW9uIjoiKChsb2cocG93KHNxcnQoKG1pbihuLCB5KSArICh5IC0geCkpKSwgY2VpbChuKSkpICogdGFuKHkpKSAtIGxvZyhuKSkiLCJncmVlbkZ1bmN0aW9uIjoiY2VpbChtYXgocm91bmQobiksIGxvZyh0YW4odGFuKChsb2coeSkgLyBtYXgoeSwgeCkpKSkpKSkiLCJibHVlRnVuY3Rpb24iOiIoc2luKHkpIC0gYWJzKHBvdygoeCArIHgpLCBzaW4oYWJzKChwb3cobiwgbikgLyBtYXgoeSwgbikpKSkpKSkiLCJzbGlkZXIiOjUuMjE2NjgxMDAwMDAwMDk1fQ==)
[![Demo 3](readme-res/img3.png "Colorful random function 3: Flag")](https://yaron-ha.github.io/WoozyGraph/#eyJpc1BhdXNlZCI6ZmFsc2UsImJsb2NrV2lkdGgiOjYuMDk1Njk4OTUxNjcyMzE0LCJ6b29tIjoyLCJhbmltYXRpb25TdGF0ZSI6ImZvcndhcmQiLCJhbmltYXRpb25TcGVlZCI6Mywic2VwZXJhdGVGdW5jdGlvbnMiOnRydWUsInNoYWRlRnVuY3Rpb24iOiJjZWlsKHNxcnQoY29zKHBvdyhzcXJ0KHNpbihhYnMobikpKSwgcG93KHksIHkpKSkpKSIsInJlZEZ1bmN0aW9uIjoibWF4KCh0YW4oeCkgLSAobWluKG4sIHkpICsgcm91bmQobWF4KChyb3VuZChuKSArIGFicyh4KSksIGNvcyh5KSkpKSksIG1heChuLCB4KSkiLCJncmVlbkZ1bmN0aW9uIjoiYWJzKCgobiAvIG4pIC0gY2VpbChzcXJ0KHBvdyhzaW4oKHggLSB4KSksIGNvcyh4KSkpKSkpIiwiYmx1ZUZ1bmN0aW9uIjoiKHRhbihtaW4ocG93KHJvdW5kKHNpbihzaW4obikpKSwgcm91bmQoeSkpLCBtaW4obiwgbikpKSArIGNvcyhuKSkiLCJzbGlkZXIiOjUuMDAxMjM5MDAwMDAwMTczfQ==)
[![Demo 5](readme-res/img5.png "Colorful random function 4: Mottled pillars")](https://yaron-ha.github.io/WoozyGraph/#eyJibG9ja1dpZHRoIjo1LjI1NzE2ODQyMTA0MzE2OSwiem9vbSI6My4zMzI1NDU0NzMyMjk4ODQsImFuaW1hdGlvblN0YXRlIjoiZm9yd2FyZCIsImFuaW1hdGlvblNwZWVkIjozLCJzZXBlcmF0ZUZ1bmN0aW9ucyI6dHJ1ZSwicmVkRnVuY3Rpb24iOiJsb2coKHJhZGlhbnMobWF4KCgoeSArIHkpICsgKHNxcnQoeCkgKiBtaW4oKHNxcnQobWluKChuICsgbiksIHBvdyhzaW4oY29zaCh0YW5oKGNvcyhyYWRpYW5zKGludmVyc2VzcXJ0KChtaW4oMTYuNjc1LCBuKSArIG1heCh4LCB5KSkpKSkpKSksIGFicyhuKSkpKSAtIHRhbmgoeCkpLCBwb3cobiwgeSkpKSksIGFicyh5KSkpIC8gbWF4KG4sIHgpKSkiLCJncmVlbkZ1bmN0aW9uIjoibWluKHRhbih4KSwgbWF4KG1heCh0YW5oKHkpLCBpbnZlcnNlc3FydCgocm91bmQoeSkgKyAobWluKHksIHgpICogbWluKHBvdyhtaW4obWluKHJhZGlhbnMoKGFicyhjb3NoKHNxcnQoKHNxcnQoeSkgLyBzcXJ0KCh0YW4oeSkgKiBzcXJ0KG4pKSkpKSkpIC8gc2luKG4pKSksIG1pbih4LCB4KSksIChuICsgNS43MDkpKSwgKG4gKiB4KSksIGNlaWwoeCkpKSkpKSwgKHggKyB5KSkpIiwiYmx1ZUZ1bmN0aW9uIjoic2luKHNpbigoc2luKGxvZyhhYnMoYWJzKCgoMTcuNjE3ICogeCkgLSBtYXgoKG4gLSB5KSwgKChtaW4obWF4KGNvcyhwb3codGFuKG1pbigoaW52ZXJzZXNxcnQoeCkgLSBwb3cobiwgbikpLCBzcXJ0KHkpKSksICg0Ljg0MiArIHkpKSksICh4IC0gMTcuNTE5KSksIHNpbih4KSkgKiBtYXgoeCwgeCkpIC0gaW52ZXJzZXNxcnQobikpKSkpKSkpICogKHkgKyB4KSkpKSIsInNsaWRlciI6My43OTMxNzc5OTk5OTk5NjUsImlzUGF1c2VkIjpmYWxzZX0=)
[![Demo 4](readme-res/img4.png "The builtin demo function: x * y * n")](https://yaron-ha.github.io/WoozyGraph/#eyJibG9ja1dpZHRoIjo1LjQyLCJ6b29tIjoyLCJhbmltYXRpb25TdGF0ZSI6ImZvcndhcmQiLCJhbmltYXRpb25TcGVlZCI6Mywic2VwZXJhdGVGdW5jdGlvbnMiOmZhbHNlLCJzaGFkZUZ1bmN0aW9uIjoieCAqIHkgKiBuIiwic2xpZGVyIjo1LjAwMDE4OTAwMDAwMDAyNn0=)
