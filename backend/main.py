from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from PIL import Image
import io

from module.encryption_module import HybridEncryptor
from module.bitshuffle_module import shuffle_bits, unshuffle_bits
from module.steg_module import encode_image, decode_image


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

enc = HybridEncryptor()


@app.post("/encode")
async def encode(file: UploadFile = File(...), message: str = Form(...)):

    try:

        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        image = Image.open(io.BytesIO(contents)).convert("RGB")

        encrypted = enc.encrypt(message)

        shuffled = shuffle_bits(encrypted)

        shuffled_bytes = bytes(unshuffle_bits(shuffled))

        stego = encode_image(image, shuffled_bytes)

        buffer = io.BytesIO()

        stego.save(buffer, format="PNG")

        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=stego.png"}
        )

    except Exception as e:

        print("ENCODE ERROR:", e)

        raise HTTPException(status_code=500, detail=str(e))


@app.post("/decode")
async def decode(file: UploadFile = File(...)):

    try:

        contents = await file.read()

        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        image = Image.open(io.BytesIO(contents)).convert("RGB")

        data = decode_image(image)

        message = enc.decrypt(data)

        # PRINT MESSAGE IN TERMINAL
        print("\n==============================")
        print(" DECRYPTED MESSAGE:")
        print(message)
        print("==============================\n")

        return {"message": message}

    except Exception as e:

        print("DECODE ERROR:", e)

        raise HTTPException(status_code=400, detail=str(e))