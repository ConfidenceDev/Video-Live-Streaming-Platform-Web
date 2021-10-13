window.onload = init
const socket = io("https://vebbo.herokuapp.com/", { secure: true })
// const socket = io("http://localhost:****")
socket.binaryType = "arraybuffer"
let streamerDoc = null
socketInit()
let context
let buf
let isLive = true
let pos = 0
let img = localStorage.getItem("image")
let userName, locate, bio, facebook, instagram, twitter, website
let opt1 = null,
  opt2 = null,
  opt3 = null
let flagUTC = []
let blobArray = []
let filter, compressor, gainNode, mediaStreamSource, audioPreprocessNode
let isMute = true
let FPS = 30
let isCam = false
let selected = null
let naira = "400"
let pVal = 0
let parser = null
const parserFPS = 1000 / FPS
const enabled = false
noteBtn.style = "opacity: .4"
noteBtn.style.pointerEvents = "none"

opt1 = localStorage.getItem("opt1") ? localStorage.getItem("opt1") : null
opt2 = localStorage.getItem("opt2") ? localStorage.getItem("opt2") : null
opt3 = localStorage.getItem("opt3") ? localStorage.getItem("opt3") : null

if (opt1 != null) {
  const items = selectDiv.children
  items[1].children[0].children[1].src = `./assets/icons/unlock.png`
}
if (opt2 != null) {
  const items = selectDiv.children
  items[2].children[0].children[1].src = `./assets/icons/unlock.png`
}
if (opt3 != null) {
  const items = selectDiv.children
  items[3].children[0].children[1].src = `./assets/icons/unlock.png`
}

if (img > 0 && img != null && img != undefined) {
  profileImgBtn.src = `./assets/icons/mood_${localStorage.getItem("image")}.png`
  avatarList.children[localStorage.getItem("image") - 1].style = "opacity: .4"

  usernameField.value = localStorage.getItem("username")
  locationField.value = localStorage.getItem("location")
  facebookField.value = localStorage.getItem("facebook")
  instaField.value = localStorage.getItem("instagram")
  twitField.value = localStorage.getItem("twitter")
  webField.value = localStorage.getItem("website")
  bioField.value = localStorage.getItem("bio")
  flagUTC[0] = localStorage.getItem("flagUTC")

  userName = localStorage.getItem("username")
    ? localStorage.getItem("username")
    : ""
  locate = localStorage.getItem("location")
    ? localStorage.getItem("location")
    : ""
  bio = localStorage.getItem("bio") ? localStorage.getItem("bio") : ""
  facebook = localStorage.getItem("facebook")
    ? localStorage.getItem("facebook")
    : ""
  instagram = localStorage.getItem("instagram")
    ? localStorage.getItem("instagram")
    : ""
  twitter = localStorage.getItem("twitter")
    ? localStorage.getItem("twitter")
    : ""
  website = localStorage.getItem("website")
    ? localStorage.getItem("website")
    : ""
  pos = localStorage.getItem("image")
}

avatarList.addEventListener("click", (e) => {
  e.preventDefault()
  const items = avatarList.children
  const targetElement = e.target || e.srcElement
  const src = targetElement.getAttribute("src")
  const item = src.split("_")
  pos = item[1].split(".")[0]

  for (let i = 0; i < items.length; i++) {
    const item = items[i].currentSrc.split("_")
    const curPos = item[1].split(".")
    items[i].style = "opacity: 1"
  }
  targetElement.style = "opacity: .4"
  profileImgBtn.src = `./assets/icons/mood_${pos}.png`
})

bioField.addEventListener("keyup", () => {
  bioCount.innerText = `${bioField.value.length}/32`
})

saveBtn.addEventListener("click", (e) => {
  const uVal = usernameField.value ? usernameField.value : ""
  const lVal = locationField.value ? locationField.value : ""
  const fVal = facebookField.value ? facebookField.value : ""
  const iVal = instaField.value ? instaField.value : ""
  const tVal = twitField.value ? twitField.value : ""
  const wVal = webField.value ? webField.value : ""
  const bVal = bioField.value ? bioField.value : ""

  if (pos === 0 || uVal === "") {
    showMsg("Enter a Username and Select an Avatar")
    return
  }

  img = pos
  userName = uVal
  locate = lVal
  facebook = fVal
  instagram = iVal
  twitter = tVal
  website = wVal
  bio = bVal

  localStorage.setItem("image", pos)
  localStorage.setItem("username", uVal)
  localStorage.setItem("location", lVal)
  localStorage.setItem("facebook", fVal)
  localStorage.setItem("instagram", iVal)
  localStorage.setItem("twitter", tVal)
  localStorage.setItem("website", wVal)
  localStorage.setItem("bio", bVal)
})

function init() {
  if (!window.AudioContext) {
    if (!window.webkitAudioContext) {
      showMsg(
        "Your browser does not support any AudioContext and cannot play back this audio."
      )
      return
    }
    window.AudioContext = window.webkitAudioContext
  }

  context = new AudioContext()
  streamInit()
}

function streamInit() {
  if (detectPC()) {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL

    const constraints = {
      video: {
        width: { min: 640, ideal: 1280, max: 4096 },
        height: { min: 480, ideal: 720, max: 2160 },
        frameRate: {
          ideal: 45,
          min: 15,
        },
        aspectRatio: 1.777777778,
      },
      audio: {
        echoCancellation: false,
        mozNoiseSuppression: false,
        mozAutoGainControl: false,
      },
    }
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotStream)
      .catch((e) => {
        console.error("Failed to get media: " + e)
      })
  }
}

function gotStream(stream) {
  gainNode = context.createGain()
  gainNode.gain.value = 1

  compressor = context.createDynamicsCompressor()
  compressor.threshold.value = -50
  compressor.knee.value = 40
  compressor.ratio.value = 12
  compressor.reduction.value = -20
  compressor.attack.value = 0
  compressor.release.value = 0.25
  compressor.connect(gainNode)

  filter = context.createBiquadFilter()
  filter.Q.value = 8.3
  filter.frequency.value = 355
  filter.gain.value = 3.0
  filter.type = "bandpass"
  filter.connect(compressor)

  gainNode.connect(context.destination)
  compressor.connect(context.destination)
  filter.connect(context.destination)

  mediaStreamSource = context.createMediaStreamSource(stream)
  audioPreprocessNode = context.createScriptProcessor(1024, 1, 1)
  mediaStreamSource.connect(audioPreprocessNode)
  audioPreprocessNode.connect(context.destination)

  FPS = stream.getVideoTracks()[0].getSettings().frameRate
  blobArray.push(new Blob([new Uint8Array(stream)], { type: "video/mp4" }))
  streamCam(stream)
}

function socketInit() {
  socket.on("connect", () => {
    socket.sendBuffer = []
  })

  socket.on("reconnect", () => {
    socket.sendBuffer = []
  })

  socket.on("online", (data) => {
    onlineCount.innerText = toComma(data)
  })

  socket.on("values", (data) => {
    naira = data.naira
  })

  socket.on("camera", async (data) => {
    if (flagUTC[0] === null || streamerDoc === null) {
      await camStream(data.data, data.isBack, data.platform)
    } else if (flagUTC[0] !== streamerDoc.utc) {
      await camStream(data.data, data.isBack, data.platform)
    } else {
      live.getContext("2d").clearRect(0, 0, live.width, live.height)
    }
  })

  socket.on("audio", async (data) => {
    if (!isMute) {
      if (flagUTC[0] === null || streamerDoc === null) {
        await audioStream(data.data)
      } else if (flagUTC[0] !== streamerDoc.utc) {
        await audioStream(data.data)
      }
    }
  })

  socket.on("claps", async (data) => {
    if (data.userId === socket.id) {
      clapsBtn.src = "./assets/icons/clap_se.png"
    }
    clapsCount.innerText = await toFixed(data.claps)
  })

  socket.on("prompt", async (data) => {
    promptContainer.style = "display: flex"
    if (data === 0) {
      promptCount.innerText = "Now"
      promptCount.style = "color: var(--accent-color)"
    } else {
      promptCount.innerText = await toFixed(data)
    }
  })

  socket.on("note", (note) => {
    if (note !== null || note !== undefined) {
      ad.innerText = note.content

      ad.addEventListener("click", (e) => {
        setProfile(
          note.image,
          note.userName,
          note.location,
          note.bio,
          note.facebook,
          note.instagram,
          note.twitter,
          note.website
        )
        loadModal("popup_profile")
      })
    }
  })

  noteBtn.addEventListener("click", (e) => {
    e.preventDefault()
    loadModal("popup_note")
  })

  noteField.addEventListener("keyup", () => {
    noteCount.innerText = `${noteField.value.length}/127`
  })

  dropBtn.addEventListener("click", (e) => {
    e.preventDefault()
    let note = noteField.value

    if (note === "") {
      showMsg("A field might be empty")
    } else {
      const doc = {
        utc: new Date().toUTCString(),
        token: generateUUID(),
        userName: userName,
        image: pos - 1,
        location: locate,
        bio: bio,
        facebook: facebook,
        instagram: instagram,
        twitter: twitter,
        website: website,
        content: note,
      }

      socket.emit("note", doc)
      clearModal()
    }
  })

  socket.on("comment", (data) => {
    let li = document.createElement("li")
    let last = chatList.children[chatList.children.length - 1]

    addChat(data, li)
    chatList.scrollTop = chatList.scrollHeight
  })

  function addChat(data, li) {
    if (data.comment !== null) {
      li.innerHTML = `<div class="chat_item">
      <img src="./assets/icons/mood_${
        data.image + 1
      }.png" class="li_profile" id="li_profile">
        <div class="content_container">
            <label class="username">${data.userName}</label>
            <label class="date">${data.utc}</label>
            <label class="content">${data.comment}</label>
            <div style="display: none"> 
              <label class="content">${data.data.location}</label>
              <label class="content">${data.data.bio}</label>
              <label class="content">${data.data.facebook}</label>
              <label class="content">${data.data.instagram}</label>
              <label class="content">${data.data.twitter}</label>
              <label class="content">${data.data.website}</label>
            </div>
            <hr class="item_divider">
        </div>
        </div>`

      chatList.appendChild(li)
    }
  }

  chatList.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName == "IMG") {
      const src = e.target.parentNode.children[0].getAttribute("src")
      const item = src.split("_")
      let image = item[1].split(".")[0]

      const userName = e.target.parentNode.children[1].children[0].innerText
      const location =
        e.target.parentNode.children[1].children[3].children[0].innerText
      const bio =
        e.target.parentNode.children[1].children[3].children[1].innerText
      const facebook =
        e.target.parentNode.children[1].children[3].children[2].innerText
      const instagram =
        e.target.parentNode.children[1].children[3].children[3].innerText
      const twitter =
        e.target.parentNode.children[1].children[3].children[4].innerText
      const website =
        e.target.parentNode.children[1].children[3].children[5].innerText

      setProfile(
        --image,
        userName,
        location,
        bio,
        facebook,
        instagram,
        twitter,
        website
      )

      loadModal("popup_profile")
    }
  })

  streamer.addEventListener("click", (e) => {
    if (streamerDoc !== null && streamerDoc !== undefined) {
      setProfile(
        streamerDoc.image,
        streamerDoc.userName,
        streamerDoc.location,
        streamerDoc.bio,
        streamerDoc.facebook,
        streamerDoc.instagram,
        streamerDoc.twitter,
        streamerDoc.website
      )
    }
  })

  flagBtn.addEventListener("click", (e) => {
    if (streamerDoc !== null) {
      flagUTC[0] = streamerDoc.utc
      socket.emit("flag", socket.id)
      localStorage.setItem("flagUTC", streamerDoc.utc)
      live.getContext("2d").clearRect(0, 0, live.width, live.height)
    }
  })

  function setProfile(img, userName, location, bio, face, insta, twit, web) {
    profileImg.src = `./assets/icons/mood_${++img}.png`
    profileName.innerText = userName
    profileLocation.innerText = location
    profileBio.innerText = bio
    profileFace.href = `https://web.facebook.com/${face}`
    profileInsta.href = `https://www.instagram.com/${insta}`
    profileTwit.href = `https://twitter.com/${twit}`

    if (web.startsWith("http")) {
      profileWeb.href = web
    } else {
      profileWeb.href = `http://${web}`
    }
  }

  sendBtn.addEventListener("click", (e) => {
    e.preventDefault()
    if (img !== 0 && img != null && img != undefined) {
      if (chatField.value !== null && chatField.value !== "") {
        const doc = {
          socketId: socket.id,
          userName: userName,
          image: pos - 1,
          utc: new Date().toUTCString(),
          comment: chatField.value,
          platform: "web",
          data: {
            userName: userName,
            image: pos - 1,
            location: locate,
            bio: bio,
            facebook: facebook,
            instagram: instagram,
            twitter: twitter,
            website: website,
          },
        }

        socket.emit("comment", doc)
        chatField.value = null
      }
    } else {
      showMsg("Set up a profile first")
    }
  })

  chatField.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
      e.preventDefault()
      sendBtn.click()
    }
  })

  clapsBtn.addEventListener("click", (e) => {
    e.preventDefault()
    if (streamerDoc !== null && streamerDoc !== undefined) {
      socket.emit("claps", socket.id)
      clapsBtn.src = "./assets/icons/clap_se.png"
    }
  })

  selectDiv.addEventListener("click", (e) => {
    e.preventDefault()
    clearSelected()
    const targetElement = e.target || e.srcElement
    if (targetElement.nodeName !== "DIV") {
      selected = targetElement.innerText.split(" ")[0]
      targetElement.parentNode.style =
        "background-color: rgba(255, 255, 255, 0.26);"
    }
  })

  goLive.addEventListener("click", (e) => {
    e.preventDefault()
    if (img > 0 && img != null && img != undefined) {
      if (goLive.innerText === "Go Live") {
        if (!enabled) {
          showMsg("Ooops, Streaming from the web will be activated shortly")
          return
        }

        if (tagField.value !== null && tagField.value !== "") {
          if (
            audioPreprocessNode === undefined ||
            audioPreprocessNode === null
          ) {
            showMsg("Accept camera and audio permissions")
            return
          }

          if (selected == null) {
            showMsg("Select stream time")
            return
          }

          if (selected === "5") {
            const token = generateUUID()
            sendStream(tagField.value, selected, token)
          }
          if (selected === "10" && opt1 == null) {
            optVal.innerText = "$2.99"
            pVal = 3 * parseInt(naira)
            loadModal("popup_opt")
            return
          } else {
            socket.emit("check", {
              token: opt1,
              selected: selected,
            })
          }
          if (selected === "20" && opt2 == null) {
            optVal.innerText = "$4.99"
            pVal = 5 * parseInt(naira)
            loadModal("popup_opt")
            return
          } else {
            socket.emit("check", {
              token: opt2,
              selected: selected,
            })
          }
          if (selected === "30" && opt3 == null) {
            optVal.innerText = "$6.99"
            pVal = 7 * parseInt(naira)
            loadModal("popup_opt")
            return
          } else {
            socket.emit("check", {
              token: opt3,
              selected: selected,
            })
          }
        } else {
          showMsg("Enter a tag")
        }
      } else {
        socket.emit("end", socket.id)
        goLive.innerText = "Go Live"
        goLive.style = "background-color: var(--secondary-color);"
        tagField.value = null
        tagField.disabled = false
        cam.style = "display: none"
        clearInterval(parser)
        promptContainer.style = "display: none"
        noteBtn.style = "opacity: .4"
        noteBtn.style.pointerEvents = "none"
        isCam = false
        live.getContext("2d").clearRect(0, 0, live.width, live.height)
        clearSelected()
        clearOpts(selected)
        noStream.style = "opacity: 0.2"
        if (audioPreprocessNode !== undefined && audioPreprocessNode != null) {
          audioPreprocessNode.removeEventListener("audioprocess", packetStream)
        }
      }
    } else {
      showMsg("Set up a profile first")
    }
  })

  socket.on("check", async (data) => {
    if (data.exists) {
      sendStream(tagField.value, data.selected, data.token)
    }
  })

  popContinueBtn.addEventListener("click", (e) => {
    e.preventDefault()
    if (popEmailField.value !== null && popEmailField.value !== "") {
      if (optVal.innerText != null && optVal.innerText != undefined) {
        pay(popEmailField.value, pVal.toString(), selected)
      }
    } else {
      showMsg("Enter a valid email")
      return
    }
  })

  function pay(email, amt, store) {
    const handler = PaystackPop.setup({
      key: payHash(),
      email: email,
      amount: `${amt}00`,
      callback: (response) => {
        if (response.status == "success") {
          const token = generateUUID()
          if (store === "10") {
            localStorage.setItem("opt1", token)
            opt1 = token
            const items = selectDiv.children
            items[1].children[0].children[1].src = `./assets/icons/unlock.png`
          } else if (store === "20") {
            localStorage.setItem("opt2", token)
            opt2 = token
            const items = selectDiv.children
            items[2].children[0].children[1].src = `./assets/icons/unlock.png`
          } else if (store === "30") {
            localStorage.setItem("opt3", token)
            opt3 = token
            const items = selectDiv.children
            items[3].children[0].children[1].src = `./assets/icons/unlock.png`
          }

          socket.emit("store", {
            userId: socket.id,
            token: token,
            utc: new Date().toUTCString(),
          })
          pVal = 0
          clearModal()
        } else {
          showMsg(`Something went wrong try again`)
        }
      },
      onClose: function () {
        showMsg("Transaction cancelled")
      },
    })
    handler.openIframe()
  }

  function sendStream(tag, time, token) {
    const doc = {
      userId: socket.id,
      userName: userName,
      image: pos - 1,
      utc: new Date().toUTCString(),
      location: locate,
      bio: bio,
      facebook: facebook,
      instagram: instagram,
      twitter: twitter,
      website: website,
      tag: tag,
      selected: time,
      token: token,
    }

    socket.emit("stream", doc)
  }

  tagField.addEventListener("keyup", (e) => {
    if (e.keyCode === 13) {
      e.preventDefault()
      goLive.click()
    }
  })

  socket.on("stream", (data) => {
    if (data.state === 0) {
      showMsg("Queue is full")
    } else if (data.state === 1) {
      showMsg("Added to Queue")
    } else if (data.state === 2) {
      noStream.style = "opacity: 0"
      goLive.style = "background-color: var(--accent-color);"
      goLive.innerText = "End"
      tag.innerText = `#${tagField.value}`
      tagField.disabled = true
      streamerDoc = data
      viewBtn.src = `./assets/icons/mood_${streamerDoc.image + 1}.png`
      cam.style = "display: block"
      noteBtn.style = "opacity: 1"
      noteBtn.style.pointerEvents = "auto"
      setInterval(parserFunc, parserFPS)
      isCam = true

      if (audioPreprocessNode !== undefined && audioPreprocessNode != null) {
        audioPreprocessNode.addEventListener("audioprocess", packetStream)
      }

      clearOpts(data.selected)
    } else {
      viewBtn.src = `./assets/icons/circle.png`
      goLive.style = "background-color: var(--secondary-color);"
      goLive.innerText = "Go Live"
      tagField.value = null
      tagField.disabled = false
      streamerDoc = null
      cam.style = "display: none"
      noteBtn.style = "opacity: .4"
      noteBtn.style.pointerEvents = "none"
      clearInterval(parser)
      promptContainer.style = "display: none"
      live.getContext("2d").clearRect(0, 0, live.width, live.height)
      isCam = false
      clearSelected()
      noStream.style = "opacity: 0.2"

      if (audioPreprocessNode !== undefined && audioPreprocessNode != null) {
        audioPreprocessNode.removeEventListener("audioprocess", packetStream)
      }
    }
  })
}

function clearOpts(option) {
  const items = selectDiv.children
  if (option === "10") {
    opt1 = null
    localStorage.removeItem("opt1")
    items[1].children[0].children[1].src = `./assets/icons/lock.png`
    return
  }

  if (option === "20") {
    opt2 = null
    localStorage.removeItem("opt2")
    items[2].children[0].children[1].src = `./assets/icons/lock.png`
    return
  }

  if (option === "30") {
    opt3 = null
    localStorage.removeItem("opt3")
    items[3].children[0].children[1].src = `./assets/icons/lock.png`
    return
  }
}

socket.on("timer", (data) => {
  let minutes = parseInt(data / 60, 10)
  let seconds = parseInt(data % 60, 10)

  minutes = minutes < 10 ? "0" + minutes : minutes
  seconds = seconds < 10 ? "0" + seconds : seconds

  timer.innerText = `${minutes}:${seconds}`
})

socket.on("live", (data) => {
  if (data.isLive !== false) {
    noStream.style = "opacity: 0"
    streamerDoc = data
    tag.innerText = `#${data.tag}`
    viewBtn.src = `./assets/icons/mood_${streamerDoc.image + 1}.png`
    isLive = true
  } else {
    streamerDoc = null
    isLive = false
    viewBtn.src = `./assets/icons/circle.png`
    live.getContext("2d").clearRect(0, 0, live.width, live.height)
    clearSelected()
    noStream.style = "opacity: 0.2"
  }
})

function clearSelected() {
  selected = null
  const items = selectDiv.children
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items[i].children.length; j++) {
      items[i].children[j].style = "background-color: transparent;"
    }
  }
}

async function camStream(buffer, isBack, platform) {
  if (live.getContext) {
    let blob = new Blob([buffer], { type: "image/png" })
    let url = URL.createObjectURL(blob)
    let img = new Image()
    let ctx = live.getContext("2d")
    img.src = url

    let x = live.width / 2
    let y = live.height / 2
    img.onload = () => {
      if (isBack) {
        drawRotated(ctx, img, x, y, 0.65, 29.85, isBack, platform)
      } else {
        drawRotated(ctx, img, x, y, 0.65, -29.85, isBack, platform)
      }

      URL.revokeObjectURL(url)
    }
  }
}

function drawRotated(ctx, img, x, y, scale, rot, isBack, platform) {
  ctx.setTransform(scale, 0, 0, scale, x, y)
  if (platform !== "web") {
    ctx.rotate(rot)
  }
  if (isBack) {
    ctx.scale(-1, -1)
  } else {
    ctx.scale(-1, 1)
  }
  if (isLive) ctx.drawImage(img, -img.width / 2, -img.height / 2)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function streamCam(stream) {
  cam.srcObject = stream
  cam.onloadedmetadata = (e) => {
    cam.play()
    cam.muted = true

    camLayer.width = cam.videoWidth
    camLayer.height = cam.videoHeight
  }

  parser = setInterval(parserFunc, parserFPS)
}

function parserFunc() {
  if (isCam) {
    const doc = {
      data: pushFrame(),
      isBack: false,
      rotation: 360,
      platform: "web",
    }
    socket.emit("camera", doc)
  }
}

const pushFrame = () => {
  const quality = 0.5
  const ctx = camLayer.getContext("2d")
  ctx.drawImage(cam, 0, 0)
  let data = camLayer.toDataURL("image/jpeg", quality)
  return validb64(data)
}

function validb64(base64) {
  let startIndex = base64.indexOf("base64,") + 7
  return base64.substr(startIndex)
}

function convertDataURIToBinary(dataURI) {
  const BASE64_MARKER = ";base64,"
  let base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length
  let raw = window.atob(dataURI.substring(base64Index))
  let rawLength = raw.length
  let array = new Uint8Array(new ArrayBuffer(rawLength))

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i)
  }
  return array.buffer
}

function btoArr(base64) {
  let startIndex = base64.indexOf("base64,") + 7
  let b64 = base64.substr(startIndex)
  let byteCharacters = atob(b64)
  let byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  let byteArray = new Uint8Array(byteNumbers)
  return byteArray.buffer
}

const packetStream = async (e) => {
  if (isMute) {
    let input = await e.inputBuffer.getChannelData(0)
    let buffer = new ArrayBuffer(input.length * 2)
    let output = new DataView(buffer)
    for (let i = 0, offset = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }

    const obj = {
      data: buffer,
      platform: "web",
    }

    socket.emit("audio", obj)
  }
}

async function audioStream(byteArray) {
  const wavBytes = await getWavBytes(byteArray, {
    isFloat: false,
    numChannels: 1,
    sampleRate: 44100,
  })
  context.decodeAudioData(wavBytes.buffer, play)
}

function play(audioBuffer) {
  context.resume().then(() => {
    const source = context.createBufferSource()
    source.buffer = audioBuffer
    source.connect(context.destination)
    source.start(0)
  })
}

muteBtn.addEventListener("click", (e) => {
  e.preventDefault()
  const targetElement = e.target || e.srcElement
  const src = targetElement.getAttribute("src")
  const item = src.split("icons/")
  const val = item[1].split(".")[0]

  if (val === "mic") {
    if (context.state !== "running") {
      context.resume()
    }

    isMute = false
    muteBtn.src = "./assets/icons/mic_block.png"
  } else {
    isMute = true
    muteBtn.src = "./assets/icons/mic.png"
  }
})

mail_btn.addEventListener("click", (e) => {
  e.preventDefault()
  var textArea = document.createElement("textarea")
  textArea.value = mail_btn.textContent
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand("Copy")
  textArea.remove()
})

play_btn.addEventListener("click", (e) => {
  playFunc(e)
})

play_btn2.addEventListener("click", (e) => {
  playFunc(e)
})

ios_btn.addEventListener("click", (e) => {
  e.preventDefault()
  iosFunc(e)
})

ios_btn2.addEventListener("click", (e) => {
  e.preventDefault()
  iosFunc(e)
})

function playFunc(e) {
  e.preventDefault()
  const url = "https://play.google.com/store/apps/details?id=me.vebbo.android"
  const win = window.open(url, "_blank")

  if (win) {
    win.focus()
  }
}

function iosFunc(e) {
  showMsg("Not yet available")
}

function showMsg(msg) {
  popMsg.innerText = msg
  loadModal("popup_msg")
}
