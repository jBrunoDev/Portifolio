const SCREEN_VIDEO = "/video/screem_.mp4?v=5"
const LAB_AUDIO = "/audio/lab-instrumental.mp3"

export function getLabScreenVideo() {
  const existing = document.getElementById("lab-screen-video")
  if (existing instanceof HTMLVideoElement) {
    if (!existing.getAttribute("src")?.includes("screem_")) {
      existing.src = SCREEN_VIDEO
    }
    existing.muted = true
    void existing.play().catch(() => undefined)
    return existing
  }

  const video = document.createElement("video")
  video.id = "lab-screen-video"
  video.muted = true
  video.defaultMuted = true
  video.volume = 0
  video.loop = true
  video.playsInline = true
  video.autoplay = true
  video.preload = "auto"
  video.setAttribute("muted", "")
  video.setAttribute("playsinline", "")
  video.setAttribute("webkit-playsinline", "")
  video.setAttribute("src", SCREEN_VIDEO)
  video.style.cssText =
    "position:fixed;left:-480px;top:0;width:320px;height:180px;opacity:1;pointer-events:none;border:0;"
  document.body.appendChild(video)
  void video.play().catch(() => undefined)
  return video
}

export function getLabAudio() {
  const existing = document.getElementById("lab-instrumental")
  if (existing instanceof HTMLAudioElement) return existing

  const audio = document.createElement("audio")
  audio.id = "lab-instrumental"
  audio.src = LAB_AUDIO
  audio.loop = true
  audio.preload = "none"
  audio.volume = 0.3
  document.body.appendChild(audio)
  return audio
}
