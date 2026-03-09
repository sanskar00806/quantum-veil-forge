from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Protocol.KDF import scrypt


PASSWORD = "quantumveil"


def derive_key(salt):

    return scrypt(PASSWORD.encode(), salt, 32, N=2**14, r=8, p=1)


class HybridEncryptor:

    def encrypt(self, message: str):

        salt = get_random_bytes(16)

        key = derive_key(salt)

        cipher = AES.new(key, AES.MODE_GCM)

        ciphertext, tag = cipher.encrypt_and_digest(message.encode())

        return salt + cipher.nonce + tag + ciphertext

    def decrypt(self, data: bytes):

        salt = data[:16]
        nonce = data[16:32]
        tag = data[32:48]
        ciphertext = data[48:]

        key = derive_key(salt)

        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)

        return cipher.decrypt_and_verify(ciphertext, tag).decode()