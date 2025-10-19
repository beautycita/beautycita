#!/usr/bin/env python3
"""
BeautyCita Feature Graphic Generator
Creates a 1024x500px PNG for Google Play Store
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create image
width = 1024
height = 500
img = Image.new('RGB', (width, height), color='white')
draw = ImageDraw.Draw(img)

# Create gradient background (pink to purple)
for y in range(height):
    # Interpolate between pink and purple
    r = int(236 - (236 - 147) * y / height)  # 236 to 147
    g = int(72 - (72 - 51) * y / height)     # 72 to 51
    b = int(153 + (234 - 153) * y / height)  # 153 to 234
    draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))

# Try to load fonts, fallback to default if not available
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
    subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
    feature_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
except:
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()
    feature_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# White text color
text_color = (255, 255, 255)

# Title
draw.text((50, 40), "BeautyCita", fill=text_color, font=title_font)

# Subtitle
draw.text((50, 130), "Tu Plataforma de Belleza", fill=text_color, font=subtitle_font)

# Feature list
features = [
    "✨ Asistente IA Aphrodite - Chat inteligente 24/7",
    "🔍 Búsqueda de Estilistas Verificados",
    "📱 Videoconsultas Integradas",
    "💳 Pagos Seguros: Tarjeta y Bitcoin",
    "📅 Reservas en Tiempo Real",
    "⭐ Reseñas y Calificaciones Verificadas",
    "🔒 100% Seguro - Encriptado TLS",
    "📍 Búsqueda por Ubicación GPS"
]

y_position = 200
for i, feature in enumerate(features):
    # Split into two columns
    if i < 4:
        x_pos = 50
        y_pos = 200 + (i * 70)
    else:
        x_pos = 540
        y_pos = 200 + ((i - 4) * 70)

    draw.text((x_pos, y_pos), feature, fill=text_color, font=small_font)

# Footer text
draw.text((50, 460), "Disponible en Google Play", fill=text_color, font=small_font)

# Save the image
output_path = "/var/www/beautycita.com/frontend/beautycita-feature-graphic.png"
img.save(output_path, "PNG", optimize=True)
print(f"Feature graphic created: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.2f} KB")
