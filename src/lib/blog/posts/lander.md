---
title: Rendering Martian terrain
subtitle: Throwing shade at shaders
date: "2023"
hidden: true
tags:
  - C++
  - OpenGL
  - shaders
  - 2k LOC
href: https://github.com/apple-phi/lander2
---

<script>
  import screenshotSrc from './lander/screenshot.png';
</script>

<img src={screenshotSrc} width=100%/>

I wrote a C++ program to render Martian terrain for the CUED Mars Lander competition.
The terrain is generated in modern OpenGL with shaders from high-res height-maps and textures from the MOLA instrument on the Mars Global Surveyor spacecraft.

I was really interest in making the graphics look good,
so lighting is done with the Blinn-Phong reflection model and is gamma-corrected. As much pre-computation is done with compute shaders as possible to keep the rendering fast. The camera panning and zooming is done by quaternion calculations to avoid gimbal lock.

There's a lot of physics involved in the competition, and I had to implement a lot of it myself. The lander is controlled by a PID controller, and is tuned to land on the ground without crashing.

I was quite pleased that I managed to tie for 2nd place. If you feel like it, you can check out the public half of the source code (the CUED was quite insistent that I keep some of it private) on [GitHub](https://github.com/apple-phi/lander2).
