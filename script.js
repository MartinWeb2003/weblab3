const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let rightPressed = false;
let leftPressed = false;
let score = 0;
let highScore = 0;
let gameOver = false;
let gameStarted = false;
let comboActive = false;
let comboTimer;
let comboCount = 0;

if (localStorage.getItem('breakoutHighScore')) {
    highScore = localStorage.getItem('breakoutHighScore');
}

const ball = {
    radius: 10,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 0,
    dx: 0,
    dy: 0
};

function initializeBall() {
    ball.speed = 4;
    let angle = Math.random() * Math.PI / 2 + Math.PI / 4;
    ball.dx = ball.speed * Math.cos(angle);
    ball.dy = -ball.speed * Math.sin(angle);
    ball.x = canvas.width / 2;
    ball.y = paddle.y - ball.radius - 1;
}

const paddle = {
    height: 20,
    width: 100,
    x: (canvas.width - 100) / 2,
    y: canvas.height - 20,
    speed: 7
};

const brick = {
    rowCount: 5,
    columnCount: 9,
    width: 50,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 35
};

const bricks = [];
for (let c = 0; c < brick.columnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brick.rowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

function keyDownHandler(e) {
    if (e.code === "Space") {
        if (!gameStarted) {
            gameStarted = true;
            initializeBall();
            draw();
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

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    }
    else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function collisionDetection() {
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                let brickX = b.x;
                let brickY = b.y;
                let brickWidth = brick.width;
                let brickHeight = brick.height;

                if (ball.x + ball.radius > brickX && ball.x - ball.radius < brickX + brickWidth &&
                    ball.y + ball.radius > brickY && ball.y - ball.radius < brickY + brickHeight) {

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
                            let angle45 = Math.PI / 4;
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
                    score += 100;

                    if (comboActive) {
                        comboCount++;
                        score += 50;
                        clearTimeout(comboTimer);
                    } else {
                        comboActive = true;
                        comboCount = 1;
                    }
                    comboTimer = setTimeout(() => {
                        comboActive = false;
                        comboCount = 0;
                    }, 2000);

                    if (isGameWon()) {
                        if (score > highScore) {
                            highScore = score;
                            localStorage.setItem('breakoutHighScore', highScore);
                        }
                        ctx.font = "24px Arial";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.textAlign = "center";
                        ctx.fillText("YOU WIN", canvas.width / 2, canvas.height / 2);
                        ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 + 30);
                        ctx.fillText("Pritisnite SPACE za ponovno igranje", canvas.width / 2, canvas.height / 2 + 60);
                        gameOver = true;
                        return;
                    }

                    break;
                }
            }
        }
    }
}

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

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#00FF00";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brick.width + brick.padding)) + brick.offsetLeft;
                let brickY = (r * (brick.height + brick.padding)) + brick.offsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brick.width, brick.height);
                ctx.fillStyle = "#0095DD";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText("SCORE: " + score, 8, 20);
    ctx.textAlign = "right";
    ctx.fillText("HIGH SCORE: " + highScore, canvas.width - 8, 20);

    if (comboActive && comboCount > 1) {
        ctx.textAlign = "center";
        ctx.fillText("COMBO x" + comboCount, canvas.width / 2, 20);
    }
}

function resetGame() {
    score = 0;
    gameOver = false;
    gameStarted = true;
    comboActive = false;
    comboCount = 0;
    clearTimeout(comboTimer);

    initializeBall();

    paddle.x = (canvas.width - paddle.width) / 2;

    for (let c = 0; c < brick.columnCount; c++) {
        for (let r = 0; r < brick.rowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("Pritisnite SPACE za početak igre", canvas.width / 2, canvas.height / 2);
        return;
    }

    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();

    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }

    collisionDetection();

    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    }

    if (ball.dy > 0) {
        if (ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height) {
            if (ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width) {
                ball.dy = -ball.dy;

                ball.speed *= 1.01;

                if (ball.speed < 4) {
                    ball.speed = 4;
                }

                let angle = Math.atan2(-ball.dy, ball.dx);
                ball.dx = ball.speed * Math.cos(angle);
                ball.dy = -ball.speed * Math.sin(angle);

                let deltaX = ball.x - (paddle.x + paddle.width / 2);
                ball.dx = deltaX * 0.1;

                let newSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                ball.speed = newSpeed;

                if (ball.speed < 4) {
                    ball.speed = 4;
                    let normalizationFactor = ball.speed / newSpeed;
                    ball.dx *= normalizationFactor;
                    ball.dy *= normalizationFactor;
                }
            }
        }
    }

    if (ball.y + ball.radius > paddle.y + 20) {
        gameOver = true;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('breakoutHighScore', highScore);
        }
        ctx.font = "48px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText("Pritisnite SPACE za ponovno igranje", canvas.width / 2, canvas.height / 2 + 50);
        return;
    } else {
        ball.x += ball.dx;
        ball.y += ball.dy;
    }

    if (!gameOver && isGameWon()) {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('breakoutHighScore', highScore);
        }
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("YOU WIN", canvas.width / 2, canvas.height / 2);
        ctx.fillText("SCORE: " + score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText("Pritisnite SPACE za ponovno igranje", canvas.width / 2, canvas.height / 2 + 60);
        gameOver = true;
        return;
    }

    if (!gameOver) {
        requestAnimationFrame(draw);
    }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

draw();
