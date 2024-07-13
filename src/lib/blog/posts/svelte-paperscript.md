---
title: svelte-paperscript
subtitle: 99% of linters hate this one weird trick
date: "2024"
tags:
  - Svelte
  - 500 LOC
href: https://github.com/apple-phi/svelte-paperscript
---
<script>
    import SimpleExample from './svelte-paperscript/SimpleExample.svelte';
    import SplashExample from './svelte-paperscript/SplashExample.svelte';
    import '../../css/prism-dracula.css'
</script>

Ever wanted the ability to write [PaperScript](http://paperjs.org/) code directly in your Svelte components? No?
Well, too bad. You can do it anyway.

It makes linters very angry.

I wrote a Svelte preprocessor to automatically compile your PaperScript code into JavaScript, so you can use it in your Svelte components. Unlike regular Paper.js, this has the added benefit of skipping the compilation step on the client side, so your app will load faster.

Here's a simple demo:

<SimpleExample />

```svelte
<script lang="​paperscript">
    const rectangle = new Path.Rectangle({
        size: view.size / 5,
        point: view.center,
        fillColor: 'orange'
    });
    function onFrame() {
        rectangle.rotate(5, (view.center + rectangle.bounds.center) / 2);
    }
</script>

<canvas class="h-1/2 w-full" resize></canvas>

```

Wiggle your mouse below to see something more complex:

<SplashExample />

Isn't that cool? Check out the package on [npm](https://www.npmjs.com/package/svelte-paperscript) or the source code on [GitHub](https://github.com/apple-phi/svelte-paperscript)!
