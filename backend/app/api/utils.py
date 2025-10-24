def detect_image_ext_by_magic(data: bytes) -> str | None:
    # JPEG: FF D8 FF
    if len(data) >= 3 and data[0:3] == b"\xff\xd8\xff":
        return "jpg"
    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if len(data) >= 8 and data[0:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    # WEBP: RIFF....WEBP
    if len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None
