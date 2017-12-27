window.requestAnimationFrame = window.requestAnimationFrame
                            || window.webkitRequestAnimationFrame
                            || window.mozRequestAnimationFrame
                            || window.msRequestAnimationFrame;

var polycule = function(spec) {
    function drawEllipseByCenter(ctx, cx, cy, w, h) {
        drawEllipse(ctx, cx - w/2, cy - h/2, w, h);
    }

    function drawEllipse(ctx, x, y, w, h) {
        var kappa = .5522848,
            ox = (w / 2) * kappa, // control point offset horizontal
            oy = (h / 2) * kappa, // control point offset vertical
            xe = x + w,           // x-end
            ye = y + h,           // y-end
            xm = x + w / 2,       // x-middle
            ym = y + h / 2;       // y-middle

        ctx.beginPath();
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        ctx.closePath();
        ctx.stroke();
    }

    function Node(ctx, name) {
        this.ctx = ctx
        this.name = name
        this.width = Math.max(ctx.measureText(name).width, 80)
        this.height = 80
        this.x = this.y = 0
    }

    Node.prototype.draw = function() {
        drawEllipseByCenter(this.ctx, this.x, this.y, this.width * 1.2, this.height)

        this.ctx.fillText(this.name, this.x, this.y, this.width)
    }

    Node.prototype.setPosition = function(x, y) {
        var cnv = this.ctx.canvas

        this.x = Math.min(Math.max(this.width, x), cnv.width - this.width)
        this.y = Math.min(Math.max(this.height, y), cnv.height - this.height)
    }

    Node.prototype.pointOnEdge = function(angle) {
        return {x: Math.cos(angle) * this.width * 0.6, y: Math.sin(angle) * this.height / 2}
    }

    function drawConnection(a, b, color) {
        var ctx = a.ctx

        if(color == 'blue') {
          color = '#52bfff';
        } else if (color == 'green') {
          color == '#97ff7f';
        } else if (color == 'purple') {
          color = '#995de8';
        } else if (color == 'red') {
          color = '#ff5757';
        } else if (color == 'orange') {
          color = '#e8a241';
        }

        ctx.strokeStyle = color
        ctx.beginPath()

        var angle = Math.atan2(b.y - a.y, b.x - a.x)
        var p1 = a.pointOnEdge(angle)
        var p2 = b.pointOnEdge(angle+Math.PI)

        ctx.moveTo(a.x + p1.x, a.y + p1.y)
        ctx.lineTo(b.x + p2.x, b.y + p2.y)
        ctx.stroke()
    }

    function capitalize(x) {
        return x.substr(0, 1).toUpperCase() + x.substr(1)
    }

    var ctx = document.getElementById('polycule').getContext('2d')
    var style = window.getComputedStyle(ctx.canvas)

    var dims = ['width', 'height'].map(function(dim) {
        return ctx.canvas[dim] = window['inner' + capitalize(dim)]
    })

    ctx.fillStyle = "rgb(255, 255, 255)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = "1.5rem 'Open Sans Condensed'"

    var NODES = spec.nodes.map(function(name, i) {
        var n = new Node(ctx, name)

        // n.setPosition(Math.random() * dims[0], Math.random() * dims[1]).
        n.setPosition((dims[0]) / 5 * (i % 5), (dims[1]) / 5 * (i / 5))

        return n
    })

    var NODE_map = {}

    NODES.forEach(function(n) {
        NODE_map[n.name] = n })

    var EDGES = spec.connections.map(function(c) {
        var a = NODE_map[c[0]]
        var b = NODE_map[c[1]]
        var color = c[2]

        if (!a || !b) return null

        return [a, b, color]
    })

    function redraw() {
        ctx.clearRect(0, 0, dims[0], dims[1])
        ctx.strokeStyle = "rgb(255, 255, 255)"

        NODES.forEach(function(n) {
            n.draw()
        })

        EDGES.forEach(function(x) {
            drawConnection(x[0], x[1], x[2])
        })
    }

    var frame = 1
    // K is the optimal distance between vertices, 2.5 found experimentally.
    var k = 2.5 * Math.sqrt(((dims[0]*1.2) * (dims[1]*1.2)) / NODES.length);
    function recalc() {
        // From Thomas M. J. Fruchterman, Adward M. Reingold,
        // Graph Drawing by Force-directed Placement
        // javascript implementation based on http://stevehanov.ca/blog/index.php?id=65

        // C limits the speed of the movement. Things become slower over time.
        var C = Math.log( frame+1 )*100;
        frame++;

        // Calculate repulsive forces.
        NODES.forEach(function(v) {
            // Initialize velocity to none.
            v.vx = 0.0
            v.vy = 0.0
            // For each other node, calculate the repulsive force and adjust the velocity
            // in the direction of repulsion.
            NODES.forEach(function(u) {
                if (v == u) return

                // D is short hand for the difference vector between the positions
                // of the two vertices
                var Dx = v.x - u.x
                var Dy = v.y - u.y
                var len = Math.sqrt(Dx*Dx+Dy*Dy) // distance

                if ( len == 0 ) return // do not divide by zero

                var mul = k * k / (len*len * C)

                v.vx += Dx * mul
                v.vy += Dy * mul
            })
        })

        // Calculate attractive forces.
        EDGES.forEach(function(e) {
            // Each edge is an ordered pair of vertices [0] and [1]
            // there is also a color, but that's only used when drawing.
            var Dx = e[0].x - e[1].x
            var Dy = e[0].y - e[1].y
            var len = Math.sqrt(Dx * Dx + Dy * Dy) // distance.

            if ( len == 0 ) return // do not divide by zero

            var mul = len * len / k / C
            var Dxmul = Dx * mul
            var Dymul = Dy * mul

            // Attract both nodes towards each other.
            e[0].vx -= Dxmul
            e[0].vy -= Dymul
            e[1].vx += Dxmul
            e[1].vy += Dymul

        })

        // Here we go through each node and actually move it in the given direction.
        NODES.forEach(function(v) {
            var len = v.vx * v.vx + v.vy * v.vy;
            var max = 20;

            if (frame > 20) max = 2.0;

            if ( len > max ) {
                len = Math.pow( len, 0.5 );
                v.vx *= max / len;
                v.vy *= max / len;
            }

            v.setPosition(v.x + v.vx, v.y + v.vy)

        })
    }

    redraw()

    requestAnimationFrame(function anim() {
        recalc()
        redraw()

        if (frame++ > 1e3) return

        requestAnimationFrame(anim)
    })
};
