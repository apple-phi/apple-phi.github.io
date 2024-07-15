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

It makes linters (and other static analysis tools) very angry.

I wrote a Svelte preprocessor to automatically compile your PaperScript code into JavaScript, so you can use it in your Svelte components. This contrasts with the usual Paper.js way of doing it all on the client side. This way, Vite can optimise everything at build time with tree-shaking!

Much faster. Much better.

Here's a simple demo:

<SimpleExample />

<div class="text-balance">

```svelte
<script lang="​paperscript">
    const rect = new Path.Rectangle({
        size: view.size / 5,
        point: view.center,
        fillColor: 'orange'
    });
    function onFrame() {
        rect.rotate(5, (
            view.center + rect.bounds.center
        ) / 2);
    }
</script>

<canvas class="h-1/2 w-full" resize></canvas>
```

</div>

Wiggle your mouse below to see something more complex:

<SplashExample />

Isn't that cool? Check out the package on [npm](https://www.npmjs.com/package/svelte-paperscript) or the source code on [GitHub](https://github.com/apple-phi/svelte-paperscript)!
