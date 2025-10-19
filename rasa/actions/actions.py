import logging
import requests
import os
import time
from typing import Any, Text, Dict, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from openai import OpenAI

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.forms import FormValidationAction
from rasa_sdk.types import DomainDict

# Load environment variables
load_dotenv('/var/www/beautycita.com/.env')

logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'beautycita',
    'user': 'postgres',
    'password': 'postgres'
}

RASA_DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'beautycita_rasa',
    'user': 'rasa_user',
    'password': 'secure_rasa_password_2025'
}

# BeautyCita API configuration
API_BASE_URL = 'http://localhost:4000/api'

# OpenAI configuration
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
OPENAI_MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', '500'))
OPENAI_TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', '0.7'))

# Aphrodite personality and context
APHRODITE_SYSTEM_PROMPT = """Eres Aphrodite, la asistente de belleza inteligente de BeautyCita. Tu personalidad es:

🌟 PERSONALIDAD:
- Amigable, cálida y empática
- Experta en belleza y tendencias
- Hablas como una amiga que sabe mucho de belleza
- Usas emojis con moderación (1-2 por mensaje)
- Eres Gen Z pero profesional

💄 EXPERTISE:
- Servicios de BeautyCita: cortes, color, manicura, pedicura, tratamientos faciales, peinados
- Tendencias de belleza actuales
- Consejos personalizados
- Precios desde: Corte $300, Color $500, Manicura $150, Pedicura $180, Faciales $400

📱 CAPACIDADES:
- Ayudar a reservar citas
- Dar consejos de belleza
- Explicar servicios y precios
- Recomendar estilistas
- Resolver dudas sobre cuidado personal

🎯 REGLAS:
- Mantén respuestas concisas (máximo 3 líneas)
- Si no sabes algo específico, di "Déjame consultar con el equipo"
- Siempre ofrece ayuda para agendar cita al final
- Habla en español natural y fluido
- NO inventes precios o servicios que no existen

¿Cómo puedo ayudarte con tu belleza hoy?"""

def get_openai_response(user_message: str, conversation_context: str = "") -> str:
    """Get dynamic response from OpenAI with exponential backoff"""
    max_retries = 3
    base_delay = 1

    for attempt in range(max_retries):
        try:
            response = openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": APHRODITE_SYSTEM_PROMPT},
                    {"role": "assistant", "content": conversation_context},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=OPENAI_MAX_TOKENS,
                temperature=OPENAI_TEMPERATURE,
                timeout=30
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            if attempt < max_retries - 1:
                # Exponential backoff
                delay = base_delay * (2 ** attempt)
                logger.warning(f"OpenAI request failed (attempt {attempt + 1}): {e}. Retrying in {delay}s...")
                time.sleep(delay)
            else:
                logger.error(f"OpenAI request failed after {max_retries} attempts: {e}")
                # Fallback response
                return "¡Hola! Estoy aquí para ayudarte con servicios de belleza. ¿Te gustaría agendar una cita o necesitas información sobre nuestros servicios? 💄"

class ActionCheckAvailability(Action):
    def name(self) -> Text:
        return "action_check_availability"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            # Get slot values
            preferred_date = tracker.get_slot("preferred_date")
            preferred_time = tracker.get_slot("preferred_time")
            service_type = tracker.get_slot("service_type")

            if not preferred_date or not preferred_time:
                dispatcher.utter_message(text="Necesito la fecha y hora para verificar disponibilidad.")
                return []

            # Connect to main database to check availability
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Check for existing bookings at the requested time
                    query = """
                    SELECT COUNT(*) as booking_count
                    FROM bookings
                    WHERE booking_date = %s
                    AND booking_time = %s
                    AND status NOT IN ('cancelled', 'completed')
                    """

                    cur.execute(query, (preferred_date, preferred_time))
                    result = cur.fetchone()

                    # Assume 3 stylists available, so max 3 concurrent bookings
                    if result['booking_count'] < 3:
                        dispatcher.utter_message(text=f"¡Perfecto! Hay disponibilidad el {preferred_date} a las {preferred_time}.")
                        return [{"availability": True}]
                    else:
                        dispatcher.utter_message(text=f"Lo siento, no hay disponibilidad el {preferred_date} a las {preferred_time}. ¿Te gustaría otra opción?")
                        return [{"availability": False}]

        except Exception as e:
            logger.error(f"Error checking availability: {e}")
            dispatcher.utter_message(text="Hubo un problema verificando la disponibilidad. ¿Podrías intentar de nuevo?")
            return []

class ActionBookAppointment(Action):
    def name(self) -> Text:
        return "action_book_appointment"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            # Get all required slot values
            user_name = tracker.get_slot("user_name")
            user_phone = tracker.get_slot("user_phone")
            service_type = tracker.get_slot("service_type")
            preferred_date = tracker.get_slot("preferred_date")
            preferred_time = tracker.get_slot("preferred_time")
            sender_id = tracker.sender_id

            # Validate required fields
            if not all([user_name, user_phone, service_type, preferred_date, preferred_time]):
                dispatcher.utter_message(text="Faltan algunos datos para completar tu reserva.")
                return []

            # Create booking in main database
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # First, get or create user
                    user_query = """
                    INSERT INTO users (name, phone, email, role, created_at)
                    VALUES (%s, %s, %s, 'client', NOW())
                    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                    """
                    cur.execute(user_query, (user_name, user_phone, f"{user_phone}@beautycita.temp"))
                    user_result = cur.fetchone()
                    user_id = user_result['id']

                    # Get service ID based on service type
                    service_query = "SELECT id FROM services WHERE LOWER(name) LIKE %s LIMIT 1"
                    cur.execute(service_query, (f"%{service_type.lower()}%",))
                    service_result = cur.fetchone()

                    if not service_result:
                        dispatcher.utter_message(text="Lo siento, no pude encontrar ese servicio.")
                        return []

                    service_id = service_result['id']

                    # Create the booking
                    booking_query = """
                    INSERT INTO bookings
                    (client_id, service_id, booking_date, booking_time, status, notes, created_at)
                    VALUES (%s, %s, %s, %s, 'confirmed', 'Reserva creada via chat', NOW())
                    RETURNING id
                    """

                    cur.execute(booking_query, (user_id, service_id, preferred_date, preferred_time))
                    booking_result = cur.fetchone()
                    booking_id = booking_result['id']

                    conn.commit()

                    # Update RASA conversation tracking
                    self._update_booking_intent(sender_id, booking_id, service_id, preferred_date, preferred_time)

                    dispatcher.utter_message(
                        text=f"¡Excelente {user_name}! Tu cita para {service_type} ha sido confirmada para el {preferred_date} a las {preferred_time}. "
                             f"Te enviaremos un recordatorio por WhatsApp al {user_phone}. "
                             f"Tu número de reserva es #{booking_id}."
                    )

                    return [{"booking_id": booking_id, "booking_confirmed": True}]

        except Exception as e:
            logger.error(f"Error creating booking: {e}")
            dispatcher.utter_message(text="Hubo un problema creando tu reserva. Por favor intenta de nuevo o contacta a nuestro equipo.")
            return []

    def _update_booking_intent(self, sender_id: str, booking_id: int, service_id: int, preferred_date: str, preferred_time: str):
        """Update booking intent in RASA database"""
        try:
            with psycopg2.connect(**RASA_DB_CONFIG) as conn:
                with conn.cursor() as cur:
                    # Get conversation ID
                    conv_query = "SELECT id FROM conversations WHERE sender_id = %s ORDER BY created_at DESC LIMIT 1"
                    cur.execute(conv_query, (sender_id,))
                    conv_result = cur.fetchone()

                    if conv_result:
                        conversation_id = conv_result[0]

                        # Update booking intent
                        intent_query = """
                        UPDATE booking_intents
                        SET booking_id = %s, status = 'confirmed', updated_at = NOW()
                        WHERE conversation_id = %s
                        """
                        cur.execute(intent_query, (booking_id, conversation_id))
                        conn.commit()

        except Exception as e:
            logger.error(f"Error updating booking intent: {e}")

class ActionCancelBooking(Action):
    def name(self) -> Text:
        return "action_cancel_booking"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        dispatcher.utter_message(
            text="Para cancelar tu cita, por favor proporciona tu número de reserva o llama directamente a nuestro equipo."
        )
        return []

class ActionGetServices(Action):
    def name(self) -> Text:
        return "action_get_services"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            # Get services from database
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = "SELECT name, price FROM services WHERE active = true ORDER BY category, name"
                    cur.execute(query)
                    services = cur.fetchall()

                    if services:
                        services_text = "Estos son nuestros servicios disponibles:\n\n"
                        for service in services:
                            services_text += f"• {service['name']} - ${service['price']}\n"

                        dispatcher.utter_message(text=services_text)
                    else:
                        dispatcher.utter_message(text="En este momento estamos actualizando nuestros servicios. Por favor contacta directamente.")

        except Exception as e:
            logger.error(f"Error getting services: {e}")
            dispatcher.utter_message(text="Hubo un problema consultando los servicios. ¿Podrías intentar de nuevo?")

        return []

class ActionGetStylists(Action):
    def name(self) -> Text:
        return "action_get_stylists"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            # Get stylists from database
            with psycopg2.connect(**DB_CONFIG) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = """
                    SELECT name, specialties, bio
                    FROM users
                    WHERE role = 'stylist' AND active = true
                    ORDER BY name
                    """
                    cur.execute(query)
                    stylists = cur.fetchall()

                    if stylists:
                        stylists_text = "Conoce a nuestros estilistas:\n\n"
                        for stylist in stylists:
                            stylists_text += f"• {stylist['name']}"
                            if stylist['specialties']:
                                stylists_text += f" - Especialidad: {stylist['specialties']}"
                            stylists_text += "\n"

                        dispatcher.utter_message(text=stylists_text)
                    else:
                        dispatcher.utter_message(text="En este momento estamos actualizando la información de nuestros estilistas.")

        except Exception as e:
            logger.error(f"Error getting stylists: {e}")
            dispatcher.utter_message(text="Hubo un problema consultando los estilistas. ¿Podrías intentar de nuevo?")

        return []

class ActionOpenAIResponse(Action):
    """Use OpenAI for general beauty conversations and advice"""

    def name(self) -> Text:
        return "action_openai_response"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            # Get user's message
            user_message = tracker.latest_message.get('text', '')

            # Build conversation context from recent messages
            conversation_context = ""
            events = tracker.events[-6:]  # Last 6 events for context

            for event in events:
                if event.get('event') == 'user':
                    conversation_context += f"Usuario: {event.get('text', '')}\n"
                elif event.get('event') == 'bot':
                    conversation_context += f"Aphrodite: {event.get('text', '')}\n"

            # Get dynamic response from OpenAI
            openai_response = get_openai_response(user_message, conversation_context)

            # Add action buttons for common actions
            buttons = [
                {"title": "Agendar Cita 📅", "payload": "/book_appointment"},
                {"title": "Ver Servicios 💄", "payload": "/ask_services"},
                {"title": "Precios 💰", "payload": "/ask_prices"}
            ]

            dispatcher.utter_message(text=openai_response, buttons=buttons)

            return []

        except Exception as e:
            logger.error(f"Error in OpenAI response action: {e}")
            # Fallback to predefined response
            dispatcher.utter_message(
                text="¡Hola! Soy Aphrodite, tu asistente de belleza. ¿En qué puedo ayudarte hoy? ✨",
                buttons=[
                    {"title": "Agendar Cita", "payload": "/book_appointment"},
                    {"title": "Ver Servicios", "payload": "/ask_services"}
                ]
            )
            return []

class ActionEnhancedGreeting(Action):
    """Enhanced greeting with OpenAI personality"""

    def name(self) -> Text:
        return "action_enhanced_greeting"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            # Get time-based greeting
            current_hour = datetime.now().hour
            if current_hour < 12:
                time_greeting = "Buenos días"
            elif current_hour < 18:
                time_greeting = "Buenas tardes"
            else:
                time_greeting = "Buenas noches"

            # Create personalized greeting
            user_message = f"Saluda al usuario con '{time_greeting}' y pregunta cómo puedes ayudar con belleza"
            openai_response = get_openai_response(user_message)

            # Add quick action buttons
            buttons = [
                {"title": "Reservar Cita 💫", "payload": "/book_appointment"},
                {"title": "Consejos de Belleza ✨", "payload": "Dame un consejo de belleza"},
                {"title": "Ver Servicios 💄", "payload": "/ask_services"}
            ]

            dispatcher.utter_message(text=openai_response, buttons=buttons)
            return []

        except Exception as e:
            logger.error(f"Error in enhanced greeting: {e}")
            # Fallback greeting
            dispatcher.utter_message(
                text="¡Hola! Soy Aphrodite, tu asistente de belleza personal. ¿Cómo puedo ayudarte a verte increíble hoy? ✨"
            )
            return []

class ValidateBookingForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_booking_form"

    def validate_user_name(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate user name."""
        if len(slot_value) >= 2:
            return {"user_name": slot_value}
        else:
            dispatcher.utter_message(text="Por favor proporciona un nombre válido (mínimo 2 caracteres).")
            return {"user_name": None}

    def validate_user_phone(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate phone number."""
        # Remove any formatting characters
        phone = str(slot_value).replace(" ", "").replace("-", "").replace("(", "").replace(")", "")

        if len(phone) >= 10 and phone.isdigit():
            return {"user_phone": phone}
        else:
            dispatcher.utter_message(text="Por favor proporciona un número de teléfono válido (10 dígitos mínimo).")
            return {"user_phone": None}

    def validate_service_type(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate service type."""
        valid_services = ["corte", "color", "peinado", "manicura", "pedicura", "facial", "tratamiento"]

        if any(service in slot_value.lower() for service in valid_services):
            return {"service_type": slot_value}
        else:
            dispatcher.utter_message(text="Servicio no reconocido. Por favor elige entre: corte, color, peinado, manicura, pedicura, o tratamientos faciales.")
            return {"service_type": None}

    def validate_preferred_date(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate preferred date."""
        # For now, accept any date string - in production, you'd want proper date parsing
        if slot_value:
            return {"preferred_date": slot_value}
        else:
            dispatcher.utter_message(text="Por favor proporciona una fecha válida.")
            return {"preferred_date": None}

    def validate_preferred_time(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate preferred time."""
        # Basic time validation - in production, you'd want more sophisticated parsing
        if slot_value:
            return {"preferred_time": slot_value}
        else:
            dispatcher.utter_message(text="Por favor proporciona una hora válida.")
            return {"preferred_time": None}