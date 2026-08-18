import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { dedup, draco, resample } from "@gltf-transform/functions"
import draco3d from "draco3dgltf"
import { copyFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const INPUT = fileURLToPath(new URL("../public/models/lab.glb", import.meta.url))
const OUTPUT = fileURLToPath(new URL("../public/models/lab.glb", import.meta.url))
const BACKUP = fileURLToPath(new URL("../public/models/lab.v19.bak.glb", import.meta.url))

const MAX_POSTER = 1024
const MAX_DEFAULT = 512

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  })

copyFileSync(INPUT, BACKUP)
const document = await io.read(INPUT)
const root = document.getRoot()

const usage = new Map()
function mark(texture, kind) {
  if (!texture) return
  const current = usage.get(texture) || { color: false, normal: false, data: false, poster: false }
  current[kind] = true
  usage.set(texture, current)
}

for (const material of root.listMaterials()) {
  const poster = /^Mat_poster/i.test(material.getName() || "")
  mark(material.getBaseColorTexture(), poster ? "poster" : "color")
  mark(material.getEmissiveTexture(), "color")
  mark(material.getNormalTexture(), "normal")
  mark(material.getMetallicRoughnessTexture(), "data")
  mark(material.getOcclusionTexture(), "data")
}

let ok = 0
let skipped = 0
let saved = 0

for (const texture of root.listTextures()) {
  const image = texture.getImage()
  const name = texture.getName() || texture.getURI() || "?"
  if (!image || image.byteLength < 32) {
    skipped += 1
    continue
  }

  const flags = usage.get(texture) || { color: false, normal: false, data: false, poster: false }
  const isNormal = flags.normal && !flags.color && !flags.poster
  const isData = flags.data && !flags.color && !flags.poster && !flags.normal
  const maxEdge = flags.poster ? MAX_POSTER : MAX_DEFAULT

  try {
    const meta = await sharp(image, { failOn: "none", unlimited: true }).metadata()
    const width = meta.width || 0
    const height = meta.height || 0
    let pipeline = sharp(image, { failOn: "none", unlimited: true }).rotate()
    if (!isNormal && !isData) pipeline = pipeline.toColorspace("srgb")
    if (Math.max(width, height) > maxEdge) {
      pipeline = pipeline.resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    }

    const quality = isNormal ? 72 : isData ? 62 : flags.poster ? 70 : 56
    const out = await pipeline.webp({ quality, alphaQuality: quality, effort: 4 }).toBuffer()
    if (out.byteLength > 0 && out.byteLength < image.byteLength * 0.98) {
      texture.setImage(out)
      texture.setMimeType("image/webp")
      saved += image.byteLength - out.byteLength
      ok += 1
    } else if (Math.max(width, height) > maxEdge) {
      texture.setImage(out)
      texture.setMimeType("image/webp")
      saved += image.byteLength - out.byteLength
      ok += 1
    } else {
      skipped += 1
    }
  } catch (error) {
    skipped += 1
    console.log("skip", name, error instanceof Error ? error.message : error)
  }
}

console.log("resized", ok, "skipped", skipped, "saved_mb", (saved / 1e6).toFixed(2))

await document.transform(dedup(), resample(), draco())
const bytes = await io.writeBinary(document)
writeFileSync(OUTPUT, bytes)
console.log("wrote", OUTPUT, (bytes.byteLength / 1e6).toFixed(2), "MB")
