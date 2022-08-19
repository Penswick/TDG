const canvas = document.getElementById('canvas1')
const ctx = canvas.getContext('2d')
canvas.width = 900;
canvas.height = 600
const cellSize = 100
const cellGap = 3
const gameGrid = []
const soldiers = []
let numberOfResources = 300
let enemiesInterval = 600
let frame = 0
let gameOver = false
let score = 0

const winningScore = 500
const enemies = []
const enemyPositions = []
const missles = []
const resources = []

//mouse movement
const mouse = {
    x: 10,
    y: 10,
    width: 0.1, 
    height: 0.1,
}
let canvasPosition = canvas.getBoundingClientRect()
canvas.addEventListener('mousemove', function(e){
    mouse.x = e.x - canvasPosition.left
    mouse.y = e.y - canvasPosition.top
})
canvas.addEventListener('mouseleave', function(){
    mouse.y = undefined
    mouse.x = undefined
})


// battlefield
const mainBar = {
    width: canvas.width,
    height: cellSize,
} 

class Cell {
    constructor(x, y){
        this.x = x
        this.y = y
        this.width = cellSize
        this.height = cellSize
    }
    draw(){
        if (mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = 'black'
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
function createGrid(){ //builds the grid system, takes the cells above and makes them into a...grid.
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x <canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y))
        }
    }
}

createGrid()

function handleGameGrid(){
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw()
    }
}

// missles
class Missle {
    constructor(x, y){ //missle constructor takes the x and y coordinates of the soldier sprite and creates a missle 
        this.x = x
        this.y = y
        this.width = 5 //missle size
        this.height = 5
        this.damage = 20
        this.speed = 5
    }
    update(){
        this.x += this.speed
    }
    draw(){
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2)
        ctx.fill()
    }
}
function handleMissles(){
    for (let i = 0; i < missles.length; i++){
        missles[i].update();
        missles[i].draw();

        for (let j = 0; j < enemies.length; j++){
            if (enemies[j] && missles[i] && collision(missles[i], enemies[j])){
                enemies[j].hp -= missles[i].damage;
                missles.splice(i, 1);
                i--;
            }
        }

        if (missles[i] && missles[i].x > canvas.width - cellSize){
            missles.splice(i, 1);
            i--;
        }
    }
}

// soldiers 
const soldier1 = new Image()
soldier1.src = '../sprites/balspritesheet.png'
class Soldier { 
    constructor(x, y){
        this.x = x
        this.y = y
        this.width = cellSize - cellGap * 2
        this.height = cellSize - cellGap * 2
        this.blasting = false
        this.blastNow = false
        this.hp = 50
        this.missles = []
        this.timer = 0
        this.frameX = 0
        this.frameY = 0
        this.spriteWidth = 85
        this.spriteHeight = 85
        this.minFrame = 0
        this.maxFrame = 2
    }
    draw(){
        ctx.fillStyle = 'transparent'
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillStyle = 'red'
        ctx.font = '15px MedievalSharp'
        ctx.fillText(Math.floor(this.hp), this.x + 22, this.y + 70)
        ctx.drawImage(soldier1, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)
    }
    update(){
        if (frame % 25 === 0){ //controls animation/shooting speed
            if (this.frameX < this.maxFrame) this.frameX++
            else this.frameX = this.minFrame
            if(this.frameX === 0) this.blastNow = true
        }
        if (this.blasting){
            this.minFrame = 0 //frames used when enemy is detected
            this.maxFrame = 2
        } else { 
            this.minFrame = 0 //idle frames, for when they're not shooting
            this.maxFrame = 0
        }
        if(this.blasting && this.blastNow){
            missles.push(new Missle(this.x + 50, this.y + 50))
        this.blastNow = false}
        }
    }


function handleSoldiers(){
    for (let i = 0; i < soldiers.length; i++) {
        soldiers[i].draw()
        soldiers[i].update()
        if (enemyPositions.indexOf(soldiers[i].y) !== -1){
            soldiers[i].blasting = true
        } else {
            soldiers[i].blasting = false
        }
        for (let j = 0; j < enemies.length; j++){ //YOU COST ME AN HOUR FOR GOD SAKE
        if (soldiers[i] && collision(soldiers[i], enemies[j])){
            enemies[j].movement = 0
            soldiers[i].hp -= 0.2
        }
        if (soldiers[i] && soldiers[i].hp <= 0){
            soldiers.splice(i, 1)
            i--
            enemies[j].movement = enemies[j].speed
            }
        }
    }
}



//pop ups
const floatingMessages = []
class floatingMessage {
    constructor(value, x, y, size){
        this.value = value
        this.x = x
        this.y = y 
        this.size = size
        this.lifeSpan = 0
        this.opacity = 1
    }
    update(){
        this.y -= 0.3
        this.lifeSpan += 1
        if (this.opacity > 0.01) this.opacity -= 0.01 //handles the speed of fade out
    }
    draw(){
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = []
        ctx.font = this.size + 'px MedievalSharp'
        ctx.fillText(this.value, this.x, this.y)
        ctx.globalAlpha = 1
    }
}
function handleFloatingMessages(){ //handles the diff pop up messages 
    for (let i = 0; i < floatingMessages.length; i++){
        floatingMessages[i].update()
        floatingMessages[i].draw()
        if (floatingMessages[i].lifeSpan > 50){
            floatingMessages.splice(i, 1)
            i--
        }
    }
}



// enemies
const enemyTypes = []
const enemy1 = new Image()
enemy1.src = '../sprites/wormsheet.png'
enemyTypes.push(enemy1)
class Enemy {
    constructor(verticalPosition){
        this.x = canvas.width
        this.y = verticalPosition
        this.width = cellSize - cellGap * 2 //enemy size. Didn't need to make them smaller. But I hate how they didn't match.
        this.height = cellSize - cellGap * 2
        this.speed = Math.random() * 0.2 + 0.4
        this.movement = this.speed
        this.hp = 140
        this.maxhp = this.hp
        this.enemyType = enemyTypes[0]
        this.frameX = 0
        this.frameY = 0 //don't touch for now, save this for bosses enemies
        this.minFrame = 0
        this.maxFrame = 6 // enemy sprites. JS counts from 0, so 8 frames = 7
        this.spriteWidth = 85 //size of sprite
        this.spriteHeight = 85
    }
    update(){
        this.x -= this.movement
        if(frame % 10 === 0 ){ //controls the speed of enemy sprites animation
            if (this.frameX < this.maxFrame) this.frameX++
            else this.frameX = this.minFrame
        }

    }
    draw(){
        ctx.fillStyle = 'transparent'
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.fillStyle = 'red'
        ctx.font = '15px MedievalSharp'
        ctx.fillText(Math.floor(this.hp), this.x + 38, this.y + 25)
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y,
             this.width, this.height) //enemy sprite
    }
}

function handleEnemies(){
    for (let i = 0; i < enemies.length; i++){
        enemies[i].update()
        enemies[i].draw()
        if (enemies[i].x < 0){
            gameOver = true
        }
        if (enemies[i].hp <= 0){
            let gainedResources = enemies[i].maxhp/10 //calculates gold earned from killing enemy. Currently it is 10% of their hp
            numberOfResources += gainedResources
            score += gainedResources
            const findThisIndex = enemyPositions.indexOf(enemies[i].y)
            enemyPositions.splice(findThisIndex, 1)
            enemies.splice(i, 1)
            i--
        }
    }
    if (frame % enemiesInterval === 0 && score < winningScore){ //handles enemy spawn. Stops em from spawning if the score is too high.
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap //soldiers couldn't detect the enemies due to size.
        enemies.push(new Enemy(verticalPosition))
        enemyPositions.push(verticalPosition)
        if (enemiesInterval > 120) enemiesInterval -=50
    }
}


// Miscellaneous 
function handleGameStatus(){
    ctx.fillStyle = 'gold'
    ctx.font = '50px MedievalSharp'
    ctx.fillText('score: ' + score, 30, 40)
    ctx.fillText('Gold: ' + numberOfResources, 28, 85)
    if (gameOver){
        ctx.fillStyle = 'red'
        ctx.font = '90px MedievalSharp'
        ctx.fillText('Fail, try again', 160, 350)
    }
    if (score >= winningScore && enemies.length === 0){
        ctx.fillStyle = 'gold'
        ctx.font = '40px MedievalSharp'
        ctx.fillText('Congratulations, you beat the demo!', 130, 300)
        ctx.font = '25px MedievalSharp'
        ctx.fillText('You earned ' + score + ' points', 134, 340)
    }
}

canvas.addEventListener('click', function(){
    const gridPositionX = mouse.x - (mouse.x% cellSize) + cellGap
    const gridPositionY = mouse.y - (mouse.y% cellSize) + cellGap
    if (gridPositionY < cellSize) return
    for (let i = 0; i < soldiers.length; i++){
        if (soldiers[i].x === gridPositionX && soldiers[i].y === gridPositionY) 
        return
    }
    let soldiersCost = 75 //cost of a single soldier
    if (numberOfResources >= soldiersCost){ // checks to see if you have enough gold for it
        soldiers.push(new Soldier(gridPositionX, gridPositionY))
        numberOfResources -= soldiersCost // takes away the cost
    } else {
        floatingMessages.push(new floatingMessage('Not enough gold!', mouse.x, mouse.y, 30))
    }
})

function animate(){
    ctx.clearRect(0,0, canvas.width, canvas.height)
    ctx.fillStyle = 'blue'
    ctx.fillRect(0,0,mainBar.width, mainBar.height)
    handleGameGrid()
    handleSoldiers()
    handleMissles()
    handleEnemies()
    handleGameStatus()
    handleFloatingMessages()
    frame++
    if (!gameOver) requestAnimationFrame(animate)
}
animate()


//Collision detection
function collision(first, second){
    if (
        !(first.x > second.x + second.width || 
        first.x + first.width < second.x || 
        first.y > second.y + second.height ||
        first.y + first.height < second.y)
        ) {
            return true
    }
}

window.addEventListener('resize', function(){
    canvasPosition = canvas.getBoundingClientRect()
})