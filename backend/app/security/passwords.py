import hashlib
import hmac
import os


def hash_password(plain: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, 120_000)
    return f"pbkdf2${salt.hex()}${digest.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _, salt_hex, digest_hex = hashed.split("$", 2)
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, 120_000)
    return hmac.compare_digest(digest.hex(), digest_hex)
