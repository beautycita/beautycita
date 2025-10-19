#!/bin/bash
# BeautyCita Final Feature Graphic Generator
# Creates a professional 1024x500px PNG for Google Play Store

OUTPUT="/var/www/beautycita.com/frontend/beautycita-feature-graphic-final.png"

# Create the base gradient background
convert -size 1024x500 gradient:'#ec4899-#7c3aed' \
  -gravity center \
  "$OUTPUT"

# Add title with shadow effect
convert "$OUTPUT" \
  -font DejaVu-Sans-Bold -pointsize 85 \
  -fill '#00000080' -annotate +52+52 'BeautyCita' \
  -fill white -annotate +50+50 'BeautyCita' \
  "$OUTPUT"

# Add subtitle
convert "$OUTPUT" \
  -font DejaVu-Sans-Bold -pointsize 38 \
  -fill white -annotate +50+140 'Tu Plataforma Completa de Belleza' \
  "$OUTPUT"

# Add feature section header
convert "$OUTPUT" \
  -font DejaVu-Sans-Bold -pointsize 26 \
  -fill white -annotate +50+195 'Características Principales:' \
  "$OUTPUT"

# Left column features
convert "$OUTPUT" \
  -font DejaVu-Sans -pointsize 22 -fill white \
  -annotate +50+235 '✨ Asistente IA Aphrodite' \
  -annotate +50+270 '🔍 Estilistas Verificados' \
  -annotate +50+305 '📱 Videoconsultas HD' \
  -annotate +50+340 '💳 Pagos: Tarjeta y Bitcoin' \
  -annotate +50+375 '📅 Reservas Instantáneas' \
  -annotate +50+410 '⭐ Reseñas Auténticas' \
  "$OUTPUT"

# Right column features
convert "$OUTPUT" \
  -font DejaVu-Sans -pointsize 22 -fill white \
  -annotate +540+235 '🔒 100% Seguro - TLS' \
  -annotate +540+270 '📍 Búsqueda por GPS' \
  -annotate +540+305 '🌐 Español e Inglés' \
  -annotate +540+340 '💼 Panel Profesional' \
  -annotate +540+375 '📊 Análisis en Tiempo Real' \
  -annotate +540+410 '🎨 Portafolio Digital' \
  "$OUTPUT"

# Add footer
convert "$OUTPUT" \
  -font DejaVu-Sans-Bold -pointsize 20 \
  -fill white -annotate +50+465 'Descarga ahora desde Google Play Store' \
  "$OUTPUT"

echo "Final feature graphic created: $OUTPUT"
ls -lh "$OUTPUT"
identify "$OUTPUT"
