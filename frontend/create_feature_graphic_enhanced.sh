#!/bin/bash
# BeautyCita Enhanced Feature Graphic Generator
# Creates a 1024x500px PNG for Google Play Store with better design

OUTPUT="/var/www/beautycita.com/frontend/beautycita-feature-graphic-enhanced.png"

# Create gradient background (pink to purple) with rounded corners effect
convert -size 1024x500 gradient:'#ec4899-#9333ea' \
  \( +clone -fill white -colorize 100% \
     -draw 'fill black polygon 0,0 0,50 50,0' \
     -draw 'fill black polygon 1024,0 974,0 1024,50' \
     -draw 'fill black polygon 0,500 0,450 50,500' \
     -draw 'fill black polygon 1024,500 1024,450 974,500' \
     -blur 0x10 \) \
  -alpha off -compose CopyOpacity -composite \
  \( -size 1024x500 xc:none \
     -font DejaVu-Sans-Bold -pointsize 80 -fill white -stroke '#9333ea' -strokewidth 3 \
     -gravity NorthWest -annotate +40+30 'BeautyCita' \
  \) -composite \
  \( -size 1024x500 xc:none \
     -font DejaVu-Sans-Bold -pointsize 36 -fill white \
     -gravity NorthWest -annotate +40+125 'Tu Plataforma de Belleza' \
  \) -composite \
  \( -size 1024x500 xc:none \
     -font DejaVu-Sans -pointsize 24 -fill white \
     -gravity NorthWest \
     -annotate +40+190 '✨ Asistente IA Aphrodite - Chat inteligente 24/7' \
     -annotate +40+230 '🔍 Búsqueda de Estilistas Verificados y Certificados' \
     -annotate +40+270 '📱 Videoconsultas Integradas en Tiempo Real' \
     -annotate +40+310 '💳 Pagos Seguros: Tarjeta, Bitcoin y más' \
     -annotate +40+350 '📅 Sistema de Reservas en Tiempo Real' \
     -annotate +40+390 '⭐ Reseñas y Calificaciones Auténticas' \
  \) -composite \
  \( -size 1024x500 xc:none \
     -font DejaVu-Sans -pointsize 24 -fill white \
     -gravity NorthWest \
     -annotate +540+190 '🔒 100% Seguro - Encriptación TLS' \
     -annotate +540+230 '📍 Búsqueda por Ubicación GPS' \
     -annotate +540+270 '🌐 Disponible en Español e Inglés' \
     -annotate +540+310 '💼 Panel Profesional para Estilistas' \
     -annotate +540+350 '📊 Análisis y Estadísticas en Tiempo Real' \
     -annotate +540+390 '🎨 Portafolio Digital para tu Trabajo' \
  \) -composite \
  \( -size 1024x500 xc:none \
     -font DejaVu-Sans-Bold -pointsize 22 -fill white \
     -gravity SouthWest -annotate +40+20 'Disponible ahora en Google Play Store' \
  \) -composite \
  "$OUTPUT"

echo "Enhanced feature graphic created: $OUTPUT"
ls -lh "$OUTPUT"
