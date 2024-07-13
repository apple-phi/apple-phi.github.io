---
title: Physarum
subtitle: Infinitely-tiled WebGL simulation of a slime mould
date: "2022"
tags:
  - JS/TS
  - WebGL
  - shaders
  - 500 LOC
href: https://github.com/apple-phi/physarum
---

Slime moulds are so *cool*.
Astronomers use them to model dark matter and the applied mathematicians Atushi Tero, Toshiyuki Nakagaki et al.
used them to verify the efficiency of the Tokyo rail network.

A while back I made a WebGL simulation of the slime mould *Physarum polycephalum* based on a blog and paper I read,
after I saw an old Sebastian Lague video on the topic.

It's bundled with Webpack---an ancient bit of tech---so I can't include it in this page directly,
but you can see it in action [here](https://apple-phi.github.io/physarum/).

As you navigate the slime mould by dragging the mouse, notice how the mould searches out for food and other slime moulds (in this case, copies of itself...) and builds efficient networks to connect them! You can pause the simulation by clicking.

If you're interested, you can also look at the [Github repo](https://github.com/apple-phi/physarum).
