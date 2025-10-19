#!/bin/bash
# BeautyCita Feature Graphic Generator
# Creates a 1024x500px PNG for Google Play Store

OUTPUT="/var/www/beautycita.com/frontend/beautycita-feature-graphic.png"

# Create gradient background (pink to purple)
convert -size 1024x500 gradient:'#ec4899-#9333ea' \
  -gravity NorthWest \
  -font DejaVu-Sans-Bold -pointsize 72 -fill white -annotate +50+40 'BeautyCita' \
  -font DejaVu-Sans -pointsize 32 -fill white -annotate +50+130 'Tu Plataforma de Belleza' \
  -font DejaVu-Sans -pointsize 22 -fill white \
  -annotate +50+200 '✨ Asistente IA Aphrodite' \
  -annotate +50+240 '   Chat inteligente 24/7' \
  -annotate +50+280 '🔍 Estilistas Verificados' \
  -annotate +50+320 '📱 Videoconsultas' \
  -annotate +50+360 '💳 Pagos: Tarjeta y Bitcoin' \
  -annotate +540+200 '📅 Reservas en Tiempo Real' \
  -annotate +540+240 '⭐ Reseñas Verificadas' \
  -annotate +540+280 '🔒 100% Seguro - TLS' \
  -annotate +540+320 '📍 Búsqueda por GPS' \
  -font DejaVu-Sans -pointsize 20 -fill white -annotate +50+460 'Disponible en Google Play' \
  "$OUTPUT"

echo "Feature graphic created: $OUTPUT"
ls -lh "$OUTPUT"
