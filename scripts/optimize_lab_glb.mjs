import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { dedup, draco, prune, resample } from "@gltf-transform/functions"
import draco3d from "draco3dgltf"
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const INPUT = fileURLToPath(new URL("../public/models/lab.glb", import.meta.url))
const OUTPUT = fileURLToPath(new URL("../public/models/lab.opt.glb", import.meta.url))
const MAX = 1024

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  })

const document = await io.read(INPUT)
const textures = document.getRoot().listTextures()
console.log("textures", textures.length)

let ok = 0
let skipped = 0
let saved = 0

for (const texture of textures) {
  const image = texture.getImage()
  const name = texture.getName() || texture.getURI() || "?"
  if (!image || image.byteLength < 32) {
    skipped += 1
    continue
  }
  const before = image.byteLength
  try {
    const meta = await sharp(image, { failOn: "none", unlimited: true }).metadata()
    const width = meta.width || 0
    const height = meta.height || 0
    let pipeline = sharp(image, { failOn: "none", unlimited: true }).rotate().toColorspace("srgb")
    if (Math.max(width, height) > MAX) {
      pipeline = pipeline.resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    }
    const out = await pipeline.webp({ quality: 68, alphaQuality: 68, effort: 4 }).toBuffer()
    if (out.byteLength > 0 && out.byteLength < before) {
      texture.setImage(out)
      texture.setMimeType("image/webp")
      saved += before - out.byteLength
      ok += 1
    } else {
      skipped += 1
    }
  } catch (error) {
    skipped += 1
    console.log("skip", name, error instanceof Error ? error.message : error)
  }
}

console.log("webp ok", ok, "skipped", skipped, "saved_mb", (saved / 1e6).toFixed(2))

await document.transform(dedup(), resample(), prune(), draco())
const bytes = await io.writeBinary(document)
writeFileSync(OUTPUT, bytes)
console.log("wrote", OUTPUT, (bytes.byteLength / 1e6).toFixed(2), "MB")
