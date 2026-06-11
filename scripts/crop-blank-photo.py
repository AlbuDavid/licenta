"""
Crops a blank product photo to just the product surface (removing background).

Usage:
  python scripts/crop-blank-photo.py <source_image> <output_filename>

Example:
  python scripts/crop-blank-photo.py ~/Desktop/slate-square.jpg blank-slate-square.jpg

Output is saved to public/uploads/products/<output_filename>.
The script auto-detects the dark slate region by thresholding.
"""

import sys
import os
from PIL import Image
import numpy as np

def find_slate_bounds(img: Image.Image, dark_threshold: int = 80) -> tuple[int, int, int, int]:
    """
    Finds the bounding box of the dark slate region by looking for pixels
    darker than dark_threshold in all three RGB channels.
    Returns (left, upper, right, lower) in pixels.
    """
    arr = np.array(img.convert("RGB"))
    # Mask: pixel is "slate" if all channels are below threshold
    mask = (arr[:, :, 0] < dark_threshold) & \
           (arr[:, :, 1] < dark_threshold) & \
           (arr[:, :, 2] < dark_threshold)

    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    return int(cmin), int(rmin), int(cmax), int(rmax)


def square_crop(img: Image.Image, left: int, upper: int, right: int, lower: int) -> Image.Image:
    """
    Square-crops the region, centered, with a small inset margin (2%) to avoid edge artifacts.
    """
    w = right - left
    h = lower - upper
    side = min(w, h)
    # 1% inset on each side for a clean edge
    inset = int(side * 0.01)
    side -= inset * 2

    cx = left + w // 2
    cy = upper + h // 2

    crop_left  = cx - side // 2
    crop_upper = cy - side // 2
    crop_right  = crop_left + side
    crop_lower  = crop_upper + side

    return img.crop((crop_left, crop_upper, crop_right, crop_lower))


def main():
    if len(sys.argv) < 3:
        print("Usage: python crop-blank-photo.py <source_image> <output_filename>")
        sys.exit(1)

    src_path = sys.argv[1]
    out_name = sys.argv[2]

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    out_dir = os.path.join(project_root, "public", "uploads", "products")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, out_name)

    img = Image.open(src_path)
    print(f"Source size: {img.size}")

    left, upper, right, lower = find_slate_bounds(img)
    print(f"Detected slate bounds: left={left} upper={upper} right={right} lower={lower}")
    print(f"Slate region: {right - left}×{lower - upper} px")

    cropped = square_crop(img, left, upper, right, lower)
    print(f"Cropped (square): {cropped.size}")

    cropped.save(out_path, "JPEG", quality=92, optimize=True)
    print(f"Saved → {out_path}")
    print(f"blankPhotoUrl = /uploads/products/{out_name}")


if __name__ == "__main__":
    main()
