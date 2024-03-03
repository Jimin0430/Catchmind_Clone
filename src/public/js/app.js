console.log("Rikka's the best");
const socket = io();

const welcome = document.getElementById("welcome");
const joinForm = document.getElementById("joinForm");
const messageForm = document.getElementById("messageForm");
const messageList = document.querySelector("ul");
const messageInput = messageForm.querySelector("input");
const nickForm = document.getElementById("nickForm");
const room = document.getElementById("room");
//캔버스 기능
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

room.hidden = true;

let roomName;
let painting = false;

function showRoom(){
    room.hidden = false;
    joinForm.hidden = true;
    const roomTitle = room.querySelector('h3');
    roomTitle.innerText = `Room ${roomName}`;
}

function handleJoin(event){
    event.preventDefault();
    const input = joinForm.querySelector("input");
    socket.emit("join", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}

function sendMessage(event){
    event.preventDefault();
    const value = messageInput.value;
    socket.emit("message", value, roomName, () => {
        //자기 자신에게 채팅
        addMessage(`You : ${value}`);
    });
    messageInput.value = "";
}

function drawOnCanvas(x, y, isDrawing) {
    if (!isDrawing) return;
    //if (x === undefined || y === undefined) return;
    //x,y 출력
    console.log(x, y);

    //선 설정
    ctx.fillStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (isDrawing) {
        ctx.lineTo(x, y);
        ctx.stroke();
    } else {
        ctx.beginPath(); // 새 경로 시작
        ctx.moveTo(x, y);
    }
}


joinForm.addEventListener("submit", handleJoin);
messageForm.addEventListener("submit", sendMessage);
nickForm.addEventListener("submit", setNickname);

socket.on("welcome", (nickname)=>{
    addMessage(`${nickname} joined the chat`);
    console.log('welcome');
})

socket.on("bye", (nickname) => {
    addMessage(`${nickname} left the chat`);
})

socket.on("message", (msg) => {
    addMessage(msg);
})

socket.on("room_change", (msg)=> console.log(msg));

socket.on("draw", ({ x, y, isDrawing }) => {
    if (isDrawing) {
        drawOnCanvas(x, y, true);
    } else {
        // 시작점 설정
        ctx.beginPath();
    }
});


// socket.on("draw", ({ x, y, isDrawing }) => {
//     drawOnCanvas(x, y, isDrawing);
// });

function addMessage(msg){
    const li = document.createElement("li");
    li.innerText = msg;
    messageList.append(li);
}

function setNickname(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
    const value = input.value;
    socket.emit('set_nick', value, ()=>{
        console.log('닉네임 설정완료');
    });
    input.value = "";
}

//마우스 눌렀을 때
canvas.addEventListener("mousedown", (event) => {
    painting = true;
    const { offsetX, offsetY } = event;
    drawOnCanvas(offsetX, offsetY);
    socket.emit("draw", { x: offsetX, y: offsetY, isDrawing: true });
});

//마우스 움직일 때
canvas.addEventListener("mousemove", (event) => {
    if (!painting) return;
    const { offsetX, offsetY } = event;
    drawOnCanvas(offsetX, offsetY, true);
    socket.emit("draw", { x: offsetX, y: offsetY, isDrawing: true });
});

//마우스 뗄 때
canvas.addEventListener("mouseup", () => {
    painting = false;
    ctx.beginPath();
    socket.emit("draw", { isDrawing: false });
});
