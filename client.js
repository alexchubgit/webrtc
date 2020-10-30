
let socket = io();

const roomInput = document.getElementById('room-input')
const connectButton = document.getElementById('connect-button')
const disconnectButton = document.getElementById('disconnect-button')

const stopVideo = document.getElementById('stop-video')
const stopAudio = document.getElementById('stop-audio')

const localVideoComponent = document.getElementById('local-video')
const remoteVideoComponent = document.getElementById('remote-video')

const mediaConstraints = {
    audio: true,
    video: { width: 1280, height: 720 },
}

let localStream
let remoteStream
let isRoomCreator
let rtcPeerConnection // Connection between the local device and the remote peer.
let roomId

// Free public STUN servers provided by Google.
const iceServers = {
    iceServers: [        
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.1und1.de' },
        { urls: 'stun:stunserver.org' },
        { urls: 'stun:stun.softjoys.com' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.voxgratia.org' },
        { urls: 'stun:stun.xten.com' }
    ],
}

// BUTTON LISTENER ============================================================
//if (connectButton !== null) {
connectButton.addEventListener('click', () => {
    //alert("BUTTON LISTENER")
    joinRoom(roomInput.value)
})
//}
disconnectButton.addEventListener('click', () => {
    alert("BUTTON LISTENER")
    //joinRoom(roomInput.value)
})

stopVideo.addEventListener('click', () => {
    alert("BUTTON LISTENER")
    //joinRoom(roomInput.value)
    alert(video.srcObject.getTracks())
})

stopAudio.addEventListener('click', () => {
    alert("BUTTON LISTENER")
    //joinRoom(roomInput.value)
})


// SOCKET EVENT CALLBACKS =====================================================
socket.on('room_created', async () => {
    console.log('Socket event callback: room_created')

    await setLocalStream(mediaConstraints)
    isRoomCreator = true
})

socket.on('room_joined', async () => {
    console.log('Socket event callback: room_joined')

    await setLocalStream(mediaConstraints)
    socket.emit('start_call', roomId)
})

socket.on('full_room', () => {
    console.log('Socket event callback: full_room')

    alert('The room is full, please try another one')
})

// FUNCTIONS ==================================================================
function joinRoom(room) {
    if (room === '') {
        alert('Please type a room ID')
    } else {
        roomId = room
        socket.emit('join', room)
        //showVideoConference()
    }
}

function showVideoConference() {
    //roomSelectionContainer.style = 'display: none'
    //videoChatContainer.style = 'display: block'
}

async function setLocalStream(mediaConstraints) {
    let stream
    try {
        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    } catch (error) {
        console.error('Could not get user media', error)
    }

    localStream = stream
    localVideoComponent.srcObject = stream
}

// SOCKET EVENT CALLBACKS =====================================================
socket.on('start_call', async () => {
    console.log('Socket event callback: start_call')

    if (isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        await createOffer(rtcPeerConnection)
    }
})

socket.on('webrtc_offer', async (event) => {
    console.log('Socket event callback: webrtc_offer')

    if (!isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        await createAnswer(rtcPeerConnection)
    }
})

socket.on('webrtc_answer', (event) => {
    console.log('Socket event callback: webrtc_answer')

    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('webrtc_ice_candidate', (event) => {
    console.log('Socket event callback: webrtc_ice_candidate')

    // ICE candidate configuration.
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
    })
    rtcPeerConnection.addIceCandidate(candidate)
})

// FUNCTIONS ==================================================================
function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
    })
}

async function createOffer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createOffer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
        console.error(error)
    }

    socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: sessionDescription,
        roomId,
    })
}

async function createAnswer(rtcPeerConnection) {
    let sessionDescription
    try {
        sessionDescription = await rtcPeerConnection.createAnswer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
        console.error(error)
    }

    socket.emit('webrtc_answer', {
        type: 'webrtc_answer',
        sdp: sessionDescription,
        roomId,
    })
}

function setRemoteStream(event) {
    remoteVideoComponent.srcObject = event.streams[0]
    remoteStream = event.stream
}

function sendIceCandidate(event) {
    if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
            roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
    }
}




navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 600, height: 400 } }).then(
    function success(stream) {
        const video = document.getElementById("local-video");
        video.srcObject = stream;
        video.onloadedmetadata = function (e) {
            video.play();
        };
    }
);

//список устройств
navigator.mediaDevices.enumerateDevices()
    .then(deviceList => {
        for (let { deviceId, label, kind } of deviceList) {
            console.log(deviceId)
            console.log(label)
            console.log(kind)
        }
    });


//Отключение звука или видео
// navigator.webkitGetUserMedia({ audio: false, video: true }, function (stream) {
//     document.getElementById('video').src = window.URL.createObjectURL(stream);
// });

// navigator.webkitGetUserMedia({ audio: true, video: false }, function (stream) {
//     document.getElementById('audio').src = window.URL.createObjectURL(stream);
// });




// function hasGetUserMedia() {
//     // Note: Opera builds are unprefixed.
//     return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
//         navigator.mozGetUserMedia || navigator.msGetUserMedia);
// }

// if (hasGetUserMedia()) {

//     navigator.getUserMedia({ audio: true, video: { width: 600, height: 400 } },
//         stream => {
//             const video = document.getElementById("local-video");
//             video.srcObject = stream;
//             video.onloadedmetadata = function (e) {
//                 video.play();
//             };
//         },
//         error => {
//             console.log("The following error occurred: " + error.name);
//         }
//     );
// } else {
//     alert('getUserMedia() is not supported in your browser');
// }


// if (navigator.mediaDevices) {
//     alert("Media device supported");
// }
// else {
//     alert("Media device not supported");
// }

// if (window.webkitURL) {

//     alert("WEBKIT")
//     //video.src = window.webkitURL.createObjectURL(stream);
// }


// navigator.getUserMedia(
//     { video: true, audio: true },
//     stream => {
//         const localVideo = document.getElementById("local-video");
//         if (localVideo) {
//             localVideo.srcObject = stream;
//         }
//     },
//     error => {
//         console.warn(error.message);
//     }
// );


//const ROOM_ID = "<%= roomId %>"

//console.log(ROOM_ID);

//socket.emit("join", ROOM_ID, 10);

// socket.on('user-connected', userId => {
//     console.log(userId);
// })