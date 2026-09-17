"""One-off script: generates a VAPID keypair for Web Push, no external account needed.
Run: python generate_vapid_keys.py
Copy the output into your .env as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.
"""

import base64

from py_vapid import Vapid02


def b64url(raw_bytes):
    return base64.urlsafe_b64encode(raw_bytes).rstrip(b"=").decode()


def main():
    vapid = Vapid02()
    vapid.generate_keys()

    numbers = vapid.public_key.public_numbers()
    raw_public = b"\x04" + numbers.x.to_bytes(32, "big") + numbers.y.to_bytes(32, "big")
    raw_private = vapid.private_key.private_numbers().private_value.to_bytes(32, "big")

    print(f"VAPID_PUBLIC_KEY={b64url(raw_public)}")
    print(f"VAPID_PRIVATE_KEY={b64url(raw_private)}")


if __name__ == "__main__":
    main()
