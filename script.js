// Dohvaćanje canvas elementa iz DOM-a
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Postavljanje veličine canvasa na veličinu prozora preglednika
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

// Ključne varijable za igru
let rightPressed = false; 
let leftPressed = false;  
let score = 0;            
let highScore = 0;        
let gameOver = false;     
let gameStarted = false;  

// Provjera postoji li high score u lokalnoj pohrani
if (localStorage.getItem('breakoutHighScore')) {
    highScore = localStorage.getItem('breakoutHighScore');
}

// Definicija objekta loptice
const ball = {
    radius: 10,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 0,
    dx: 0,
    dy: 0
};

// Funkcija za inicijalizaciju loptice
function initializeBall() {
    ball.speed = 8; // Brža lopta
    let angle = Math.random() * Math.PI / 2 + Math.PI / 4; // Nasumični kut između 45° i 135°
    ball.dx = ball.speed * Math.cos(angle);  
    ball.dy = -ball.speed * Math.sin(angle); 
    ball.x = canvas.width / 2;               
    ball.y = paddle.y - ball.radius - 1;   
}

// palica
const paddle = {
    height: 20,
    width: 150,
    x: (canvas.width - 150) / 2,
    y: canvas.height - 30,
    speed: 12
};

// cigle
const brick = {
    rowCount: 6,
    columnCount: 8,
    width: 0,
    height: 30,
    padding: 20,
    offsetTop: 100,
    offsetLeft: 100
};

// Dinamička sirina cigle
let totalPadding = brick.padding * (brick.columnCount - 1);
let availableWidth = canvas.width - 2 * brick.offsetLeft - totalPadding;
brick.width = availableWidth / brick.columnCount;

// polje cigli
const bricks = [];
for (let c = 0; c < brick.columnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brick.rowCount; r++) {
        let brickX = (c * (brick.width + brick.padding)) + brick.offsetLeft;
        let brickY = (r * (brick.height + brick.padding)) + brick.offsetTop;
        bricks[c][r] = { x: brickX, y: brickY, status: 1 };
    }
}

// Pozadinska pjesma(Hail To The King 8-bit)
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;


window.addEventListener('load', () => {
    backgroundMusic.play().catch((error) => {
        console.log('Autoplay failed:', error);
    });
});

// je li korisnik pritisnuo tipku
function keyDownHandler(e) {
    if (e.code === "Space") {
        if (!gameStarted) {
            gameStarted = true;
            initializeBall();
            draw(); // Početak igre
        } else if (gameOver) {
            resetGame();
        }
    }
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    }
    else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

// korisnik pustio tipku
function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    }
    else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

// sudar lopte i cigle
function collisionDetection() {
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                let brickX = b.x;
                let brickY = b.y;
                let brickWidth = brick.width;
                let brickHeight = brick.height;

                if (ball.x + ball.radius > brickX &&
                    ball.x - ball.radius < brickX + brickWidth &&
                    ball.y + ball.radius > brickY &&
                    ball.y - ball.radius < brickY + brickHeight) {

                    let collision = false;
                    let corners = [
                        { x: brickX, y: brickY },
                        { x: brickX + brickWidth, y: brickY },
                        { x: brickX, y: brickY + brickHeight },
                        { x: brickX + brickWidth, y: brickY + brickHeight }
                    ];

                    for (let i = 0; i < corners.length; i++) {
                        let corner = corners[i];
                        let distX = ball.x - corner.x;
                        let distY = ball.y - corner.y;
                        let distance = Math.sqrt(distX * distX + distY * distY);

                        if (distance <= ball.radius) {
                            collision = true;
                            let angle45 = Math.PI / 4; //sudar s kutevima cigle
                            if (i === 0) {
                                ball.dx = -ball.speed * Math.cos(angle45);
                                ball.dy = -ball.speed * Math.sin(angle45);
                            } else if (i === 1) {
                                ball.dx = ball.speed * Math.cos(angle45);
                                ball.dy = -ball.speed * Math.sin(angle45);
                            } else if (i === 2) {
                                ball.dx = -ball.speed * Math.cos(angle45);
                                ball.dy = ball.speed * Math.sin(angle45);
                            } else if (i === 3) {
                                ball.dx = ball.speed * Math.cos(angle45);
                                ball.dy = ball.speed * Math.sin(angle45);
                            }
                            break;
                        }
                    }

                    if (!collision) {
                        let collisionFromTop = ball.y < brickY && ball.dy > 0;
                        let collisionFromBottom = ball.y > brickY + brickHeight && ball.dy < 0;
                        let collisionFromLeft = ball.x < brickX && ball.dx > 0;
                        let collisionFromRight = ball.x > brickX + brickWidth && ball.dx < 0;

                        if (collisionFromTop || collisionFromBottom) {
                            ball.dy = -ball.dy;
                        } else if (collisionFromLeft || collisionFromRight) {
                            ball.dx = -ball.dx;
                        } else {
                            ball.dx = -ball.dx;
                            ball.dy = -ball.dy;
                        }
                    }

                    b.status = 0;
                    score += 1;

                    if (isGameWon()) {
                        if (score > highScore) {
                            highScore = score;
                            localStorage.setItem('breakoutHighScore', highScore);
                        }
                        // Prikaz poruke o pobjedi
                        ctx.font = "24px Arial";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.textAlign = "center";
                        ctx.fillText("CONGRATULATIONS, YOU WON!", canvas.width / 2, canvas.height / 2);
                        ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 + 30);
                        ctx.fillText("Press SPACE to play again", canvas.width / 2, canvas.height / 2 + 60);
                        gameOver = true;
                        return;
                    }

                    break;
                }
            }
        }
    }
}

//je li igra dobivena
function isGameWon() {
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// crtanje loptice
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00FF00";
    ctx.fill();
    ctx.closePath();
}

// crtanje palice
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#FF0000";
    ctx.fill();

    // Sjenčanje ruba
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 10;

    ctx.lineWidth = 8;
    ctx.strokeStyle = "#FF0000";
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.closePath();
}

//crtanje cigli
function drawBricks() {
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                let b = bricks[c][r];
                ctx.beginPath();
                ctx.rect(b.x, b.y, brick.width, brick.height);
                ctx.fillStyle = "#0095DD";
                ctx.fill();

                // Sjenčanje ruba
                ctx.shadowColor = '#0095DD';
                ctx.shadowBlur = 10;

                ctx.lineWidth = 8;
                ctx.strokeStyle = "#0095DD";
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.closePath();
            }
        }
    }
}

//prikaz rezultata
function drawScore() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText("SCORE: " + score, canvas.width - 20, 30);
    ctx.fillText("HIGH SCORE: " + highScore, canvas.width - 20, 60);
}

// resetiraj igru
function resetGame() {
    score = 0;
    gameOver = false;
    gameStarted = true;

    initializeBall();

    paddle.x = (canvas.width - paddle.width) / 2;

    // cigle
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    draw();
}

// Glavna funkcija
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("Press SPACE to start the game", canvas.width / 2, canvas.height / 2);
        return;
    }

    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();

    // palica lijevo desno
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }

    collisionDetection();

    // sudar loptice i zida
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }

    // sudar loptice i palice
    if (ball.dy > 0) {
        if (ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height) {
            if (ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width) {
                ball.dy = -ball.dy;

                if (ball.speed < 8) {
                    ball.speed = 8;
                }

                let angle = Math.atan2(-ball.dy, ball.dx);
                ball.dx = ball.speed * Math.cos(angle);
                ball.dy = -ball.speed * Math.sin(angle);

                let deltaX = ball.x - (paddle.x + paddle.width / 2);
                ball.dx = deltaX * 0.1;
            }
        }
    }

    // je li lopta ispod palice
    if (ball.y + ball.radius > canvas.height) {
        gameOver = true;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('breakoutHighScore', highScore);
        }
        // game over
        ctx.font = "48px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText("Press SPACE to play again", canvas.width / 2, canvas.height / 2 + 50);
        return;
    } else {
        ball.x += ball.dx; 
        ball.y += ball.dy;
    }

    // je li pobjedio
    if (!gameOver && isGameWon()) {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('breakoutHighScore', highScore);
        }
        // poruka o pobjedi
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("CONGRATULATIONS, YOU WON!", canvas.width / 2, canvas.height / 2);
        ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText("Press SPACE to play again", canvas.width / 2, canvas.height / 2 + 60);
        gameOver = true;
        return;
    }

    if (!gameOver) {
        requestAnimationFrame(draw);
    }
}

// Dodavanje event listenera
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

// početna poruke
draw();
