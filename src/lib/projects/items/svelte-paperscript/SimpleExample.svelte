<script lang="paperscript">
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
