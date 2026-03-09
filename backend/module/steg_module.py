from PIL import Image
import numpy as np
import struct


def encode_image(image: Image.Image, data: bytes):

    length = len(data)

    payload = struct.pack(">I", length) + data

    bits = []

    for byte in payload:
        for i in range(8):
            bits.append((byte >> (7 - i)) & 1)

    pixels = np.array(image)

    flat = pixels.flatten()

    if len(bits) > len(flat):

        raise ValueError("Image too small")

    for i in range(len(bits)):

        flat[i] = (flat[i] & 254) | bits[i]

    new_pixels = flat.reshape(pixels.shape)

    return Image.fromarray(new_pixels.astype("uint8"))


def decode_image(image: Image.Image):

    pixels = np.array(image)

    flat = pixels.flatten()

    bits = []

    for v in flat:

        bits.append(v & 1)

    bytes_out = []

    for i in range(0, len(bits), 8):

        byte = 0

        for j in range(8):

            if i + j < len(bits):

                byte = (byte << 1) | bits[i + j]

        bytes_out.append(byte)

    data = bytes(bytes_out)

    length = struct.unpack(">I", data[:4])[0]

    return data[4:4 + length]