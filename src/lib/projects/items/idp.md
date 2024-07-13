---
title: IDP
subtitle: An autonomous robot which achieved the only 100% score in the competition
date: "2024"
tags:
  - C++
  - Arduino
  - 2k LOC
href: https://github.com/apple-phi/idp
---

I love control systems---there is something so satisfying about complex behaviour emergent from simple feedback rules.

For the annual Integrated Design Project (IDP) of 2024 at the Cambridge University Engineering Department, my team designed and built an autonomous robot to navigate a maze, pick up parcels, and deliver them to the correct zones.

We had limited resources:

- an Arduino micro-controller
- some primitive sensors and motors
- raw materials

I worked with my friend Gael on the robot software, implementing a PID-based non-linear control system with low-pass filtering and feed-forward control. We put a lot of emphasis on a robust and composable software architecture, which allowed us to quickly iterate our algorithm.

Check out the video the CUED published of our robot on their [YouTube channel](https://youtu.be/8PjCkTg_oGc)!
