#!/usr/bin/env python3
"""
Icon Generator for Family Bookkeeping Flutter App
Creates all required icon sizes for Android and iOS
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_family_bookkeeping_icon(size, filename):
    """Create a family bookkeeping themed icon"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions based on size
    margin = size // 8
    center = size // 2
    
    # Create gradient-like background (simplified)
    for i in range(size):
        for j in range(size):
            # Create a warm gradient from orange to blue
            r = int(255 * (1 - (i + j) / (2 * size)))
            g = int(150 + 105 * (i + j) / (2 * size))
            b = int(100 + 155 * (i + j) / (2 * size))
            img.putpixel((i, j), (r, g, b, 255))
    
    # Draw a book (main element)
    book_width = size // 3
    book_height = size // 2
    book_x = center - book_width // 2
    book_y = center - book_height // 2
    
    # Book cover (blue)
    draw.rectangle([book_x, book_y, book_x + book_width, book_y + book_height], 
                   fill=(30, 144, 255, 255), outline=(0, 0, 139, 255), width=2)
    
    # Book pages (white)
    page_margin = book_width // 8
    draw.rectangle([book_x + page_margin, book_y + page_margin, 
                   book_x + book_width - page_margin, book_y + book_height - page_margin], 
                   fill=(255, 255, 255, 255))
    
    # Checkmark on book
    check_size = book_width // 4
    check_x = book_x + book_width // 2 - check_size // 2
    check_y = book_y + book_height // 2 - check_size // 2
    draw.line([check_x, check_y + check_size//2, 
               check_x + check_size//3, check_y + check_size], 
              fill=(0, 150, 0, 255), width=max(2, size//32))
    draw.line([check_x + check_size//3, check_y + check_size, 
               check_x + check_size, check_y], 
              fill=(0, 150, 0, 255), width=max(2, size//32))
    
    # Family figures (simplified)
    person_size = size // 6
    # Adult figure
    adult_x = book_x - person_size - size//16
    adult_y = book_y + book_height - person_size
    draw.ellipse([adult_x, adult_y, adult_x + person_size, adult_y + person_size], 
                 fill=(100, 149, 237, 255))
    
    # Child figure
    child_size = person_size * 3 // 4
    child_x = adult_x + person_size // 2
    child_y = adult_y + person_size // 4
    draw.ellipse([child_x, child_y, child_x + child_size, child_y + child_size], 
                 fill=(255, 165, 0, 255))
    
    # Dollar sign coin
    coin_size = size // 8
    coin_x = book_x + book_width + size//16
    coin_y = book_y + book_height // 2 - coin_size // 2
    draw.ellipse([coin_x, coin_y, coin_x + coin_size, coin_y + coin_size], 
                 fill=(255, 215, 0, 255), outline=(255, 140, 0, 255), width=2)
    
    # Dollar sign
    try:
        font_size = coin_size // 2
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
        draw.text((coin_x + coin_size//4, coin_y + coin_size//4), "$", 
                 fill=(0, 0, 0, 255), font=font)
    except:
        # Fallback if font not available
        draw.text((coin_x + coin_size//3, coin_y + coin_size//3), "$", 
                 fill=(0, 0, 0, 255))
    
    # Heart accent
    heart_size = size // 12
    heart_x = center - heart_size // 2
    heart_y = book_y - heart_size - size//16
    # Simple heart shape
    draw.ellipse([heart_x, heart_y, heart_x + heart_size//2, heart_y + heart_size//2], 
                 fill=(255, 0, 0, 255))
    draw.ellipse([heart_x + heart_size//2, heart_y, heart_x + heart_size, heart_y + heart_size//2], 
                 fill=(255, 0, 0, 255))
    draw.polygon([heart_x, heart_y + heart_size//4, heart_x + heart_size//2, heart_y + heart_size, 
                  heart_x + heart_size, heart_y + heart_size//4], 
                 fill=(255, 0, 0, 255))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def generate_all_icons():
    """Generate all required icon sizes"""
    
    # Android icons
    android_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    for folder, size in android_sizes.items():
        os.makedirs(f'android/app/src/main/res/{folder}', exist_ok=True)
        create_family_bookkeeping_icon(size, f'android/app/src/main/res/{folder}/ic_launcher.png')
        create_family_bookkeeping_icon(size, f'android/app/src/main/res/{folder}/ic_launcher_round.png')
    
    # iOS icons
    ios_sizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
    
    for size in ios_sizes:
        create_family_bookkeeping_icon(size, f'ios/Runner/Assets.xcassets/AppIcon.appiconset/icon-{size}.png')
    
    # Create Contents.json for iOS
    create_ios_contents_json()
    
    print("\n✅ All icons generated successfully!")
    print("📱 Android icons: android/app/src/main/res/mipmap-*/")
    print("🍎 iOS icons: ios/Runner/Assets.xcassets/AppIcon.appiconset/")

def create_ios_contents_json():
    """Create Contents.json for iOS AppIcon"""
    contents = {
        "images": [
            {"size": "20x20", "idiom": "iphone", "filename": "icon-20.png", "scale": "2x"},
            {"size": "20x20", "idiom": "iphone", "filename": "icon-40.png", "scale": "3x"},
            {"size": "29x29", "idiom": "iphone", "filename": "icon-29.png", "scale": "1x"},
            {"size": "29x29", "idiom": "iphone", "filename": "icon-58.png", "scale": "2x"},
            {"size": "29x29", "idiom": "iphone", "filename": "icon-87.png", "scale": "3x"},
            {"size": "40x40", "idiom": "iphone", "filename": "icon-40.png", "scale": "2x"},
            {"size": "40x40", "idiom": "iphone", "filename": "icon-60.png", "scale": "3x"},
            {"size": "60x60", "idiom": "iphone", "filename": "icon-120.png", "scale": "2x"},
            {"size": "60x60", "idiom": "iphone", "filename": "icon-180.png", "scale": "3x"},
            {"size": "20x20", "idiom": "ipad", "filename": "icon-20.png", "scale": "1x"},
            {"size": "20x20", "idiom": "ipad", "filename": "icon-40.png", "scale": "2x"},
            {"size": "29x29", "idiom": "ipad", "filename": "icon-29.png", "scale": "1x"},
            {"size": "29x29", "idiom": "ipad", "filename": "icon-58.png", "scale": "2x"},
            {"size": "40x40", "idiom": "ipad", "filename": "icon-40.png", "scale": "1x"},
            {"size": "40x40", "idiom": "ipad", "filename": "icon-80.png", "scale": "2x"},
            {"size": "76x76", "idiom": "ipad", "filename": "icon-76.png", "scale": "1x"},
            {"size": "76x76", "idiom": "ipad", "filename": "icon-152.png", "scale": "2x"},
            {"size": "83.5x83.5", "idiom": "ipad", "filename": "icon-167.png", "scale": "2x"},
            {"size": "1024x1024", "idiom": "ios-marketing", "filename": "icon-1024.png", "scale": "1x"}
        ],
        "info": {
            "author": "xcode",
            "version": 1
        }
    }
    
    import json
    with open('ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json', 'w') as f:
        json.dump(contents, f, indent=2)

if __name__ == "__main__":
    try:
        generate_all_icons()
    except ImportError:
        print("❌ PIL (Pillow) not installed. Installing...")
        import subprocess
        subprocess.run(["pip3", "install", "Pillow"])
        print("✅ Pillow installed. Please run the script again.")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Please install Pillow: pip3 install Pillow")
