import random


SEED = 42


def shuffle_bits(data: bytes):

    bits = []

    for byte in data:
        for i in range(8):
            bits.append((byte >> (7 - i)) & 1)

    indices = list(range(len(bits)))

    random.seed(SEED)
    random.shuffle(indices)

    shuffled = [0] * len(bits)

    for i, idx in enumerate(indices):
        shuffled[idx] = bits[i]

    return shuffled


def unshuffle_bits(bits):

    indices = list(range(len(bits)))

    random.seed(SEED)
    random.shuffle(indices)

    original = [0] * len(bits)

    for i, idx in enumerate(indices):
        original[i] = bits[idx]

    data = bytearray()

    for i in range(0, len(original), 8):

        byte = 0

        for j in range(8):
            if i + j < len(original):
                byte = (byte << 1) | original[i + j]

        data.append(byte)

    return bytes(data)