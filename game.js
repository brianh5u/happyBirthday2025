var canvas=document.getElementById('mycanvas'), ctx=canvas.getContext('2d');
var ww=window.innerWidth, wh=window.innerHeight, cnt=0, cntMove=0, isEnd=0;
const bw=60, bh=45, ballSize=80, ballDis=200, fps=60;
var scale=Math.max(1920/ww, 1080/wh)*10, showSolution=0, firstPerson=0, isRandom=0;
canvas.width=ww, canvas.height=wh;
ctx.translate(ww/2, wh/2), ctx.scale(1, -1);

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function averageRGB(rgb1, rgb2) {
    const parseRGB = (rgb) => rgb.match(/\d+/g).map(Number);

    const [r1, g1, b1] = parseRGB(rgb1);
    const [r2, g2, b2] = parseRGB(rgb2);

    const avg = [
        Math.round((r1 + r2) / 2),
        Math.round((g1 + g2) / 2),
        Math.round((b1 + b2) / 2)
    ];

    return `rgb(${avg[0]}, ${avg[1]}, ${avg[2]})`;
}

class Edge{
    constructor(args){
        let def={
u:0, v:0
        };
        Object.assign(def, args), Object.assign(this, def);
    }
};

class Maze{
    constructor(args){
        let def={
            n:bw*bh, e0:[], p:[], e:[], ne:[], G:[], on:[], dis:0
        };
        Object.assign(def, args), Object.assign(this, def);
        if(this.e.length<bw*bh-1){
            var Se=[], Sne=[];
            for(var i=0; i<bw; ++i)for(var j=0; j<bh; ++j)Se.push([]), Sne.push([]);
            this.e.forEach(edge=>{Se[edge['u']].push(edge['v']);});
            this.ne.forEach(edge=>{Sne[edge['u']].push(edge['v']);});
            for(var i=0; i<bw; ++i)for(var j=0; j<bh-1; ++j){
                var u=i*bh+j, v=i*bh+j+1, isIn=0;
                Se[u].forEach(w=>{if(w==v)isIn=1;});
                Sne[u].forEach(w=>{if(w==v)isIn=1;});
                if(!isIn)this.e0.push(new Edge({u:u, v:v}));
            }
            for(var i=0; i<bw-1; ++i)for(var j=0; j<bh; ++j){
                var u=i*bh+j, v=(i+1)*bh+j, isIn=0;
                Se[u].forEach(w=>{if(w==v)isIn=1;});
                Sne[u].forEach(w=>{if(w==v)isIn=1;});
                if(!isIn)this.e0.push(new Edge({u:u, v:v}));
            }
            this.e0=shuffle(this.e0);
            for(var i=0; i<this.n; ++i)this.p.push(i);
            this.e.forEach(edge=>{this.union(edge.u, edge.v);});
            this.e0.forEach(edge=>{if(this.union(edge.u, edge.v))this.e.push(edge);})
        }
        for(var i=0; i<this.n; ++i)this.G.push([]), this.on.push(0);
        this.e.forEach(edge=>{
            this.G[edge.u].push(edge.v);
            this.G[edge.v].push(edge.u);
        });
        this.dfs(0, -1);
        this.on.forEach(i=>{this.dis+=i;});
    }

    find(x){
        if(x==this.p[x])return x;
        this.p[x]=this.find(this.p[x]);
        return this.p[x];
    }

    union(x, y){
        var rx=this.find(x), ry=this.find(y);
        this.p[rx]=ry;
        return rx!=ry;
    }

    dfs(x, p){
        console.log('(x, p)=', x, p);
        this.G[x].forEach(u=>{
            if(u!=p){
                this.dfs(u, x);
                if(this.on[u])this.on[x]=1;
            }
        });
        if(x==this.n-1)this.on[x]=1;
    }
};

class Ball{
    constructor(args){
        let def={
x:0, y:0, r:ballSize, color:'white', nbr:[], strokeType:'circle'
        };
        Object.assign(def, args), Object.assign(this, def);
    }

    draw(){
        ctx.save(), ctx.scale(1/scale, 1/scale), ctx.translate(this.x, this.y);
        ctx.beginPath(), ctx.arc(0, 0, this.r, 0, 2*Math.PI);
        ctx.fillStyle=this.color, ctx.fill();
        ctx.beginPath(), ctx.strokeStyle='white';
        var theta=Math.acos((ballDis*ballDis/4+ballSize*ballSize/4-ballSize*ballSize)/(ballDis*ballSize/2));
        if(this.strokeType=='circle')ctx.arc(0, 0, this.r, 0, 2*Math.PI), ctx.stroke();
        if(this.strokeType=='vertical')
            ctx.arc(0, 0, this.r, -theta, theta), ctx.stroke(),
            ctx.arc(0, 0, this.r, Math.PI-theta, Math.PI+theta), ctx.stroke();
        if(this.strokeType=='horizontal')
            ctx.arc(0, 0, this.r, Math.PI/2-theta, Math.PI/2+theta), ctx.stroke(),
            ctx.arc(0, 0, this.r, Math.PI*3/2-theta, Math.PI*3/2+theta), ctx.stroke();
        ctx.restore();
    }

    move(dx, dy){
        if(cnt>=cntMove){
            if(this.x+dx*ballDis<0||this.x+dx*ballDis>ballDis*(bw-1))return;
            if(this.y+dy*ballDis<0||this.y+dy*ballDis>ballDis*(bh-1))return;
            var idx=Math.round((this.x*bh+this.y)/ballDis);
            balls[idx].nbr.forEach(nbr=>{
                if(nbr==idx+dx*bh+dy)cntMove=cnt+6, this.x+=dx*ballDis, this.y+=dy*ballDis;
            });
        }
    }
};

var player=new Ball({r:ballSize/2, color:'red'}), player0=new Ball();
Object.assign(player0, player);
var balls=[], maze;
if(isRandom)maze=new Maze({e:es, ne:nes});
else maze=new Maze({e:edges});
var tmp=0;
//while(maze.dis<250)maze=new Maze(), ++tmp;
alert('Go to the top-right corner!');
//alert(String(maze.dis)+', '+String(tmp));

function init(){
    isEnd=0;
    for(var i=0; i<bw; ++i)for(var j=0; j<bh; ++j)balls.push(new Ball({x:i*ballDis, y:j*ballDis}));
    for(var i=0; i<bw*bh; ++i)balls[i].color=allColor[i];
    if(showSolution)for(var i=0; i<bw*bh; ++i)if(maze.on[i])balls[i].color='rgb(255, 255, 0)';
    maze.e.forEach(edge=>{
        if(edge.v-edge.u==1)balls.push(new Ball({
            x:Math.floor(edge.u/bh)*ballDis,
            y:(edge.u%bh+edge.v%bh)/2*ballDis,
            r:ballSize/2,
            strokeType:'vertical'
        }));
        else balls.push(new Ball({
            x:(Math.floor(edge.u/bh)+Math.floor(edge.v/bh))/2*ballDis,
            y:edge.u%bh*ballDis,
            r:ballSize/2,
            strokeType:'horizontal'
        }));
        balls[edge.u].nbr.push(edge.v), balls[edge.v].nbr.push(edge.u);
        balls[balls.length-1].color=averageRGB(balls[edge.u].color, balls[edge.v].color);
    });
    if(!firstPerson)ctx.translate(-ballDis/scale*(bw-1)/2, -ballDis/scale*(bh-1)/2);
}

var tt=0;

function draw(){
    ctx.fillStyle='rgba(0, 29, 46, 0.5)';
    ctx.fillRect(0-ww, 0-wh, (bw*ballDis+ww)*2, (bh*ballDis+wh)*2);
    balls.forEach(ball=>ball.draw());
    player.draw();
    ctx.save();
    if(firstPerson)ctx.translate(player0.x/scale, player0.y/scale);
    else ctx.translate(ballDis/scale*(bw-1)/2, ballDis/scale*(bh-1)/2);
    ctx.scale(1, -1), ctx.font='30px Arial', ctx.fillStyle='white';
    if(!isEnd)tt=Math.floor(cnt*10/fps)/10;
    var sx=Math.round(player.x/ballDis), sy=Math.round(player.y/ballDis);
    if(sx==bw-1&&sy==bh-1)isEnd=1;
    ctx.fillText('x:'+sx+' y: '+sy+' time: '+tt, -ww/2+10, -wh/2+33);
    if(isEnd){
        ctx.font='50px Arial';
        ctx.fillText('Happy', -ww/2+10, -wh/2+133);
        ctx.fillText('Birthday', -ww/2+50, -wh/2+203);
        ctx.fillText('to', -ww/2+150, -wh/2+273);
        ctx.fillText('You,', -ww/2+190, -wh/2+343);
        ctx.fillText('Janette', -ww/2+170, -wh/2+413);
        ctx.font='30px Arial';
        ctx.fillText('.... .- .--. .--. -.--', -ww/2+30, -wh/2+680);
        ctx.fillText('-... .. .-. - .... -.. .-', -ww/2+30, -wh/2+700);
        ctx.fillText('-.--   - ---   -.-- --- ..-', -ww/2+30, -wh/2+720);
        ctx.fillText('--..--   .--- .- -. . - - .', -ww/2+30, -wh/2+740);
        for(var i=0; i<balls.length; ++i){
            if(balls[i].y==6*ballDis||balls[i].y==5*ballDis||balls[i].y==4*ballDis||balls[i].y==3*ballDis){
                var ok=0;
                if(balls[i].x%ballDis)ok=1;
                balls[i].nbr.forEach(u=>{if(u==i+bh||u==i-bh)ok=1;});
                if(ok)balls[i].color='yellow';
            }
        }
        ctx.font='20px Arial';
        ctx.fillText('Do you find the secret', -ww/2+30, -wh/2+500);
        ctx.fillText('hidden in the maze?', -ww/2+140, -wh/2+520);
    }
    ctx.restore();
    requestAnimationFrame(draw);
}

function update(){
    var player2=new Ball();
    Object.assign(player2, player0);
    if(cntMove>cnt){
        player0.x+=(player.x-player0.x)/(cntMove-cnt);
        player0.y+=(player.y-player0.y)/(cntMove-cnt);
    }
    if(firstPerson)ctx.translate((player2.x-player0.x)/scale, (player2.y-player0.y)/scale);
    ++cnt;
}

init();
setInterval(update, 1000/fps);
requestAnimationFrame(draw);

document.addEventListener('keydown', function(evt){
    if(evt.code=='ArrowRight'||evt.code=='KeyD')player.move(1, 0);
    else if(evt.code=='ArrowUp'||evt.code=='KeyW')player.move(0, 1);
    else if(evt.code=='ArrowLeft'||evt.code=='KeyA')player.move(-1, 0);
    else if(evt.code=='ArrowDown'||evt.code=='KeyS')player.move(0, -1);
});
