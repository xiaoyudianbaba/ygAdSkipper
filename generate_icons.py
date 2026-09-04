"""Generate simple icons for YouTube Ad Skipper extension"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a red circle background
    margin = size // 8
    draw.ellipse([margin, margin, size - margin, size - margin], fill='#FF0000')
    
    # Draw a white skip triangle (play button style)
    center_x, center_y = size // 2, size // 2
    triangle_size = size // 4
    points = [
        (center_x - triangle_size // 2, center_y - triangle_size // 2),
        (center_x + triangle_size // 2, center_y),
        (center_x - triangle_size // 2, center_y + triangle_size // 2)
    ]
    draw.polygon(points, fill='white')
    
    # Draw two small rectangles to represent "skip"
    bar_width = size // 16
    bar_height = size // 4
    bar_x = center_x + triangle_size // 2 + size // 16
    bar_y1 = center_y - bar_height // 2
    bar_y2 = center_y - bar_height // 2 + bar_height // 2
    
    draw.rectangle([bar_x, bar_y1, bar_x + bar_width, bar_y1 + bar_height], fill='white')
    draw.rectangle([bar_x + bar_width + size // 32, bar_y1, bar_x + bar_width * 2 + size // 32, bar_y1 + bar_height], fill='white')
    
    img.save(output_path, 'PNG')

# Create icons directory if it doesn't exist
icons_dir = os.path.join(os.path.dirname(__file__), 'extension', 'icons')
os.makedirs(icons_dir, exist_ok=True)

# Generate icons
for size in [16, 48, 128]:
    output_path = os.path.join(icons_dir, f'icon{size}.png')
    create_icon(size, output_path)
    print(f'Created {output_path}')

print('Icons generated successfully!')
